'use client';

/**
 * /historias/videos — Página interior de historias en video con carrusel curvo.
 * Estética igual que la home (E0E5EC, Avenir). Footer unificado.
 */
import Link from 'next/link';
import { useStories } from '@/hooks/useStories';
import { StoriesCurvedCarousel } from '@/components/stories/StoriesCurvedCarousel';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import type { StoryPoint } from '@/lib/map-data/stories';

const APP_FONT = `'Avenir Light', Avenir, sans-serif`;

function isVideoStory(s: StoryPoint): boolean {
  return Boolean(s.videoUrl || s.hasVideo);
}

export default function HistoriasVideosPage() {
  const allStories = useStories();
  const fromApi = allStories.filter((s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo && isVideoStory(s));
  /** Para el prototipo: si no hay historias con video desde la API, se muestran las de demostración. */
  const videoStories = fromApi.length > 0 ? fromApi : DEMO_VIDEO_STORIES;

  return (
    <main className="min-h-screen flex flex-col bg-[#E0E5EC]" style={{ fontFamily: APP_FONT }}>
      <nav className="flex-shrink-0 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/20 bg-[#E0E5EC]/90 backdrop-blur-lg">
        <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
          AlmaMundi
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
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
            className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
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

      <header className="flex-shrink-0 px-6 pt-6 pb-2">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-amber-700 uppercase mb-1">
          Historias en video
        </p>
        <h1 className="text-2xl md:text-4xl font-serif font-light leading-tight text-gray-800">
          Mira y escucha
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Gira la rueda para explorar. Toca una historia para ver el detalle y reproducir.
        </p>
      </header>

      <section className="flex-1 min-h-0">
        <StoriesCurvedCarousel stories={videoStories} />
      </section>

      <Footer />
    </main>
  );
}
