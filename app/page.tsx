'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { getAllContent, getHomeCollections } from '@/lib/content';
import { HomeV2Sections } from '@/components/politica-v2/HomeV2Sections';
import { MapSectionLocked } from '@/components/politica-v2/MapSectionLocked';

/**
 * Home V2 — Política Digital.
 * Contenido desde metadatos; mapa intacto (MapSectionLocked); escenas de scroll.
 */
export default function Home() {
  const collections = useMemo(() => {
    const all = getAllContent();
    return getHomeCollections(all);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden relative bg-[#0a0a0f]">
      <style jsx global>{`
        html { scroll-behavior: smooth; }
      `}</style>

      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 md:px-12 h-16 md:h-20 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
        <span className="text-sm font-medium tracking-widest text-[var(--almamundi-orange)] uppercase">
          Política Digital
        </span>
        <nav className="flex gap-6 md:gap-8 text-sm text-white/70">
          <a href="#mapa" className="hover:text-[var(--almamundi-orange)] transition-colors">
            México por estado
          </a>
          <Link href="/privacidad" className="hover:text-[var(--almamundi-orange)] transition-colors">
            Privacidad
          </Link>
        </nav>
      </header>

      <HomeV2Sections
        collections={collections}
        mapSection={<MapSectionLocked />}
      />
    </main>
  );
}
