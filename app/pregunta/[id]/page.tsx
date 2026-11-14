import { permanentRedirect } from 'next/navigation';
import { resolveQuestionId } from '@/lib/pregunta-semana';
import { idPreguntaHilo } from '@/lib/hilos';
import { esMePreguntaId } from '@/lib/me-pregunto/shared';

export const dynamic = 'force-dynamic';

/** El mosaico de respuestas breves ya no se publica. */
export default async function PreguntaRespuestasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (esMePreguntaId(id)) {
    permanentRedirect(`/preguntas-de-las-personas?p=${encodeURIComponent(id)}`);
  }
  const pregunta = resolveQuestionId(id) ?? idPreguntaHilo(id);
  permanentRedirect(pregunta ? `/preguntas?p=${encodeURIComponent(pregunta)}` : '/preguntas');
}
