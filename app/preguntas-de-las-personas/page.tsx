import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MePreguntoPagina } from '@/components/me-pregunto/MePreguntoPagina';
import { mePreguntoParaPagina } from '@/lib/respuestas/paginas-server';

export const metadata: Metadata = {
  title: 'Preguntas de las personas',
  description: 'Preguntas que dejaron personas de todo el mundo y lo que otras personas respondieron.',
};

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
