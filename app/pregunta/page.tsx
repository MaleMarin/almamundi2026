import { Suspense } from 'react';
import type { Metadata } from 'next';
import PreguntaForm from '@/components/pregunta/PreguntaForm';

export const metadata: Metadata = {
  title: 'La pregunta · AlmaMundi',
  description:
    'Además de contar tu historia, aquí puedes responder. Cada semana lanzamos una pregunta al mundo, y cada respuesta enciende un punto en el mapa.' };

export default function PreguntaPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <PreguntaForm />
      </Suspense>
    </main>
  );
}
