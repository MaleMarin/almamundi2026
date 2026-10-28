import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RespuestasMosaic from '@/components/pregunta/RespuestasMosaic';
import { preguntaPorId, resolveQuestionId } from '@/lib/pregunta-semana';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pregunta = preguntaPorId(resolveQuestionId(id));
  return {
    title: pregunta ? `${pregunta.tema.es} · AlmaMundi` : 'La pregunta · AlmaMundi' };
}

export default async function PreguntaRespuestasPage({ params }: Props) {
  const { id } = await params;
  const questionId = resolveQuestionId(id);
  const pregunta = questionId ? preguntaPorId(questionId) : null;
  if (!pregunta) notFound();
  return (
    <main>
      <RespuestasMosaic questionId={pregunta.id} />
    </main>
  );
}
