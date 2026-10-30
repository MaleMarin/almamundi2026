import { permanentRedirect } from 'next/navigation';
import { resolveQuestionId } from '@/lib/pregunta-semana';

export const dynamic = 'force-dynamic';

/** La pregunta breve ya no se publica. El hilo vive en /preguntas. */
export default async function PreguntaPage({
  searchParams,
}: {
  searchParams: Promise<{ pregunta?: string | string[]; p?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = first(params.p) || first(params.pregunta);
  const id = resolveQuestionId(raw);
  permanentRedirect(id ? `/preguntas?p=${encodeURIComponent(id)}` : '/preguntas');
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}
