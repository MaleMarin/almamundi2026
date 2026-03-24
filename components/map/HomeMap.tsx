'use client';

/**
 * Mapa en home (dock + drawer + historias/noticias/sonidos).
 * Globo: GlobeV2 (R3F). El vídeo NASA sigue en @/components/NASAEpicEarthVideo para rollback.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
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
import { BITS_DATA } from '@/lib/bits-data';
import { fetchHuellas, type HuellaPunto } from '@/lib/huellas';

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
  }));
}
import { StoriesPanel } from '@/components/map/panels/StoriesPanel';
import { NewsPanel } from '@/components/map/panels/NewsPanel';
import { SoundsPanel } from '@/components/map/panels/SoundsPanel';
import { BitsPanel, type BitLike } from '@/components/map/panels/BitsPanel';
import NewsStrip from '@/components/news/NewsStrip';
import { initFromUserGesture, unlockAmbientAudio, playAmbient, stopAmbient } from '@/lib/sound/ambient';

const GlobeV2Home = dynamic(() => import('@/components/globe/GlobeV2').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center bg-[#02040a] text-sm text-white/40">
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
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);
  /** Textos curiosos y categorías: `public/huellas2.json`. Fallback = BITS_DATA (solo lugar/país) si falla la carga. */
  const [huellasPuntos, setHuellasPuntos] = useState<HuellaPunto[]>(huellasFallbackDesdeBitsData);
  const [selectedBit, setSelectedBit] = useState<HuellaPunto | BitLike | null>(null);

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

  // Al hacer scroll y llegar al mapa: arranca el sonido del universo y se dispara el evento para que el vídeo del globo gire.
  useEffect(() => {
    const el = globeContainerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setSoundEnabled(true);
        window.dispatchEvent(new CustomEvent('almamundi:mapInView'));
      },
      { threshold: 0.2, rootMargin: '0px' }
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
    requestAnimationFrame(() => {
      const hero = document.getElementById('historias');
      if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else router.push('/#historias');
    });
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
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      {/* Globo — ocupa el espacio restante */}
      <div
        ref={globeContainerRef}
        className="relative flex flex-col w-full h-full min-h-0"
        style={{ flex: 1, position: 'relative', height: '100%', minHeight: '80vh' }}
      >
        {/* GlobeV2 embebido. Rollback vídeo: import NASAEpicEarthVideo y <NASAEpicEarthVideo source="spinning" />. */}
        <div className="relative flex w-full min-h-[70vh] flex-1 flex-col overflow-hidden bg-[#02040a] pt-6 pb-6">
          <div className="relative min-h-[300px] w-full min-h-0 flex-1">
            <GlobeV2Home
              embedded
              bits={globeBitsMarkers}
              selectedBitId={selectedBit?.id ?? null}
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
              Noticias en vivo
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
      data-active={active ? 'true' : undefined}
      className="btn-almamundi whitespace-nowrap min-w-[148px] px-12 py-6 text-base font-medium text-gray-600 active:scale-95 transition-colors"
      style={dockButtonStyle}
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
      className="btn-almamundi whitespace-nowrap min-w-[320px] px-12 py-6 text-base font-medium text-gray-600 active:scale-95 transition-colors"
      style={dockButtonStyle}
    >
      Buscar por palabras clave
    </button>
  );
}
