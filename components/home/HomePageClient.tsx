'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ComoFuncionaModal } from '@/components/home/ComoFuncionaModal';
import { HomeFirstPart } from '@/components/home/HomeFirstPart';
import { MapSectionLocked } from '@/components/politica-v2/MapSectionLocked';
import { StoryModal, type ChosenInspirationTopic, type StoryModalMode } from '@/components/home/StoryModal';

/**
 * Home AlmaMundi — neumorfismo, intro, cuatro tarjetas, mapa (#mapa). Footer en layout raíz.
 * Las tarjetas abren StoryModal; el flujo por temas de inspiración no está en el header.
 *
 * `router.refresh()` al montar evita que, al volver desde páginas internas vía `<Link>`,
 * se reutilice una instantánea antigua de la ruta `/` en la caché del App Router.
 * El footer global vive en `app/layout.tsx`.
 */
export function HomePageClient() {
  const router = useRouter();
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyMode, setStoryMode] = useState<StoryModalMode>('video');
  const [chosenTopic, setChosenTopic] = useState<ChosenInspirationTopic | null>(null);
  const [comoFuncionaOpen, setComoFuncionaOpen] = useState(false);

  useEffect(() => {
    router.refresh();
  }, [router]);

  const closeComoFunciona = useCallback(() => {
    setComoFuncionaOpen(false);
    if (typeof window !== 'undefined' && window.location.hash === '#como-funciona') {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncHash = () => {
      if (window.location.hash === '#como-funciona') setComoFuncionaOpen(true);
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const openStory = useCallback((mode: StoryModalMode, clearTopic: boolean) => {
    if (clearTopic) setChosenTopic(null);
    setStoryMode(mode);
    setStoryOpen(true);
  }, []);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#E0E5EC]">
      {/* Ancla para enlaces /#como-funciona desde todo el sitio */}
      <div id="como-funciona" className="sr-only" aria-hidden>
        Cómo funciona AlmaMundi
      </div>

      <HomeFirstPart
        onShowPurpose={() => scrollToId('intro')}
        onShowComoFunciona={() => setComoFuncionaOpen(true)}
        onRecordVideo={() => openStory('video', true)}
        onRecordAudio={() => openStory('audio', true)}
        onWriteStory={() => openStory('texto', true)}
        onUploadPhoto={() => openStory('foto', true)}
        basePath="/"
      />
      <MapSectionLocked />

      <StoryModal
        isOpen={storyOpen}
        onClose={() => setStoryOpen(false)}
        mode={storyMode}
        chosenTopic={chosenTopic}
        onClearTopic={() => setChosenTopic(null)}
      />

      <ComoFuncionaModal isOpen={comoFuncionaOpen} onClose={closeComoFunciona} />
    </main>
  );
}
