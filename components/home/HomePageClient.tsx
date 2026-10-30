'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { ComoFuncionaModal } from '@/components/home/ComoFuncionaModal';
import { HomeFirstPart } from '@/components/home/HomeFirstPart';
import { PropositoModal } from '@/components/home/PropositoModal';
import { MapSectionLocked } from '@/components/politica-v2/MapSectionLocked';
import { BloqueCintasHome } from '@/components/hilos/CintaColgante';
import { StoryModal, type ChosenInspirationTopic, type StoryModalMode } from '@/components/home/StoryModal';
import { contarHref, parseContarFormat, contarIndexHref, hiloContarPregunta } from '@/lib/contar-routes';
import { hardNavigateTo } from '@/lib/home-hard-nav';
import {
  navigateToHomeMapa,
  primeMapAmbientFromNavGesture,
  scrollToHomeMapaSection } from '@/lib/mapa-home-nav';
import {
  applyHomeScroll,
  homeScrollRestored,
  markHomeScrollRestored,
  peekHomeRestore } from '@/lib/home-return';

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
  const [cuentaEliminadaToast, setCuentaEliminadaToast] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyMode, setStoryMode] = useState<StoryModalMode>('video');
  const [chosenTopic, setChosenTopic] = useState<ChosenInspirationTopic | null>(null);
  const [comoFuncionaOpen, setComoFuncionaOpen] = useState(false);
  const [propositoOpen, setPropositoOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const preguntaContar = useMemo(
    () => hiloContarPregunta({ get: (name) => new URLSearchParams(locationSearch).get(name) }),
    [locationSearch]
  );

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
    const pregunta = hiloContarPregunta({ get: (name) => new URLSearchParams(window.location.search).get(name) });
    router.push(contarHref(mode, pregunta));
  }, [router]);

  const closeStory = useCallback(() => {
    setStoryOpen(false);
    if (parseContarFormat(pathname)) {
      const pregunta = hiloContarPregunta({ get: (name) => new URLSearchParams(window.location.search).get(name) });
      router.replace(contarIndexHref(pregunta));
    }
  }, [pathname, router]);

  const exploreMapFromStory = useCallback(() => {
    setStoryOpen(false);
    primeMapAmbientFromNavGesture();
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === '/' || path.startsWith('/contar')) {
      router.replace('/#mapa', { scroll: false });
      window.setTimeout(() => scrollToHomeMapaSection('smooth'), 80);
      window.setTimeout(() => scrollToHomeMapaSection('smooth'), 280);
      return;
    }
    hardNavigateTo('/#mapa');
  }, [router]);

  useLayoutEffect(() => {
    setLocationSearch(window.location.search);
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

  /** Atrás recupera el scroll guardado en la entrada de la home. */
  useLayoutEffect(() => {
    const saved = peekHomeRestore();
    if (!saved) {
      markHomeScrollRestored(false);
      return;
    }
    markHomeScrollRestored(true);
    applyHomeScroll(saved.scrollY);
  }, []);

  /** Llegada con `/#mapa` o `/?section=mapa` (menú Mapa, redirect desde `/mapa`). */
  useEffect(() => {
    if (typeof window === 'undefined' || homeScrollRestored()) return;
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
      if (homeScrollRestored()) return;
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
    <main className="min-h-screen overflow-x-hidden bg-[var(--home-bg)]">
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
            fontSize: 'var(--fs-etiqueta)',
            maxWidth: 'min(420px, calc(100vw - 32px))',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
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
        pregunta={preguntaContar}
        cintaPill={pathname === '/' || pathname === '/preview-home'}
        basePath="/"
      />
      {pathname === '/' || pathname === '/preview-home' ? <BloqueCintasHome locale={locale} /> : null}
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
        pregunta={preguntaContar}
        onClearTopic={() => setChosenTopic(null)}
      />
    </main>
  );
}
