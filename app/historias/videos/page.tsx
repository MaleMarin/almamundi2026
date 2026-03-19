'use client';

/**
 * /historias/videos — Página interior de historias en video con carrusel curvo.
 * Interior: E0E5EC, sans moderna (system UI). Mismo navbar y footer que home/temas.
 * Lista = historias con video de la API + demos locales (public/), sin duplicar id.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { useStories } from '@/hooks/useStories';
import { StoriesFanCarousel } from '@/components/stories/StoriesFanCarousel';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu } from '@/lib/historias-neumorph';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import type { StoryPoint } from '@/lib/map-data/stories';

function isVideoStory(s: StoryPoint): boolean {
  return Boolean(s.videoUrl || s.hasVideo);
}

export default function HistoriasVideosPage() {
  const allStories = useStories();
  const videoStories = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo && isVideoStory(s)
    );
    const apiIds = new Set(fromApi.map((s) => s.id));
    const demos = DEMO_VIDEO_STORIES.filter((d) => !apiIds.has(d.id));
    return [...fromApi, ...demos];
  }, [allStories]);

  return (
    <main className="min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 md:py-6 min-h-[4.25rem] md:min-h-[4.75rem] border-b border-gray-300/50" style={{ backgroundColor: 'rgba(224,229,236,0.95)', boxShadow: '0 4px 24px rgba(163,177,198,0.3)' }}>
        <Link href="/" className="text-xl md:text-2xl font-semibold tracking-tight" style={{ color: neu.textMain }}>AlmaMundi</Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link href="/#intro" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi" />
          <span className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-semibold text-amber-700" style={neu.cardInset}>Videos</span>
          <Link href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <header className="flex-shrink-0 px-6 md:px-12 pt-8 md:pt-12 pb-4 md:pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase mb-2">
          Historias en video
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-800">
          El mundo tiene millones de historias que nadie conoce.
        </h1>
        <p className="text-gray-600 text-base md:text-lg mt-2 max-w-2xl">
          Estas son algunas.
        </p>
      </header>

      <section className="flex-1 min-h-0">
        <StoriesFanCarousel stories={videoStories} />
      </section>

      <Footer />
    </main>
  );
}
