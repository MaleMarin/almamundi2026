import { ImageResponse } from 'next/og';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import { franjasValidas, resonanceStripeUnits, RESONANCE_BG } from '@/lib/huella/resonance-stripes';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';

export const runtime = 'nodejs';

const W = 1080;
const H = 1080;
const PIE = 210;

/**
 * La imagen de cintas de una historia publicada, igual a la de la pantalla final:
 * franjas arriba y, abajo, título, lugar y almamundi.org. Va en el correo de historia publicada.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = /^[A-Za-z0-9_-]{6,60}$/.test(id) ? await getStoryByIdAsync(id).catch(() => null) : null;
  const title = (story?.title || story?.label || '').trim();
  const units =
    franjasValidas(story?.huellaUnits) ??
    resonanceStripeUnits({ storyId: id, text: story?.body || story?.excerpt || title || id, locale: 'es' });
  const lugar = formatPublicPlace(story?.city, story?.country, 'es');

  const campo = H - PIE;
  const total = units.reduce((s, u) => s + u.width, 0) || 1;
  const stripes: { hex: string; width: number }[] = [];
  let acumulado = 0;
  for (const u of units) {
    const x0 = Math.round((acumulado / total) * W);
    acumulado += u.width;
    const x1 = Math.round((acumulado / total) * W);
    if (x1 > x0) stripes.push({ hex: u.hex, width: x1 - x0 });
  }
  const corto = title.length > 48 ? `${title.slice(0, 46)}…` : title;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', background: RESONANCE_BG, fontFamily: 'sans-serif' }}>
        <div style={{ width: W, height: campo, display: 'flex' }}>
          {stripes.map((s, i) => (
            <div key={i} style={{ width: s.width, height: campo, background: s.hex }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: PIE, padding: '0 64px', color: '#1A1916' }}>
          {corto ? <div style={{ fontSize: 44, fontWeight: 600 }}>{corto}</div> : null}
          {lugar ? <div style={{ marginTop: 12, fontSize: 28 }}>{lugar}</div> : null}
          <div style={{ marginTop: 12, fontSize: 24 }}>almamundi.org</div>
        </div>
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } }
  );
}
