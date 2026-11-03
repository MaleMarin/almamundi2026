import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MePreguntoPagina } from '@/components/me-pregunto/MePreguntoPagina';

export const metadata: Metadata = {
  title: 'Me pregunto… · AlmaMundi',
  description: 'Preguntas que dejaron personas de todo el mundo y lo que otras personas respondieron.',
};

/** Página interna de «Me pregunto…»: todas las preguntas y, con ?p=mp-…, todas las respuestas de una. */
export default function MePreguntoPage() {
  return (
    <Suspense fallback={null}>
      <MePreguntoPagina />
    </Suspense>
  );
}
