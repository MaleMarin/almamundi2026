'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ComoFuncionaModal } from '@/components/home/ComoFuncionaModal';
import { HomeFirstPart } from '@/components/home/HomeFirstPart';
import { PropositoModal } from '@/components/home/PropositoModal';
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
  const [cuentaEliminadaToast, setCuentaEliminadaToast] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyMode, setStoryMode] = useState<StoryModalMode>('video');
  const [chosenTopic, setChosenTopic] = useState<ChosenInspirationTopic | null>(null);
  const [comoFuncionaOpen, setComoFuncionaOpen] = useState(false);
  const [propositoOpen, setPropositoOpen] = useState(false);

  useEffect(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    if (u.searchParams.get('cuenta') !== 'eliminada') return;
    queueMicrotask(() => setCuentaEliminadaToast(true));
    const t = window.setTimeout(() => {
      setCuentaEliminadaToast(false);
      u.searchParams.delete('cuenta');
      const q = u.searchParams.toString();
      window.history.replaceState({}, '', q ? `${u.pathname}?${q}` : u.pathname);
    }, 4000);
    return () => window.clearTimeout(t);
  }, []);

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

  const openStory = useCallback((mode: StoryModalMode, clearTopic: boolean) => {
    if (clearTopic) setChosenTopic(null);
    setStoryMode(mode);
    setStoryOpen(true);
  }, []);

  const closeProposito = useCallback(() => {
    setPropositoOpen(false);
    if (typeof window !== 'undefined' && window.location.hash === '#proposito') {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
  }, []);

  const openProposito = useCallback(() => {
    setComoFuncionaOpen(false);
    setPropositoOpen(true);
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#proposito`
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFromHash = () => {
      const h = window.location.hash;
      if (h === '#como-funciona') {
        setComoFuncionaOpen(true);
        setPropositoOpen(false);
      }
      if (h === '#proposito') {
        setPropositoOpen(true);
        setComoFuncionaOpen(false);
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);

    const voiceOpenPurpose = () => {
      setComoFuncionaOpen(false);
      setPropositoOpen(true);
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#proposito`
      );
    };
    window.addEventListener('almamundi:voice:showPurpose', voiceOpenPurpose);

    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('almamundi:voice:showPurpose', voiceOpenPurpose);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#E0E5EC]">
      {cuentaEliminadaToast ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '10px 18px',
            borderRadius: 12,
            background: 'rgba(255, 140, 90, 0.22)',
            border: '1px solid rgba(255, 107, 43, 0.35)',
            color: '#7c2d12',
            fontSize: 13,
            maxWidth: 'min(420px, calc(100vw - 32px))',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          Tu cuenta ha sido eliminada. Hasta pronto.
        </div>
      ) : null}
      {/* Ancla para enlaces /#como-funciona desde todo el sitio */}
      <div id="como-funciona" className="sr-only" aria-hidden>
        Cómo funciona AlmaMundi
      </div>
      <div id="proposito" className="sr-only" aria-hidden>
        Propósito AlmaMundi
      </div>

      <HomeFirstPart
        onShowPurpose={openProposito}
        onShowComoFunciona={() => {
          setPropositoOpen(false);
          setComoFuncionaOpen(true);
          if (typeof window !== 'undefined' && window.location.hash === '#proposito') {
            window.history.replaceState(
              null,
              '',
              `${window.location.pathname}${window.location.search}`
            );
          }
        }}
        onRecordVideo={() => openStory('video', true)}
        onRecordAudio={() => openStory('audio', true)}
        onWriteStory={() => openStory('texto', true)}
        onMediaEducation={() => router.push('/educacion-mediatica')}
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
      <PropositoModal isOpen={propositoOpen} onClose={closeProposito} />
    </main>
  );
}
