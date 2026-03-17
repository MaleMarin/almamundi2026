'use client';

/**
 * Versión alternativa del mapa para home (dock + drawer + historias/noticias/sonidos).
 * Globo NASA (vídeo con nubes): arrastre para girar y auto-rotación, mismo movimiento que el mapa 3D.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useStories } from '@/hooks/useStories';
import type { StoryPoint } from '@/lib/map-data/stories';
import { useNewsLayer, type NewsItem } from '@/components/NewsLayer';
import { DEFAULT_NEWS_TOPIC_QUERY, NEWS_TOPIC_GROUPS } from '@/lib/news-topics';
import { type MapDockMode } from '@/components/map/MapDock';
import { MapDrawer } from '@/components/map/MapDrawer';
import { MapTopControls } from '@/components/map/MapTopControls';
import { TimeBar } from '@/components/map/TimeBar';
import { NASAEpicEarthVideo } from '@/components/NASAEpicEarthVideo';
import { BITS_DATA } from '@/lib/bits-data';
import type { HuellaPunto } from '@/lib/huellas';
import { StoriesPanel } from '@/components/map/panels/StoriesPanel';
import { NewsPanel } from '@/components/map/panels/NewsPanel';
import { SoundsPanel } from '@/components/map/panels/SoundsPanel';
import { BitsPanel, type BitLike } from '@/components/map/panels/BitsPanel';
import { initFromUserGesture, unlockAmbientAudio, playAmbient, stopAmbient } from '@/lib/sound/ambient';

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
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);
  // Bits fijos en sus latitudes (BITS_DATA): globo y panel usan los mismos 100 puntos. useMemo para que cambios en BITS_DATA se reflejen al recargar.
  const huellasPuntos = useMemo<HuellaPunto[]>(
    () =>
      BITS_DATA.map((b) => ({
        id: b.id,
        lugar: b.lugar,
        pais: b.pais,
        lat: b.lat,
        lon: b.lon,
        categoria: b.categoria ?? 'Bit',
        color: '#f59e0b',
        titulo: b.titulo ?? b.lugar,
        historia: b.historia ?? '',
      })),
    [BITS_DATA]
  );
  const [selectedBit, setSelectedBit] = useState<HuellaPunto | BitLike | null>(null);

  useEffect(() => {
    setDockSlot(typeof document !== 'undefined' ? document.getElementById('map-dock-slot') : null);
  }, []);

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

  // Al hacer scroll y llegar al globo: activar sonido del universo.
  useEffect(() => {
    const el = globeContainerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setSoundEnabled(true);
      },
      { threshold: 0.15, rootMargin: '0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reproducir o cortar el ambient según soundEnabled. El AudioContext se crea solo tras el primer gesto (clic/touch) para no disparar aviso en consola.
  useEffect(() => {
    if (!soundEnabled) {
      stopAmbient();
      return;
    }
    if (!selectedMood) return;
    const mood = selectedMood as import('@/lib/sound/ambient').AmbientKey;
    unlockAmbientAudio()
      .then(() => playAmbient(mood, { fadeMs: 2200 }))
      .catch(() => {});
  }, [soundEnabled, selectedMood]);

  // Primer gesto del usuario en la página: crear AudioContext (sin aviso). Si el sonido ya estaba activado por scroll, empezar a reproducir.
  useEffect(() => {
    const onFirstGesture = () => {
      initFromUserGesture();
      if (soundEnabledRef.current) {
        const mood = selectedMoodRef.current as import('@/lib/sound/ambient').AmbientKey;
        unlockAmbientAudio().then(() => playAmbient(mood, { fadeMs: 2200 })).catch(() => {});
      }
      document.removeEventListener('click', onFirstGesture);
      document.removeEventListener('touchstart', onFirstGesture);
    };
    document.addEventListener('click', onFirstGesture, { once: true });
    document.addEventListener('touchstart', onFirstGesture, { once: true });
    return () => {
      document.removeEventListener('click', onFirstGesture);
      document.removeEventListener('touchstart', onFirstGesture);
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((v) => {
      if (!v) initFromUserGesture();
      return !v;
    });
  }, []);

  const isMobile = false;

  const stories = useStories();

  const topicQuery =
    selectedTopicId == null
      ? DEFAULT_NEWS_TOPIC_QUERY
      : (NEWS_TOPIC_GROUPS.find((g) => g.id === selectedTopicId)?.query ?? DEFAULT_NEWS_TOPIC_QUERY);

  const fetchNews = useCallback(
    async (topic: string, signal: AbortSignal): Promise<{ items: NewsItem[]; isFallback?: boolean }> => {
      const url = `/api/world?kind=news&topic=${encodeURIComponent(topic)}&limit=20&lang=es`;
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
        if (err instanceof Error && err.name === 'AbortError') return { items: [] };
        throw err;
      }
    },
    [selectedTopicId]
  );

  const { effectiveNewsItems } = useNewsLayer(selectedTopicId, topicQuery, 'actualidad', fetchNews);
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
    router.push('/');
    setTimeout(() => window.dispatchEvent(new CustomEvent('almamundi:openStoryModal', { detail: { mode: 'Texto' } })), 400);
  }, [router]);

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

  const TIME_STRIP_HEIGHT = 64;
  /** Margen superior para que el globo quede claramente debajo de la barra (Historias, Sonidos, etc.) y no se solape */
  const GLOBE_TOP_PADDING = 24;
  return (
    <div ref={globeContainerRef} className="relative flex flex-col w-full h-full min-h-0" style={{ height: '100%', minHeight: '80vh' }}>
      {/* Vídeo NASA un poco oval (máscara circular + zoom), fondo negro. */}
      <div
        className="relative overflow-hidden flex-1 flex flex-col justify-center items-center min-h-[55vh] w-full bg-black"
        style={{
          paddingTop: GLOBE_TOP_PADDING,
          paddingBottom: 24,
          minHeight: '55vh',
          backgroundColor: '#000',
        }}
      >
        <NASAEpicEarthVideo className="w-full max-w-7xl" source="spinning" fallbackImage="" />
      </div>
      {/* Franja fecha/hora: capa independiente debajo del globo (regla mapa-seccion-lock); z-10 para que nunca quede tapada */}
      <div
        className="flex-shrink-0 w-full flex items-center justify-center z-10"
        style={{ height: `${TIME_STRIP_HEIGHT}px`, backgroundColor: 'transparent' }}
      >
        <TimeBar className="pointer-events-none text-center text-[11px] md:text-[12px] tracking-[0.32em] text-slate-300/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />
      </div>

      {/* Botones sueltos (sin franja) debajo de "Mapa de AlmaMundi" vía portal */}
      {dockSlot &&
        createPortal(
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full">
            <DockButtonLight active={drawerMode === 'stories'} onClick={() => open('stories')}>
              Historias
            </DockButtonLight>
            <DockButtonLight active={drawerMode === 'sounds'} onClick={() => open('sounds')}>
              Sonidos
            </DockButtonLight>
            <DockButtonLight active={drawerMode === 'news'} onClick={() => open('news')}>
              Noticias
            </DockButtonLight>
            <DockButtonLight
              active={drawerMode === 'bits'}
              onClick={() => {
                setSelectedBit(null);
                open('bits');
              }}
            >
              Bits
            </DockButtonLight>
            <DockSearchLight onClick={() => open('search')} />
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
                router.push('/#historias');
              }}
            />
          ) : drawerMode === 'news' ? (
            <NewsPanel {...noticiasProps} />
          ) : drawerMode === 'bits' ? (
            <BitsPanel
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
  );
}

/* Mismo estilo que los botones de arriba a la derecha (Propósito, Inspiración, Historias, Mapa): soft.button */
const dockButtonStyle: React.CSSProperties = {
  backgroundColor: '#E0E5EC',
  boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 9999,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
};

function DockButtonLight({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap min-w-[108px] px-8 py-4 font-medium text-gray-600 hover:text-orange-600 active:scale-95 transition-colors"
      style={{
        ...dockButtonStyle,
        ...(active ? { border: '2px solid var(--almamundi-orange, #f97316)', boxShadow: `${dockButtonStyle.boxShadow}, 0 0 0 1px rgba(249,115,22,0.4)` } : {}),
      }}
    >
      {children}
    </button>
  );
}

function DockSearchLight({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap min-w-[240px] px-8 py-4 font-medium text-gray-600 hover:text-orange-600 active:scale-95 transition-colors"
      style={dockButtonStyle}
    >
      Buscar por palabras clave
    </button>
  );
}
