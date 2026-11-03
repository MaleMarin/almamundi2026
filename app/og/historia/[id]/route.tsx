import { ImageResponse } from 'next/og';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import { resonanceStripeUnits } from '@/lib/huella/resonance-stripes';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;

/**
 * Tarjeta para WhatsApp y redes de una historia: la imagen de cintas de la historia
 * ocupa toda la tarjeta, con una frase en primera persona que invita a contar la propia.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStoryByIdAsync(id).catch(() => null);
  const title = (story?.title || story?.label || '').trim();
  const units = story?.huellaUnits?.length ? story.huellaUnits : resonanceStripeUnits({
    storyId: id,
    text: story?.body || story?.excerpt || title || id,
    locale: 'es',
  });

  const stripes: { hex: string; width: number }[] = [];
  let x = 0;
  for (let guard = 0; x < W && units.length > 0 && guard < 600; guard++) {
    for (const u of units) {
      const w = Math.min(Math.max(2, Math.round(u.width * 1.4)), W - x);
      if (w <= 0) break;
      stripes.push({ hex: u.hex, width: w });
      x += w;
      if (x >= W) break;
    }
  }

  const shortTitle = title.length > 70 ? `${title.slice(0, 68)}…` : title;

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
            background: 'rgba(245, 244, 242, 0.94)',
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 8, fontWeight: 700, color: '#FF4A1C' }}>ALMAMUNDI</div>
          <div style={{ marginTop: 18, fontSize: 50, lineHeight: 1.15, color: '#3C4655', fontWeight: 600 }}>
            Conté mi historia en AlmaMundi y estos son sus colores. ¿Cuáles serían los de la tuya?
          </div>
          {shortTitle ? (
            <div style={{ marginTop: 18, fontSize: 26, color: '#616C7C' }}>{`«${shortTitle}» · almamundi.org`}</div>
          ) : (
            <div style={{ marginTop: 18, fontSize: 26, color: '#616C7C' }}>almamundi.org</div>
          )}
        </div>
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } }
  );
}
