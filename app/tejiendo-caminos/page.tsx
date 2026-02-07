'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

const StoriesNetwork = dynamic(
  () => import('@/components/StoriesNetwork'),
  { ssr: false }
);

export default function TejiendoCaminosPage() {
  return (
    <div className="min-h-screen bg-[#E8ECF1] text-[#4A5568] font-[system-ui,sans-serif] antialiased">
      {/* Layout: cabecera con glassmorphism */}
      <header
        className="sticky top-0 z-20 px-4 py-4 md:px-8"
        style={{
          background: 'rgba(232,236,241,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 4px 24px rgba(163,177,198,0.15)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#E8ECF1',
              boxShadow: '8px 8px 16px rgba(163,177,198,0.5), -8px -8px 16px rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            <ArrowLeft className="w-5 h-5 text-[#718096]" />
            <span className="text-sm font-medium text-[#4A5568]">Volver</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600/80" aria-hidden />
            <h1
              className="text-xl md:text-2xl font-bold tracking-tight"
              style={{
                color: '#4A5568',
                textShadow: '-2px -2px 4px rgba(255,255,255,0.6), 2px 2px 6px rgba(163,177,198,0.25)',
              }}
            >
              Tejiendo Caminos
            </h1>
          </div>
          <div className="w-[100px] md:w-[120px]" aria-hidden />
        </div>
      </header>

      {/* Panel intro con neumorfismo suave */}
      <section className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
        <div
          className="rounded-3xl px-6 py-5 md:px-8 md:py-6 text-center"
          style={{
            background: '#E8ECF1',
            boxShadow: '9px 9px 18px rgba(163,177,198,0.45), -9px -9px 18px rgba(255,255,255,0.55)',
            border: '1px solid rgba(255,255,255,0.35)',
          }}
        >
          <p className="text-[#718096] text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Una red de historias conectadas. Cada nodo es una historia; cada línea, un camino que las une.
            Arrastra los nodos, haz zoom y haz clic para explorar.
          </p>
        </div>
      </section>

      {/* Contenedor de la red: glassmorphism + neumorfismo */}
      <section className="px-4 pb-12 md:px-8 max-w-6xl mx-auto">
        <div
          className="relative rounded-3xl overflow-hidden min-h-[480px] md:min-h-[560px]"
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: 'inset 4px 4px 12px rgba(255,255,255,0.5), 12px 12px 28px rgba(163,177,198,0.4)',
            border: '1px solid rgba(255,255,255,0.45)',
          }}
        >
          <StoriesNetwork />
        </div>
      </section>

      {/* Pie emocional */}
      <footer className="px-4 py-8 text-center">
        <p className="text-[#718096] text-sm">
          AlmaMundi · Tus historias no se pierden en el scroll
        </p>
      </footer>
    </div>
  );
}
