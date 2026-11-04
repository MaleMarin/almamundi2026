import { ImageResponse } from 'next/og';
import { getAdminDb } from '@/lib/firebase/admin';
import { franjasValidas, resonanceStripeUnits } from '@/lib/huella/resonance-stripes';
import { parseAlmaLocale, type AlmaLocale } from '@/lib/i18n/locale';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;

const FRASE: Record<AlmaLocale, string> = {
  es: 'Conté mi historia en AlmaMundi y estos son sus colores. ¿Cuáles serían los de la tuya?',
  pt: 'Contei minha história no AlmaMundi e estas são as suas cores. Quais seriam as da sua?',
  en: 'I told my story on AlmaMundi and these are its colors. What would yours be?',
};

/**
 * Tarjeta para compartir justo después de enviar una historia (todavía en revisión):
 * solo sus colores y la frase. No muestra título, nombre ni texto.
 */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('c') ?? '';
  let units: { hex: string; width: number }[] = [];
  let locale: AlmaLocale = 'es';
  if (/^[A-Za-z0-9]{8,40}$/.test(id)) {
    try {
      const snap = await getAdminDb().collection('submissions').doc(id).get();
      const d = (snap.data() ?? {}) as Record<string, unknown>;
      locale = parseAlmaLocale(typeof d.locale === 'string' ? d.locale : undefined);
      units =
        franjasValidas(d.huellaUnits) ??
        resonanceStripeUnits({
          storyId: id,
          text: [d.storyTitle, d.context, (d.payload as { text?: unknown } | undefined)?.text]
            .filter((v): v is string => typeof v === 'string')
            .join('\n') || id,
          locale,
        });
    } catch {
      units = resonanceStripeUnits({ storyId: id, text: id, locale });
    }
  }
  if (!units.length) units = resonanceStripeUnits({ storyId: 'almamundi', text: 'almamundi', locale });

  // Una sola composición a todo el ancho, sin repetir el patrón.
  const total = units.reduce((s, u) => s + u.width, 0) || 1;
  const stripes: { hex: string; width: number }[] = [];
  let acumulado = 0;
  for (const u of units) {
    const x0 = Math.round((acumulado / total) * W);
    acumulado += u.width;
    const x1 = Math.round((acumulado / total) * W);
    if (x1 > x0) stripes.push({ hex: u.hex, width: x1 - x0 });
  }

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', position: 'relative', background: '#F5F4F2', fontFamily: 'sans-serif' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, display: 'flex' }}>
          {stripes.map((s, i) => (
            <div key={i} style={{ width: s.width, height: H, background: s.hex }} />
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 56,
            right: 56,
            bottom: 56,
            display: 'flex',
            flexDirection: 'column',
            padding: '40px 48px',
            borderRadius: 28,
            background: 'rgba(245, 244, 242, 0.95)',
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 8, fontWeight: 700, color: '#FF4A1C' }}>ALMAMUNDI</div>
          <div style={{ marginTop: 18, fontSize: 50, lineHeight: 1.15, color: '#3C4655', fontWeight: 600 }}>{FRASE[locale]}</div>
          <div style={{ marginTop: 18, fontSize: 26, color: '#616C7C' }}>almamundi.org</div>
        </div>
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } }
  );
}
