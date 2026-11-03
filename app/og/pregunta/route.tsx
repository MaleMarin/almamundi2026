import { ImageResponse } from 'next/og';
import { hiloPorId, preguntaHiloPorId } from '@/lib/hilos';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { mePreguntaAprobada } from '@/lib/me-pregunto/server';
import { esMePreguntaId } from '@/lib/me-pregunto/shared';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;

/** Tarjeta para WhatsApp y redes de una pregunta: la pregunta sobre el color de su cinta. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('p');
  const pregunta = preguntaHiloPorId(id);
  const tema = hiloPorId(pregunta?.hiloId ?? id);
  // Pregunta que dejó una persona: se muestra la pregunta real y desde dónde la hizo.
  const persona = esMePreguntaId(id) ? await mePreguntaAprobada(getAdminDb(), id).catch(() => null) : null;
  const lugar = persona ? formatPublicPlace(persona.city, persona.country, 'es') : '';
  const color = persona ? '#FF4A1C' : tema?.color ?? '#FF4A1C';
  const texto = persona?.texto ?? pregunta?.texto.es ?? '¿Qué historia guardas que nadie te ha preguntado?';
  const temaNombre = persona
    ? lugar
      ? `Alguien en ${lugar} pregunta`
      : 'Alguien pregunta'
    : tema?.nombre.es ?? 'Preguntas para ti';
  const pie = persona ? 'Respóndela tú en almamundi.org' : 'Tenemos una pregunta para ti · almamundi.org';

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
        <div style={{ fontSize: 28, color: '#616C7C' }}>{pie}</div>
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': persona ? 'public, max-age=3600' : 'public, max-age=86400' } }
  );
}
