import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RespuestasPagina } from '@/components/me-pregunto/RespuestasPagina';

export const metadata: Metadata = {
  title: 'Respuestas a las preguntas de AlmaMundi',
  description: 'Lo que respondieron otras personas a las preguntas de las cintas.',
};

/** Página interna: todas las respuestas publicadas de una pregunta de las cintas (?p=id). */
export default function RespuestasPage() {
  return (
    <Suspense fallback={null}>
      <RespuestasPagina />
    </Suspense>
  );
}
