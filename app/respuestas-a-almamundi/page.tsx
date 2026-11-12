import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { RespuestasPagina } from '@/components/me-pregunto/RespuestasPagina';
import { hiloPorId, preguntaHiloPorId } from '@/lib/hilos';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { ME_PREGUNTO_MAPA } from '@/lib/i18n/me-pregunto';
import { metadataDePregunta, primerParametro } from '@/lib/respuestas/metadata-detalle';
import { respuestasHilosParaPagina } from '@/lib/respuestas/paginas-server';

type Props = { searchParams: Promise<{ p?: string | string[] }> };

const METADATA: Metadata = {
  title: 'Respuestas a las preguntas de AlmaMundi',
  description: 'Lee lo que las personas respondieron a las preguntas de las cintas.',
};

/**
 * Sin ?p (o con un id que no existe o sin respuestas publicadas): los metadatos de la página.
 * Con ?p de una pregunta que ya tiene respuestas publicadas: dirección, título y bajada propios.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const pregunta = preguntaHiloPorId(primerParametro((await searchParams).p));
  if (!pregunta) return METADATA;
  const respuestas = await respuestasHilosParaPagina();
  if (!respuestas?.some((item) => item.questionId === pregunta.id)) return METADATA;
  const locale = parseAlmaLocale((await cookies()).get(ALMA_LOCALE_COOKIE)?.value);
  const tema = hiloPorId(pregunta.hiloId)?.nombre[locale];
  const texto = pregunta.texto[locale];
  return metadataDePregunta({
    ruta: '/respuestas-a-almamundi',
    id: pregunta.id,
    titulo: texto,
    descripcion: `${tema ? `${tema}: ` : ''}${texto} ${ME_PREGUNTO_MAPA[locale].introRespuestas}`,
    locale,
  });
}

/**
 * Página interna: todas las respuestas publicadas de una pregunta de las cintas (?p=id).
 * Las respuestas llegan desde el servidor: quedan en el HTML, sin esperar a JavaScript.
 */
export default async function RespuestasPage() {
  const iniciales = await respuestasHilosParaPagina();
  return (
    <Suspense fallback={null}>
      <RespuestasPagina iniciales={iniciales} />
    </Suspense>
  );
}
