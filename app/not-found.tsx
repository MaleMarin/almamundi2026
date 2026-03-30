'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';

import Link from 'next/link';
import { Home, MapPin, Video, CornerDownLeft } from 'lucide-react';

/**
 * Página 404 AlmaMundi — neumorfismo y naranja marca.
 * Estilo alineado con `HomeFirstPart` y tokens CSS globales.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#E0E5EC] text-slate-800">
      <div className="max-w-3xl w-full p-10 md:p-14 rounded-[40px] shadow-[12px_12px_20px_#bfc6cc,-12px_-12px_20px_#ffffff] bg-[#E0E5EC] border-4 border-[#ff4500]">
        <header className="text-center mb-10">
          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-6 drop-shadow-[2px_2px_4px_#ffffff,-2px_-2px_4px_#bfc6cc]">
            404
          </h1>
          <p className="text-xl md:text-2xl font-medium text-slate-700/90 leading-relaxed">
            Parece que te has perdido en el mapa de AlmaMundi. Esta historia no existe aquí.
          </p>
        </header>
        <nav className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
          <HomeHardLink
            href="/#mapa"
            className="group flex items-center gap-5 p-6 rounded-3xl transition-all duration-300 shadow-[8px_8px_16px_#bfc6cc,-8px_-8px_16px_#ffffff] hover:shadow-[4px_4px_8px_#bfc6cc,-4px_-4px_8px_#ffffff] bg-[#E0E5EC] text-slate-800 hover:text-[#ff4500]"
          >
            <div className="p-4 rounded-full bg-[#E0E5EC] group-hover:bg-[#ff4500]/5 shadow-[inner_4px_4px_8px_#bfc6cc,inner_-4px_-4px_8px_#ffffff]">
              <MapPin className="size-8 text-[#ff4500]" />
            </div>
            <div>
              <span className="block text-lg font-semibold text-slate-900">Volver al Globo</span>
              <span className="block text-sm text-slate-700">Reinicia tu exploración del mundo</span>
            </div>
            <CornerDownLeft className="ml-auto size-6 text-slate-500/60 group-hover:text-[#ff4500] transition-colors" />
          </HomeHardLink>
          <Link
            href="/historias/videos"
            className="group flex items-center gap-5 p-6 rounded-3xl transition-all duration-300 shadow-[8px_8px_16px_#bfc6cc,-8px_-8px_16px_#ffffff] hover:shadow-[4px_4px_8px_#bfc6cc,-4px_-4px_8px_#ffffff] bg-[#E0E5EC] text-slate-800 hover:text-[#ff4500]"
          >
            <div className="p-4 rounded-full bg-[#E0E5EC] group-hover:bg-[#ff4500]/5 shadow-[inner_4px_4px_8px_#bfc6cc,inner_-4px_-4px_8px_#ffffff]">
              <Video className="size-8 text-[#ff4500]" />
            </div>
            <div>
              <span className="block text-lg font-semibold text-slate-900">Ver Historias</span>
              <span className="block text-sm text-slate-700">Explora las últimas noticias y videos</span>
            </div>
            <CornerDownLeft className="ml-auto size-6 text-slate-500/60 group-hover:text-[#ff4500] transition-colors" />
          </Link>
        </nav>
        <footer className="mt-14 text-center border-t border-slate-300 pt-8">
          <HomeHardLink
            href="/"
            className="inline-flex items-center gap-2.5 text-slate-700 hover:text-[#ff4500] group transition-colors"
          >
            <Home size={18} className="text-slate-500 group-hover:text-[#ff4500]" />
            Ir al inicio
          </HomeHardLink>
        </footer>
      </div>
    </main>
  );
}
