import { permanentRedirect } from 'next/navigation';
import { resolveQuestionId } from '@/lib/pregunta-semana';

export const dynamic = 'force-dynamic';

/** El mosaico de respuestas breves ya no se publica. */
export default async function PreguntaRespuestasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pregunta = resolveQuestionId(id);
  permanentRedirect(pregunta ? `/preguntas?p=${encodeURIComponent(pregunta)}` : '/preguntas');
}
