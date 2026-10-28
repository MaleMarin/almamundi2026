'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { ComoFuncionaModal } from '@/components/home/ComoFuncionaModal';
import { HomeFirstPart } from '@/components/home/HomeFirstPart';
import { PropositoModal } from '@/components/home/PropositoModal';
import { MapSectionLocked } from '@/components/politica-v2/MapSectionLocked';
import { StoryModal, type ChosenInspirationTopic, type StoryModalMode } from '@/components/home/StoryModal';
import { contarHref, parseContarFormat, contarIndexHref } from '@/lib/contar-routes';
import { hardNavigateTo } from '@/lib/home-hard-nav';
import { PREGUNTA_UI, preguntasDeLaSemana } from '@/lib/pregunta-semana';
import { PREGUNTA_COPY } from '@/lib/i18n/pregunta-messages';
import {
  navigateToHomeMapa,
  primeMapAmbientFromNavGesture,
  scrollToHomeMapaSection,
} from '@/lib/mapa-home-nav';

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
  const pathname = usePathname() ?? '/';
  const { locale } = useHomeLocale();
  const preguntaVigente = preguntasDeLaSemana().vigente;
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
    router.push(contarHref(mode));
  }, [router]);

  const closeStory = useCallback(() => {
    setStoryOpen(false);
    if (parseContarFormat(pathname)) {
      router.replace(contarIndexHref());
    }
  }, [pathname, router]);

  const exploreMapFromStory = useCallback(() => {
    setStoryOpen(false);
    primeMapAmbientFromNavGesture();
    hardNavigateTo('/?section=mapa');
  }, []);

  useLayoutEffect(() => {
    const format = parseContarFormat(pathname);
    if (format) {
      setStoryMode(format);
      setStoryOpen(true);
      return;
    }
    setStoryOpen(false);
  }, [pathname]);

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

  const goToHistoriasFromProposito = useCallback(() => {
    closeProposito();
    if (typeof window === 'undefined') return;
    const onHome =
      window.location.pathname === '/' || window.location.pathname === '';
    if (onHome) {
      window.history.replaceState(null, '', '/#historias');
      window.requestAnimationFrame(() => {
        document.getElementById('historias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    hardNavigateTo('/contar');
  }, [closeProposito]);

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

  const syncModalsFromHash = useCallback(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    if (h === '#como-funciona') {
      setComoFuncionaOpen(true);
      setPropositoOpen(false);
      return;
    }
    if (h === '#proposito') {
      setPropositoOpen(true);
      setComoFuncionaOpen(false);
      return;
    }
    setPropositoOpen(false);
    setComoFuncionaOpen(false);
  }, []);

  useLayoutEffect(() => {
    syncModalsFromHash();
  }, [syncModalsFromHash]);

  /** Llegada con `/#mapa` o `/?section=mapa` (menú Mapa, redirect desde `/mapa`). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    const wantsMapa = u.hash === '#mapa' || u.searchParams.get('section') === 'mapa';
    if (!wantsMapa) return;
    navigateToHomeMapa();
    const retry = window.setInterval(() => {
      if (!document.getElementById('mapa')) return;
      scrollToHomeMapaSection();
      window.clearInterval(retry);
    }, 120);
    const stop = window.setTimeout(() => window.clearInterval(retry), 4000);
    return () => {
      window.clearInterval(retry);
      window.clearTimeout(stop);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHash = () => {
      if (window.location.hash === '#mapa') scrollToHomeMapaSection();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('hashchange', syncModalsFromHash);
    window.addEventListener('popstate', syncModalsFromHash);

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
      window.removeEventListener('hashchange', syncModalsFromHash);
      window.removeEventListener('popstate', syncModalsFromHash);
      window.removeEventListener('almamundi:voice:showPurpose', voiceOpenPurpose);
    };
  }, [syncModalsFromHash]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#E0E5EC]">
      <div className="font-home">
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
        onRecordPhoto={() => openStory('foto', true)}
        onMediaEducation={() => router.push('/educacion-mediatica')}
        basePath="/"
      />
      <div className="home-intro-avenir relative z-20 mx-auto mb-8 flex w-full flex-col items-center px-6 md:mb-12 md:px-10">
        <p className="mb-4 max-w-3xl text-center text-sm leading-relaxed md:text-base" style={{ color: '#4A5568' }}>
          {PREGUNTA_COPY.intro[locale]}
        </p>
        <div className="relative w-max max-w-full">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-12 top-1/2 z-0 h-40 w-40 -translate-y-1/2 rounded-full"
            style={{ background: 'rgba(209,61,23,0.18)', filter: 'blur(40px)' }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 top-1/2 z-0 h-36 w-36 -translate-y-1/2 rounded-full"
            style={{ background: 'rgba(90,120,160,0.15)', filter: 'blur(40px)' }}
          />
          <div
            className="relative z-[1] flex w-max max-w-full flex-col items-center justify-center gap-3 rounded-[1.75rem] px-4 py-3 text-center sm:flex-row sm:px-5 sm:py-3.5"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.15))',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 32px rgba(20,29,38,0.10)',
            }}
          >
            <p className="m-0 text-[0.95rem] leading-snug sm:text-base xl:whitespace-nowrap" style={{ color: '#4A5568' }}>
              <span className="font-semibold">{PREGUNTA_UI.semana[locale]}</span>{' '}
              {preguntaVigente.tu[locale]}
            </p>
            <Link
              href="/pregunta"
              className="btn-am-principal relative z-[1] inline-flex min-h-11 w-full shrink-0 items-center justify-center px-5 py-2.5 text-sm font-semibold sm:w-auto"
            >
              {PREGUNTA_UI.responder[locale]}
            </Link>
          </div>
        </div>
      </div>
      <MapSectionLocked />

      <ComoFuncionaModal isOpen={comoFuncionaOpen} onClose={closeComoFunciona} />
      <PropositoModal
        isOpen={propositoOpen}
        onClose={closeProposito}
        onGoToHistorias={goToHistoriasFromProposito}
      />
      </div>

      <StoryModal
        isOpen={storyOpen}
        onClose={closeStory}
        onExploreMap={exploreMapFromStory}
        mode={storyMode}
        chosenTopic={chosenTopic}
        onClearTopic={() => setChosenTopic(null)}
      />
    </main>
  );
}
