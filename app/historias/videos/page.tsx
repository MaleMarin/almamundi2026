'use client';

/**
 * /historias/videos — Página interior de historias en video con carrusel curvo.
 * Interior: E0E5EC, sans moderna (system UI). Footer unificado.
 * Lista = historias con video de la API + demos locales (public/), sin duplicar id.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { useStories } from '@/hooks/useStories';
import { CinemaGallery } from '@/components/stories/CinemaGallery';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import type { StoryPoint } from '@/lib/map-data/stories';

const APP_FONT = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

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
    <main className="min-h-screen flex flex-col bg-[#E0E5EC]" style={{ fontFamily: APP_FONT }}>
      <nav className="flex-shrink-0 flex items-center justify-between px-6 md:px-12 py-5 md:py-6 min-h-[4.25rem] md:min-h-[4.75rem] border-b border-white/20 bg-[#E0E5EC]/90 backdrop-blur-lg">
        <Link href="/" className="text-xl md:text-2xl font-semibold tracking-tight text-gray-700 hover:text-gray-900 transition-colors">
          AlmaMundi
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link
            href="/"
            className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-medium text-gray-600 transition-colors"
            style={{
              backgroundColor: '#E0E5EC',
              boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            Inicio
          </Link>
          <HistoriasAccordion
            variant="header"
            className="[&_button]:btn-almamundi"
            buttonStyle={{
              backgroundColor: '#E0E5EC',
              boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.35)',
              color: '#4A5568',
              fontFamily: APP_FONT,
            }}
          />
          <Link
            href="/#mapa"
            className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-medium text-gray-600 transition-colors"
            style={{
              backgroundColor: '#E0E5EC',
              boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            Mapa
          </Link>
        </div>
      </nav>

      <header className="flex-shrink-0 px-6 md:px-12 pt-8 md:pt-12 pb-4 md:pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase mb-2">
          Historias en video
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-800">
          Mira y escucha
        </h1>
        <p className="text-gray-600 text-base md:text-lg mt-2 max-w-2xl">
          Explora el carrusel, elige una historia y reproduce el video.
        </p>
      </header>

      <section className="flex-1 min-h-0">
        <CinemaGallery stories={videoStories} />
      </section>

      <Footer />
    </main>
  );
}
