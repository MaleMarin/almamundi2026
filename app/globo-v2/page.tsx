'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const GlobeV2 = dynamic(() => import('@/components/globe/GlobeV2').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0 flex h-[100dvh] w-full items-center justify-center bg-black text-white/80">
      <p className="text-sm tracking-wide">Cargando GlobeV2…</p>
    </div>
  ),
});

/**
 * Vista previa aislada del globo R3F (misma base que el globo embebido en la home).
 * Viewport fijo para que el canvas tenga altura real (evita franja negra).
 */
export default function GloboV2Page() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-black">
      <GlobeV2 className="fixed inset-0 z-0 h-[100dvh] w-full min-h-0 bg-black [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex justify-between gap-4 p-4 text-white/80">
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">GlobeV2 · Beta</span>
        <Link
          href="/"
          className="pointer-events-auto text-sm underline decoration-white/30 underline-offset-4 hover:text-[#ff4500]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
