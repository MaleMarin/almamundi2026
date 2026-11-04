import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;
const COLORES = ['#FFD000', '#FF6200', '#FF1A1A', '#FF7EB6', '#A8E000', '#00B140', '#0047FF', '#7A12E0', '#B07CFF', '#FF0A8A', '#00C2D6', '#A0003C'];

/** Tarjeta general del sitio para WhatsApp y redes: cortina de cintas y la frase de la portada. */
export async function GET() {
  const cintas: { color: string; w: number }[] = [];
  let x = 0;
  let i = 0;
  while (x < W) {
    const w = 14 + ((i * 37) % 23);
    cintas.push({ color: COLORES[(i * 7) % COLORES.length]!, w: Math.min(w, W - x) });
    x += w;
    i += 1;
  }
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
