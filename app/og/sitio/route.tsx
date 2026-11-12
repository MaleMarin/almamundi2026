import { ImageResponse } from 'next/og';
import { cintasCortinaSitio } from '@/lib/cortina-sitio';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;

/** Tarjeta general del sitio para WhatsApp y redes: cortina de cintas y la frase de la portada. */
export async function GET() {
  let x = 0;
  const cintas = cintasCortinaSitio(W).map((c) => {
    const w = Math.min(c.w, W - x);
    x += c.w;
    return { color: c.color, w };
  });
  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', position: 'relative', background: '#F5F4F2', fontFamily: 'sans-serif' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, display: 'flex' }}>
          {cintas.map((c, k) => (
            <div key={k} style={{ width: c.w, height: H, background: c.color }} />
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
          <div style={{ marginTop: 18, fontSize: 52, lineHeight: 1.15, color: '#3C4655', fontWeight: 600 }}>
            Historias que no se pierden en el scroll
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } }
  );
}
