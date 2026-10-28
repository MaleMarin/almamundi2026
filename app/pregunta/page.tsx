import { Suspense } from 'react';
import type { Metadata } from 'next';
import PreguntaForm from '@/components/pregunta/PreguntaForm';

export const metadata: Metadata = {
  title: 'La pregunta · AlmaMundi',
  description:
    'Cada semana, una pregunta para todo el mundo. Responde en un minuto y descubre cómo contestan otros.',
};

export default function PreguntaPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <PreguntaForm />
      </Suspense>
    </main>
  );
}
