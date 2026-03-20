'use client';

/**
 * /historias/audios — Listado de historias en audio. Misma lógica de movimiento que videos (carrusel en abanico).
 * Escuchar = reproductor in-place (portal), no navega a otra página.
 */
import { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { useStories } from '@/hooks/useStories';
import { useMiColeccion } from '@/hooks/useMiColeccion';
import { StoriesFanCarousel } from '@/components/stories/StoriesFanCarousel';
import AudioPlayer, { type HistoriaAudio } from '@/components/historia/AudioPlayer';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import { storyToHistoriaAudio } from '@/lib/historias/audio-adapter';
import { MOCK_STORIES } from '@/lib/almamundi/mock-data';
import type { StoryPoint } from '@/lib/map-data/stories';

function isAudioStory(s: StoryPoint): boolean {
  return Boolean(s.audioUrl || (s as StoryPoint & { hasAudio?: boolean }).hasAudio);
}

const DEMO_AUDIO_STORY: StoryPoint = {
  id: 'demo-audio-1',
  lat: 0,
  lng: 0,
  label: 'Demo audio',
  title: 'La voz de mi abuela que casi olvido',
  authorName: 'Carlos Ibáñez',
  city: 'Oaxaca',
  country: 'México',
  audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  thumbnailUrl: 'https://picsum.photos/seed/audio1/800/800',
  hasAudio: true,
  publishedAt: new Date().toISOString(),
};

function storyToHistoriaAudioOrDemo(s: StoryPoint): HistoriaAudio {
  if (s.id === 'demo-audio-1') {
    const m = MOCK_STORIES.audio;
    return {
      id: m.id,
      titulo: m.titulo,
      subtitulo: m.subtitulo,
      audioUrl: m.audioUrl,
      thumbnailUrl: m.thumbnailUrl,
      duracion: m.duracion,
      fecha: m.fecha,
      citaDestacada: m.citaDestacada,
      frases: m.frases,
      autor: { nombre: m.autor.nombre, avatar: m.autor.avatar, ubicacion: m.autor.ubicacion, bio: (m.autor as { bio?: string }).bio },
      tags: m.tags,
    };
  }
  return storyToHistoriaAudio(s);
}

export default function HistoriasAudiosPage() {
  const [selectedForAudio, setSelectedForAudio] = useState<StoryPoint | null>(null);
  const allStories = useStories();
  const { add: saveToCollection, isSaved: isSavedInCollection } = useMiColeccion();
  const audioStories = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo && isAudioStory(s)
    );
    const hasDemo = fromApi.some((s) => s.id === DEMO_AUDIO_STORY.id);
    return hasDemo ? fromApi : [DEMO_AUDIO_STORY, ...fromApi];
  }, [allStories]);

  const historiaParaPlayer = selectedForAudio ? storyToHistoriaAudioOrDemo(selectedForAudio) : null;

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
          <span className={historiasInterior.navActiveClassName} style={{ ...neu.cardInset, color: 'var(--almamundi-orange)' }}>Audios</span>
          <Link href="/historias/videos" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Videos</Link>
          <Link href="/historias/escrito" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Escritos</Link>
          <Link href="/historias/fotos" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Fotografías</Link>
          <Link href="/#mapa" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <div className={historiasInterior.contentWrapClassName}>
        <header className={historiasInterior.headerClassName}>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--almamundi-orange)' }}>
            Historias en audio
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-800">
            Voces que cuentan.
          </h1>
          <p className="text-gray-600 text-base md:text-lg mt-2 max-w-2xl">
            Estas son algunas.
          </p>
          {audioStories.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const i = Math.floor(Math.random() * audioStories.length);
                setSelectedForAudio(audioStories[i]);
              }}
              className="mt-6 px-6 py-3 rounded-full text-base font-medium transition-colors"
              style={{
                border: '1px solid var(--almamundi-orange)',
                color: 'var(--almamundi-orange)',
                background: 'transparent',
              }}
            >
              Escuchar al azar
            </button>
          )}
        </header>

        <section className={`${historiasInterior.sectionGrowClassName} min-h-0`}>
          <StoriesFanCarousel
            stories={audioStories}
            mode="audio"
            onSelectStory={(s) => setSelectedForAudio(s)}
            onSaveToCollection={saveToCollection}
            isSavedInCollection={isSavedInCollection}
          />
        </section>
      </div>

      <Footer />

      {typeof document !== 'undefined' && historiaParaPlayer && ReactDOM.createPortal(
        <AudioPlayer
          historia={historiaParaPlayer}
          onClose={() => setSelectedForAudio(null)}
        />,
        document.body
      )}
    </main>
  );
}
