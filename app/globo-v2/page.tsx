'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';

import dynamic from 'next/dynamic';

const GlobeV2 = dynamic(() => import('@/components/globe/GlobeV2').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0 flex h-[100dvh] w-full items-center justify-center bg-black text-white/80">
      <p className="text-[length:var(--fs-pequeno)]">Cargando GlobeV2…</p>
    </div>
  ) });

/**
 * Vista previa aislada del globo R3F (misma base que el globo embebido en la home).
 * Viewport fijo para que el canvas tenga altura real (evita franja negra).
 */
export default function GloboV2Page() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-black">
      <GlobeV2
        className="fixed inset-0 z-0 h-[100dvh] w-full min-h-0 bg-black [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none"
      />
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex justify-between gap-4 p-4 text-white/80">
        <span className="text-[length:var(--fs-etiqueta)] font-semibold uppercase tracking-[0.12em]">GlobeV2 · Beta</span>
        <HomeHardLink
          href="/"
          className="btn-am-neutro pointer-events-auto px-3 py-1.5 text-[length:var(--fs-pequeno)]"
        >
          Volver al inicio
        </HomeHardLink>
      </div>
    </div>
  );
}
