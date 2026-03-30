'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';

import { useEffect } from 'react';

export default function MapaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[mapa]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0F172A] text-white p-6">
      <h1 className="text-xl font-semibold text-white/95">Algo salió mal en el mapa</h1>
      <p className="text-white/60 text-sm text-center max-w-md">
        No se pudo cargar esta vista. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
        >
          Intentar de nuevo
        </button>
        <HomeHardLink
          href="/"
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
        >
          Ir al inicio
        </HomeHardLink>
      </div>
    </div>
  );
}
