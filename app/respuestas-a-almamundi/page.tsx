import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RespuestasPagina } from '@/components/me-pregunto/RespuestasPagina';
import { respuestasHilosParaPagina } from '@/lib/respuestas/paginas-server';

export const metadata: Metadata = {
  title: 'Respuestas a las preguntas de AlmaMundi',
  description: 'Lee lo que las personas respondieron a las preguntas de las cintas.',
};

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
