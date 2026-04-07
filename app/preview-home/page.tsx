'use client';

import { useState } from 'react';
import { HomeFirstPart } from '@/components/home/HomeFirstPart';

/**
 * Vista previa de solo la primera parte de la home (header + intro + tarjetas).
 * Ruta: /preview-home
 * Para revisar la parte clonada sin tocar el original. No borra nada.
 */
export default function PreviewHomePage() {
  const [_, setLog] = useState<string[]>([]);
  const add = (msg: string) => setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  return (
    <main className="min-h-screen bg-[#E0E5EC] font-sans">
      <HomeFirstPart
        onShowPurpose={() => add('Propósito')}
        onShowComoFunciona={() => add('¿Cómo funciona?')}
        onRecordVideo={() => add('Graba video')}
        onRecordAudio={() => add('Graba audio')}
        onWriteStory={() => add('Escribe historia')}
        onMediaEducation={() => add('Educación mediática')}
        basePath="/"
      />

      {/* Pie de preview: en el original aquí iría el mapa y el footer */}
      <section className="py-20 px-6 text-center text-gray-500">
        <p className="text-sm">Fin de la primera parte (clone).</p>
        <p className="text-xs mt-2">En la home completa aquí sigue el Mapa y el Footer.</p>
        <p className="text-xs mt-4 max-w-md mx-auto">
          Para usar en el original: copia <code className="bg-white/50 px-1 rounded">components/home/HomeFirstPart.tsx</code> y renderiza{' '}
          <code className="bg-white/50 px-1 rounded">&lt;HomeFirstPart ... /&gt;</code> sin borrar nada del original.
        </p>
      </section>
    </main>
  );
}
