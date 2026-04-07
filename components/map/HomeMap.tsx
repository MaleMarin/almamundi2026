'use client';

/**
 * Mapa en home (dock + drawer + historias/noticias/sonidos).
 * Globo: GlobeV2 (R3F). El vídeo NASA sigue en @/components/NASAEpicEarthVideo para rollback.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useStories } from '@/hooks/useStories';
import type { StoryPoint } from '@/lib/map-data/stories';
import { useNewsLayer, type NewsItem } from '@/components/NewsLayer';
import { DEFAULT_NEWS_TOPIC_QUERY, NEWS_TOPIC_GROUPS } from '@/lib/news-topics';
import { getUserCalendarDayForNewsApi } from '@/lib/news-calendar-day';
import { type MapDockMode } from '@/components/map/MapDock';
import { MapDrawer } from '@/components/map/MapDrawer';
import { MapTopControls } from '@/components/map/MapTopControls';
import { TimeBar } from '@/components/map/TimeBar';
import { BITS_DATA } from '@/lib/bits-data';
import { hardNavigateTo } from '@/lib/home-hard-nav';
import { fetchHuellas, type HuellaPunto } from '@/lib/huellas';
import { PillNavButton } from '@/components/home/PillNavButton';
import { MAP_HOME_DOCK_NAV_CLASS } from '@/lib/map-home-neu-button';

function huellasFallbackDesdeBitsData(): HuellaPunto[] {
  return BITS_DATA.map((b) => ({
    id: b.id,
    lugar: b.lugar,
    pais: b.pais,
    lat: b.lat,
    lon: b.lon,
    categoria: b.categoria ?? 'Bit',
    color: '#f59e0b',
    titulo: b.titulo ?? b.lugar,
    historia: b.historia ?? '',
    ...(b.fuenteUrl ? { fuenteUrl: b.fuenteUrl } : {}),
  }));
}
import { StoriesPanel } from '@/components/map/panels/StoriesPanel';
import { NewsPanel } from '@/components/map/panels/NewsPanel';
import { SoundsPanel } from '@/components/map/panels/SoundsPanel';
import { BitsPanel, type BitLike } from '@/components/map/panels/BitsPanel';
import NewsStrip from '@/components/news/NewsStrip';
import { isPublicAudioMoodId, publicAudioPathFromMoodId } from '@/lib/public-audio-mood';
import {
  initFromUserGesture,
  unlockAmbientAudio,
  playAmbient,
  playAmbientFromPublicUrl,
  stopAmbient,
  setAmbientEnabled,
  hasActiveAmbientPlayback,
  type AmbientKey,
} from '@/lib/sound/ambient';
import { MAP_LAYOUT_MOBILE_MAX_WIDTH_PX } from '@/lib/map-layout';
import { useViewportBelow } from '@/hooks/useViewportBelow';

const GlobeV2Home = dynamic(() => import('@/components/globe/GlobeV2').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center bg-black text-sm text-white/40">
      Cargando mapa…
    </div>
  ),
});

export default function HomeMap() {
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<MapDockMode>('stories');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('universo');
  const [exploreQuery, setExploreQuery] = useState('');
  const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  /** Portal del dock neumórfico bajo el título (`#map-dock-slot` en MapSectionLocked). */
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);
  /** Textos curiosos y categorías: `public/huellas2.json`. Fallback = BITS_DATA (solo lugar/país) si falla la carga. */
  const [huellasPuntos, setHuellasPuntos] = useState<HuellaPunto[]>(huellasFallbackDesdeBitsData);
  const [selectedBit, setSelectedBit] = useState<HuellaPunto | BitLike | null>(null);

  useEffect(() => {
    setDockSlot(typeof document !== 'undefined' ? document.getElementById('map-dock-slot') : null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchHuellas()
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data.puntos].sort((a, b) => a.id - b.id);
        setHuellasPuntos(sorted);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const globeBitsMarkers = useMemo(
    () =>
      huellasPuntos.map((b) => ({
        id: b.id,
        lat: b.lat,
        lon: b.lon,
        color: b.color,
      })),
    [huellasPuntos]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const { mode, query } = (e as CustomEvent<{ mode: MapDockMode; query?: string }>).detail ?? {};
      open(mode ?? 'stories');
      if (query != null && query.trim() && mode === 'search') setExploreQuery(query.trim());
    };
    window.addEventListener('almamundi:voice:openDrawer', handler);
    return () => window.removeEventListener('almamundi:voice:openDrawer', handler);
  }, []);

  const globeContainerRef = useRef<HTMLDivElement>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const selectedMoodRef = useRef(selectedMood);
  soundEnabledRef.current = soundEnabled;
  selectedMoodRef.current = selectedMood;

  /** Primera vez que la sección del mapa entra en vista: fijar ambiente «universo» (luego el usuario puede cambiarlo en Sonidos). */
  const hasPrimedUniverseForMapRef = useRef(false);
  /** True solo si la persona apagó el sonido con el botón del mapa (no reactivar con IO ni con clics en #mapa). */
  const userSilencedMapAmbientRef = useRef(false);

  const startMapAmbientFromRefs = useCallback(() => {
    initFromUserGesture();
    const m = selectedMoodRef.current;
    if (!m) return Promise.resolve();
    return unlockAmbientAudio()
      .then(async () => {
        if (!soundEnabledRef.current) return;
        if (isPublicAudioMoodId(m)) {
          const path = publicAudioPathFromMoodId(m);
          if (path) await playAmbientFromPublicUrl(path);
          return;
        }
        // «universo»: dejar el fade por defecto del motor (~2.2 s) al entrar al globo; otros presets, entrada más rápida.
        await playAmbient(m as AmbientKey, m === 'universo' ? undefined : { fadeMs: 900 });
      })
      .catch(() => {});
  }, []);

  // Entrada al mapa: observer al globo y respaldo a #mapa (si el flex deja altura 0 al globo, el IO del contenedor nunca disparaba → soundEnabled quedaba false y el audio no arrancaba nunca).
  useLayoutEffect(() => {
    const globe = globeContainerRef.current;
    const section = typeof document !== 'undefined' ? document.getElementById('mapa') : null;
    if (!globe && !section) return;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      const hit = entries.some((en) => en.isIntersecting);
      if (!hit) return;
      if (userSilencedMapAmbientRef.current) return;
      if (!hasPrimedUniverseForMapRef.current) {
        hasPrimedUniverseForMapRef.current = true;
        setSelectedMood('universo');
      }
      setSoundEnabled(true);
      window.dispatchEvent(new CustomEvent('almamundi:mapInView'));
    };

    const io = new IntersectionObserver(onIntersect, {
      threshold: [0, 0.08, 0.2],
      rootMargin: '0px',
    });
    if (globe) io.observe(globe);
    if (section && section !== globe) io.observe(section);
    return () => io.disconnect();
  }, []);

  // Reproducir o cortar el ambient según soundEnabled. Hace falta AudioContext (creado en el primer gesto: pointerdown/tecla).
  useEffect(() => {
    if (!soundEnabled) {
      stopAmbient();
      setAmbientEnabled(false);
      return;
    }
    if (!selectedMood) return;
    setAmbientEnabled(true);
    void startMapAmbientFromRefs();
  }, [soundEnabled, selectedMood, startMapAmbientFromRefs]);

  /**
   * Gesto en #mapa: activar sonido aunque el IntersectionObserver no hubiera puesto soundEnabled (p. ej. layout del globo).
   * Respeta silencio explícito del usuario (`userSilencedMapAmbientRef`).
   */
  useEffect(() => {
    const tryPlayInMap = () => {
      if (userSilencedMapAmbientRef.current || !selectedMoodRef.current) return;
      soundEnabledRef.current = true;
      setSoundEnabled(true);
      if (hasActiveAmbientPlayback()) return;
      void startMapAmbientFromRefs();
    };

    const onPointerDown = (e: PointerEvent) => {
      initFromUserGesture();
      const node = e.target;
      if (!(node instanceof Node)) return;
      const root =
        node instanceof Element ? node : node.parentElement != null ? node.parentElement : null;
      if (root == null || !root.closest('#mapa')) return;
      tryPlayInMap();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      initFromUserGesture();
      const ae = document.activeElement;
      if (!(ae instanceof Element) || !ae.closest('#mapa')) return;
      tryPlayInMap();
    };
    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
      document.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [startMapAmbientFromRefs]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((v) => {
      const next = !v;
      if (next) {
        userSilencedMapAmbientRef.current = false;
        initFromUserGesture();
      } else {
        userSilencedMapAmbientRef.current = true;
      }
      return next;
    });
  }, []);

  const isMobile = useViewportBelow(MAP_LAYOUT_MOBILE_MAX_WIDTH_PX);

  const stories = useStories();

  const topicQuery =
    selectedTopicId == null
      ? DEFAULT_NEWS_TOPIC_QUERY
      : (NEWS_TOPIC_GROUPS.find((g) => g.id === selectedTopicId)?.query ?? DEFAULT_NEWS_TOPIC_QUERY);

  const fetchNews = useCallback(
    async (topic: string, signal: AbortSignal): Promise<{ items: NewsItem[]; isFallback?: boolean }> => {
      const { tz, day } = getUserCalendarDayForNewsApi();
      const q = new URLSearchParams({
        kind: 'news',
        topic,
        limit: '20',
        lang: 'es',
        tz,
        day,
      });
      const url = `/api/world?${q.toString()}`;
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items?: unknown[]; isFallback?: boolean };
        const rawItems = Array.isArray(data.items) ? data.items : [];
        const topicLabel = selectedTopicId != null ? NEWS_TOPIC_GROUPS.find((g) => g.id === selectedTopicId)?.label ?? null : null;
        const items: NewsItem[] = rawItems.map((it: unknown) => {
          const i = it as Record<string, unknown>;
          const geo = (() => {
            const g = i.geo as { lat?: number; lng?: number; label?: string } | null | undefined;
            if (g && typeof g.lat === 'number' && typeof g.lng === 'number') return { lat: g.lat, lng: g.lng, label: g.label };
            if (typeof i.lat === 'number' && typeof i.lng === 'number') return { lat: i.lat, lng: i.lng };
            return null;
          })();
          return {
            id: typeof i.id === 'string' ? i.id : '',
            title: typeof i.title === 'string' ? i.title : '',
            url: typeof i.url === 'string' ? i.url : '',
            source: i.source != null ? String(i.source) : null,
            publishedAt: i.publishedAt != null ? String(i.publishedAt) : null,
            sourceCountry: i.sourceCountry != null ? String(i.sourceCountry) : null,
            topicId: selectedTopicId,
            topicLabel,
            outletName: i.source != null ? String(i.source) : null,
            outletId: null,
            geo,
            lat: geo?.lat ?? null,
            lng: geo?.lng ?? null,
            topic: typeof i.topic === 'string' ? i.topic : topicLabel ?? 'Actualidad',
          } as NewsItem;
        });
        return { items, isFallback: Boolean(data.isFallback) };
      } catch (err) {
        /* No resolver con []: useNewsLayer ignoraría el abort y podía dejar lista vacía por carrera. */
        if (err instanceof Error && err.name === 'AbortError') throw err;
        throw err;
      }
    },
    [selectedTopicId]
  );

  const { effectiveNewsItems } = useNewsLayer(selectedTopicId, topicQuery, 'actualidad', fetchNews, {
    refreshIntervalMs: 120_000,
  });
  const filteredNewsItems = effectiveNewsItems;

  const handleStoryFocus = useCallback((story: StoryPoint) => {
    setHighlightedStoryId(story.id ?? null);
  }, []);

  function open(mode: MapDockMode) {
    setDrawerMode(mode);
    setDrawerOpen(true);
  }

  function close() {
    setDrawerOpen(false);
  }

  const handleSubirMiHistoria = useCallback(() => {
    close();
    requestAnimationFrame(() => {
      const hero = document.getElementById('historias');
      if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else hardNavigateTo('/#historias');
    });
  }, []);

  const historiasProps = {
    stories,
    exploreQuery,
    onExploreQueryChange: setExploreQuery,
    onStoryFocus: handleStoryFocus,
    highlightedStoryId,
  };

  const noticiasProps = {
    news: filteredNewsItems,
    selectedTopicId,
    onTopicIdChange: setSelectedTopicId,
    onNewsFocus: (n: NewsItem) => setSelectedNews(n),
    selectedNews,
  };

  const sonidosProps = {
    currentMood: selectedMood,
    onMoodChange: (m: string) => setSelectedMood(m),
    soundEnabled,
    onToggleSound: handleToggleSound,
  };

  /** Altura mínima de la franja fecha/hora + nota sobre sonido en el vacío (TimeBar). */
  const TIME_STRIP_HEIGHT = 128;
  return (
    <div className="relative flex min-h-[88vh] w-full flex-1 flex-col">
      {/* Globo — crece dentro del alto del padre (#mapa universo), sin forzar 72vh+ extra */}
      <div
        ref={globeContainerRef}
        className="relative flex min-h-0 w-full flex-1 flex-col"
        onPointerDownCapture={() => {
          if (userSilencedMapAmbientRef.current || !selectedMoodRef.current) return;
          initFromUserGesture();
          soundEnabledRef.current = true;
          setSoundEnabled(true);
          if (!hasActiveAmbientPlayback()) void startMapAmbientFromRefs();
        }}
      >
        {/* GlobeV2 embebido. Rollback vídeo: import NASAEpicEarthVideo y <NASAEpicEarthVideo source="spinning" />. */}
        <div className="relative flex w-full min-h-[58vh] flex-1 flex-col overflow-hidden bg-black pt-8 pb-2">
          <div className="relative min-h-[300px] w-full min-h-0 flex-1">
            <GlobeV2Home
              embedded
              forceDaylight={false}
              bits={globeBitsMarkers}
              selectedBitId={selectedBit?.id ?? null}
              pauseEarthSpinForUi={drawerOpen && drawerMode === 'bits'}
              onBitClick={(id) => {
                const bit = huellasPuntos.find((h) => h.id === id);
                if (!bit) return;
                setSelectedBit(bit);
                setDrawerMode('bits');
                setDrawerOpen(true);
              }}
            />
          </div>
        </div>
      {/* Franja fecha/hora: capa independiente debajo del globo (regla mapa-seccion-lock); z-10 para que nunca quede tapada */}
      <div
        className="flex-shrink-0 w-full flex items-end justify-center z-10 bg-black pb-4 pt-1.5"
        style={{ minHeight: `${TIME_STRIP_HEIGHT}px` }}
      >
        <TimeBar className="pointer-events-none text-center text-[11px] md:text-[12px] tracking-[0.3em] text-slate-400/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]" />
      </div>

      {/* Botones sueltos (sin franja) debajo de "Mapa de AlmaMundi" vía portal */}
      {dockSlot &&
        createPortal(
          <div className={MAP_HOME_DOCK_NAV_CLASS}>
            <PillNavButton active={drawerMode === 'stories'} onClick={() => open('stories')}>
              Historias
            </PillNavButton>
            <PillNavButton active={drawerMode === 'sounds'} onClick={() => open('sounds')}>
              Sonidos
            </PillNavButton>
            <PillNavButton active={drawerMode === 'news'} onClick={() => open('news')}>
              Noticias en vivo
            </PillNavButton>
            <PillNavButton
              active={drawerMode === 'bits'}
              onClick={() => {
                setSelectedBit(null);
                open('bits');
              }}
            >
              Bits
            </PillNavButton>
            <PillNavButton
              active={drawerMode === 'search'}
              onClick={() => open('search')}
              longSingleLine
              title="Buscar por palabras clave"
            >
              Buscar por palabras clave
            </PillNavButton>
          </div>,
          dockSlot
        )}

      {/* Cortar sonido del universo: a la derecha del globo para que la persona pueda apagarlo si no quiere escucharlo */}
      <div className="absolute top-0 right-4 md:right-6 z-30 pt-2 md:pt-3">
        <MapTopControls
          embedded
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      </div>

      <MapDrawer open={drawerOpen} mode={drawerMode} onClose={close} isMobile={isMobile}>
          {drawerMode === 'stories' || drawerMode === 'search' ? (
            <StoriesPanel
              {...historiasProps}
              onContarMiHistoria={() => {
                close();
                router.push('/subir');
              }}
            />
          ) : drawerMode === 'news' ? (
            <NewsPanel {...noticiasProps} />
          ) : drawerMode === 'bits' ? (
            <BitsPanel
              showIndexList={false}
              bits={huellasPuntos}
              selectedBit={selectedBit}
              onSelectBit={setSelectedBit}
              onSubirMiHistoria={handleSubirMiHistoria}
            />
          ) : (
            <SoundsPanel {...sonidosProps} />
          )}
      </MapDrawer>
      </div>

      {/* Noticias en vivo: franja lateral solo con el panel de noticias abierto (desktop). */}
      {drawerOpen && drawerMode === 'news' ? (
        <div className="hidden h-full min-h-0 shrink-0 lg:flex">
          <NewsStrip />
        </div>
      ) : null}
    </div>
  );
}

