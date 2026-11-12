import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { MePreguntoPagina } from '@/components/me-pregunto/MePreguntoPagina';
import { conAnio } from '@/lib/anio-publico';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import { preguntaAlias } from '@/lib/i18n/pregunta-messages';
import { esMePreguntaId } from '@/lib/me-pregunto/shared';
import { metadataDePregunta, primerParametro } from '@/lib/respuestas/metadata-detalle';
import { mePreguntoParaPagina } from '@/lib/respuestas/paginas-server';

type Props = { searchParams: Promise<{ p?: string | string[] }> };

const METADATA: Metadata = {
  title: 'Preguntas de las personas',
  description: 'Preguntas que dejaron personas de todo el mundo y lo que otras personas respondieron.',
};

/**
 * Sin ?p (o con un id que no corresponde a una pregunta publicada): los metadatos de la página.
 * Con ?p de una pregunta aprobada de la lista pública: dirección, título y bajada propios.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const pedida = primerParametro((await searchParams).p);
  if (!esMePreguntaId(pedida)) return METADATA;
  const pregunta = (await mePreguntoParaPagina())?.preguntas.find((p) => p.id === pedida);
  if (!pregunta) return METADATA;
  const locale = parseAlmaLocale((await cookies()).get(ALMA_LOCALE_COOKIE)?.value);
  const lugar = conAnio(formatPublicPlace(pregunta.city, pregunta.country, locale), pregunta.anio);
  return metadataDePregunta({
    ruta: '/preguntas-de-las-personas',
    id: pregunta.id,
    titulo: pregunta.texto,
    descripcion: `${pregunta.texto} ${ME_PREGUNTO_UI[locale].loPregunta(preguntaAlias(pregunta.alias), lugar)}.`,
    locale,
  });
}

/**
 * Página interna de «Me pregunto…»: todas las preguntas y, con ?p=mp-…, todas las respuestas de una.
 * Preguntas y respuestas llegan desde el servidor: quedan en el HTML, sin esperar a JavaScript.
 */
export default async function MePreguntoPage() {
  const inicial = await mePreguntoParaPagina();
  return (
    <Suspense fallback={null}>
      <MePreguntoPagina inicial={inicial} />
    </Suspense>
  );
}
