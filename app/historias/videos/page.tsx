'use client';

/**
 * /historias/videos — Página interior de historias en video con carrusel curvo.
 * Interior: E0E5EC, sans moderna (system UI). Mismo navbar y footer que home/temas.
 * Lista = historias con video de la API + demos locales (public/), sin duplicar id.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { useStories } from '@/hooks/useStories';
import { useMiColeccion } from '@/hooks/useMiColeccion';
import { StoriesFanCarousel } from '@/components/stories/StoriesFanCarousel';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import type { StoryPoint } from '@/lib/map-data/stories';

function isVideoStory(s: StoryPoint): boolean {
  return Boolean(s.videoUrl || s.hasVideo);
}

export default function HistoriasVideosPage() {
  const allStories = useStories();
  const { add: saveToCollection, isSaved: isSavedInCollection } = useMiColeccion();
  const videoStories = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo && isVideoStory(s)
    );
    const apiIds = new Set(fromApi.map((s) => s.id));
    const demos = DEMO_VIDEO_STORIES.filter((d) => !apiIds.has(d.id));
    return [...fromApi, ...demos];
  }, [allStories]);

  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <Link href="/" className="flex items-center flex-shrink-0 min-w-0 pr-2">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </Link>
        <div className={historiasInterior.navLinksRowClassName}>
          <Link href="/#intro" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi [&_button]:text-base [&_button]:md:text-lg [&_button]:px-5 [&_button]:py-3 [&_button]:md:px-6" />
          <span className={historiasInterior.navActiveClassName} style={{ ...neu.cardInset, color: 'var(--almamundi-orange)' }}>Videos</span>
          <Link href="/historias/audios" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Audios</Link>
          <Link href="/historias/escrito" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Escritos</Link>
          <Link href="/historias/fotos" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Fotografías</Link>
          <Link href="/#mapa" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <div className={historiasInterior.contentWrapClassName}>
        <header className={historiasInterior.headerClassName}>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--almamundi-orange)' }}>
            Historias en video
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-800">
            El mundo tiene millones de historias que nadie conoce.
          </h1>
          <p className="text-gray-600 text-base md:text-lg mt-2 max-w-2xl">
            Estas son algunas.
          </p>
        </header>

        <section className={`${historiasInterior.sectionGrowClassName} min-h-0`}>
          <StoriesFanCarousel
            stories={videoStories}
            onSaveToCollection={saveToCollection}
            isSavedInCollection={isSavedInCollection}
          />
        </section>
      </div>

      <Footer />
    </main>
  );
}
