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
import { neu } from '@/lib/historias-neumorph';
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
    <main className="min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 md:py-6 min-h-[4.25rem] md:min-h-[4.75rem] border-b border-gray-300/50" style={{ backgroundColor: 'rgba(224,229,236,0.95)', boxShadow: '0 4px 24px rgba(163,177,198,0.3)' }}>
        <Link href="/" className="text-xl md:text-2xl font-semibold tracking-tight" style={{ color: neu.textMain }}>AlmaMundi</Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link href="/#intro" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</Link>
          <Link href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</Link>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi" />
          <span className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem] font-semibold text-amber-700" style={neu.cardInset}>Audio</span>
          <Link href="/historias/videos" className="px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Videos</Link>
          <Link href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</Link>
        </div>
      </nav>

      <header className="flex-shrink-0 px-6 md:px-12 pt-8 md:pt-12 pb-4 md:pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase mb-2">
          Historias en audio
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-800">
          Voces que cuentan.
        </h1>
        <p className="text-gray-600 text-base md:text-lg mt-2 max-w-2xl">
          Estas son algunas.
        </p>
      </header>

      <section className="flex-1 min-h-0">
        <StoriesFanCarousel
          stories={audioStories}
          mode="audio"
          onSelectStory={(s) => setSelectedForAudio(s)}
          onSaveToCollection={saveToCollection}
          isSavedInCollection={isSavedInCollection}
        />
      </section>

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
