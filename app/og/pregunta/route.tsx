import { ImageResponse } from 'next/og';
import { hiloPorId, preguntaHiloPorId } from '@/lib/hilos';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;

/** Tarjeta para WhatsApp y redes de una pregunta: la pregunta sobre el color de su cinta. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('p');
  const pregunta = preguntaHiloPorId(id);
  const tema = hiloPorId(pregunta?.hiloId ?? id);
  const color = tema?.color ?? '#FF4A1C';
  const texto = pregunta?.texto.es ?? '¿Qué historia guardas que nadie te ha preguntado?';
  const temaNombre = tema?.nombre.es ?? 'Preguntas para ti';

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: '#F5F4F2',
          borderLeft: `40px solid ${color}`,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 26, letterSpacing: 8, fontWeight: 700, color: '#FF4A1C' }}>ALMAMUNDI</div>
          <div style={{ fontSize: 26, color: '#616C7C' }}>{`· ${temaNombre}`}</div>
        </div>
        <div style={{ fontSize: texto.length > 70 ? 54 : 64, lineHeight: 1.15, color: '#3C4655', fontWeight: 600 }}>
          {texto}
        </div>
        <div style={{ fontSize: 28, color: '#616C7C' }}>Tenemos una pregunta para ti · almamundi.org</div>
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': 'public, max-age=86400' } }
  );
}
