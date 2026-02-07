'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import HuellasMap from '@/components/home/HuellasMap';

export default function ExploraPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F5] text-[#4A4A4A] font-sans">
      <header className="px-6 py-4 shadow-sm sticky top-0 z-10 bg-[#FDF9F5]/80 backdrop-blur-md border-b border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-sm font-semibold text-[#5F4B32]">
            Almamundi
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#B8860B]" aria-hidden />
            <h1 className="text-lg font-bold tracking-tight text-[#6B4226]">
              Explora Historias
            </h1>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-[#6B4226]">
          Un mapa de emociones vivas
        </h2>
        <p className="text-[#5A524C] max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Explora relatos por su tono emocional, conecta experiencias similares y contribuye a la red de memorias humanas.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-xl shadow-lg bg-white/60 border border-white/40 backdrop-blur-xl overflow-hidden min-h-[400px]">
          <HuellasMap compact />
        </div>
      </section>

      <footer className="text-center text-xs text-[#999] py-8">
        <p>Almamundi · Historias humanas con emoción</p>
      </footer>
    </main>
  );
}
