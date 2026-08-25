'use client';

/**
 * Mapa en home (dock + drawer + historias/noticias/sonidos).
 * Globo: GlobeV2 (R3F). El vídeo NASA sigue en @/components/NASAEpicEarthVideo para rollback.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useStories } from '@/hooks/useStories';
import type { StoryPoint } from '@/lib/map-data/stories';
import { useNewsLayer, type NewsItem } from '@/components/NewsLayer';
import {
  getNewsTopicApiQuery,
  NEWS_TOPIC_GROUPS,
} from '@/lib/news-topics';
import { filterRealNewsItems } from '@/components/NewsLayer';
import { type MapDockMode } from '@/components/map/MapDock';
import { MapDrawer } from '@/components/map/MapDrawer';
import { MapTopControls } from '@/components/map/MapTopControls';
import { TimeBar } from '@/components/map/TimeBar';
import { BITS_DATA } from '@/lib/bits-data';
import { hardNavigateTo } from '@/lib/home-hard-nav';
import {
  consumeMapAmbientPending,
  MAP_NAV_GESTURE_EVENT,
  peekMapAmbientPending,
} from '@/lib/mapa-home-nav';
import { fetchHuellas, type HuellaPunto } from '@/lib/huellas';
import { PillNavButton } from '@/components/home/PillNavButton';
import type { GlobeBitMarker, GlobeLayerVisibility } from '@/components/globe/GlobeBitsLayer';
import { StoryViewer } from '@/components/mapa/StoryViewer';

/** IDs sintéticos en el globo para historias (bits reales usan ids bajos desde huellas). */
const STORY_GLOBE_ID_BASE = 9_000_000;
const NEWS_GLOBE_ID_BASE = 8_000_000;
const GLOBE_NEWS_MAX = 20;

function jitterNewsOffset(id: string): { dLat: number; dLng: number } {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const a = ((h >>> 0) % 360) * (Math.PI / 180);
  const r = 0.2 + ((h >>> 8) % 16) * 0.015;
  return { dLat: Math.sin(a) * r, dLng: Math.cos(a) * r };
}

function storyHasValidGeo(s: { lat?: number; lng?: number }): boolean {
  const { lat, lng } = s;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

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
import { useUserPosition } from '@/hooks/useUserPosition';
import { getApproxLocation } from '@/lib/userLocation';

/** Vista editorial por defecto si no hay geolocalización (centro América Latina). */
/** Encuadre editorial fijo del globo en home (Sudamérica de frente). Geoloc solo para UI noche. */
const HOME_GLOBE_FRAME_LAT = -15;
const HOME_GLOBE_FRAME_LNG = -60;

const GlobeV2Home = dynamic(() => import('@/components/globe/GlobeV2').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center bg-transparent text-sm text-white/40">
      Cargando mapa…
    </div>
  ),
});

export type HomeMapProps = {
  /**
   * Contenedor del universo (globo) desde `MapSectionLocked`.
   * IntersectionObserver usa este nodo para arrancar/cortar el ambiente según scroll (no el globo Three.js).
   */
  universeSectionRef?: RefObject<HTMLDivElement | null>;
};

export default function HomeMap({ universeSectionRef }: HomeMapProps = {}) {
  const userPosition = useUserPosition();
  const [approxPosition, setApproxPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getApproxLocation().then((loc) => {
      if (!cancelled && loc) setApproxPosition(loc);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const viewerLat = userPosition?.lat ?? approxPosition?.lat ?? null;
  const viewerLng = userPosition?.lng ?? approxPosition?.lng ?? null;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<MapDockMode>('stories');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('universo');
  const [exploreQuery, setExploreQuery] = useState('');
  const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(null);
  const [openStory, setOpenStory] = useState<StoryPoint | null>(null);
  const [storyViewerClosing, setStoryViewerClosing] = useState(false);
  const storyCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  /** Portal del dock neumórfico bajo el título (`#map-dock-slot` en MapSectionLocked). */
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);
  /** Textos curiosos y categorías: `public/huellas2.json`. Fallback = BITS_DATA (solo lugar/país) si falla la carga. */
  const [huellasPuntos, setHuellasPuntos] = useState<HuellaPunto[]>(huellasFallbackDesdeBitsData);
  const [selectedBit, setSelectedBit] = useState<HuellaPunto | BitLike | null>(null);
  const [globeLayers, setGlobeLayers] = useState<GlobeLayerVisibility>({
    stories: true,
    bits: true,
    news: false,
  });
  const [newsMarkersMounted, setNewsMarkersMounted] = useState(false);

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

  useEffect(() => {
    if (globeLayers.news) {
      setNewsMarkersMounted(true);
      return;
    }
    const t = window.setTimeout(() => setNewsMarkersMounted(false), 480);
    return () => window.clearTimeout(t);
  }, [globeLayers.news]);

  const stories = useStories();

  const globeBitsMarkers = useMemo(
    () =>
      huellasPuntos.map((b) => ({
        id: b.id,
        lat: b.lat,
        lon: b.lon,
        color: b.color,
        markerKind: 'bit' as const,
      })),
    [huellasPuntos]
  );

  /** Solo historias con lat/lng válidos (misma lista que usa el clic y el resaltado). */
  const storiesOnGlobe = useMemo(
    () => stories.filter((s) => storyHasValidGeo(s)),
    [stories]
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
  /** True cuando ≥20% del contenedor del universo es visible (scroll hero/footer corta reproducción). */
  const [globeInView, setGlobeInView] = useState(false);
  const globeInViewRef = useRef(false);
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

  // Sonido ambiente: solo mientras el contenedor del universo (globo) es visible; al ir a hero o footer se corta vía `stopAmbient` en el efecto de reproducción.
  useLayoutEffect(() => {
    const section =
      universeSectionRef?.current ??
      (typeof document !== 'undefined' ? document.getElementById('mapa') : null);
    if (!section) return;

    const VISIBILITY_THRESHOLD = 0.2;
    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

    const onIntersect: IntersectionObserverCallback = (entries) => {
      for (const en of entries) {
        if (en.target !== section) continue;
        const visible = en.isIntersecting && en.intersectionRatio >= VISIBILITY_THRESHOLD;
        globeInViewRef.current = visible;
        setGlobeInView(visible);

        if (!visible) continue;

        if (userSilencedMapAmbientRef.current) return;
        if (!hasPrimedUniverseForMapRef.current) {
          hasPrimedUniverseForMapRef.current = true;
          setSelectedMood('universo');
        }
        setSoundEnabled(true);
        window.dispatchEvent(new CustomEvent('almamundi:mapInView'));
      }
    };

    const io = new IntersectionObserver(onIntersect, {
      threshold: thresholds,
      root: null,
      rootMargin: '0px',
    });
    io.observe(section);
    return () => io.disconnect();
  }, [universeSectionRef]);

  // Reproducir o cortar el ambient según visibilidad del universo + soundEnabled (misma API: stopAmbient / startMapAmbientFromRefs).
  useEffect(() => {
    if (!globeInView) {
      stopAmbient();
      setAmbientEnabled(false);
      return;
    }
    if (!soundEnabled) {
      stopAmbient();
      setAmbientEnabled(false);
      return;
    }
    if (!selectedMood) return;
    setAmbientEnabled(true);
    void startMapAmbientFromRefs();
  }, [globeInView, soundEnabled, selectedMood, startMapAmbientFromRefs]);

  const primeUniverseAmbientForMap = useCallback(() => {
    if (userSilencedMapAmbientRef.current) return;
    if (!hasPrimedUniverseForMapRef.current) {
      hasPrimedUniverseForMapRef.current = true;
      setSelectedMood('universo');
    }
    soundEnabledRef.current = true;
    setSoundEnabled(true);
  }, []);

  const tryPlayUniverseWhenMapVisible = useCallback(() => {
    if (!globeInViewRef.current) return;
    if (userSilencedMapAmbientRef.current || !selectedMoodRef.current) return;
    primeUniverseAmbientForMap();
    if (hasActiveAmbientPlayback()) return;
    void startMapAmbientFromRefs();
  }, [primeUniverseAmbientForMap, startMapAmbientFromRefs]);

  /** Clic en menú «Mapa»: audio desbloqueado en el mismo gesto; reproducir al entrar el globo en vista. */
  useEffect(() => {
    const onMapNavGesture = () => {
      initFromUserGesture();
      void unlockAmbientAudio();
      primeUniverseAmbientForMap();
      tryPlayUniverseWhenMapVisible();
    };
    window.addEventListener(MAP_NAV_GESTURE_EVENT, onMapNavGesture);
    return () => window.removeEventListener(MAP_NAV_GESTURE_EVENT, onMapNavGesture);
  }, [primeUniverseAmbientForMap, tryPlayUniverseWhenMapVisible]);

  /** Tras recarga desde otra ruta (`/?section=mapa`), el primer toque en la página reintenta el ambiente. */
  useEffect(() => {
    if (!peekMapAmbientPending()) return;
    const onFirstGesture = () => {
      if (!peekMapAmbientPending()) return;
      initFromUserGesture();
      void unlockAmbientAudio().then(() => {
        if (!globeInViewRef.current) return;
        consumeMapAmbientPending();
        tryPlayUniverseWhenMapVisible();
      });
    };
    document.addEventListener('pointerdown', onFirstGesture, { capture: true, passive: true, once: true });
    document.addEventListener('keydown', onFirstGesture, { capture: true, once: true });
    return () => {
      document.removeEventListener('pointerdown', onFirstGesture, { capture: true });
      document.removeEventListener('keydown', onFirstGesture, { capture: true });
    };
  }, [tryPlayUniverseWhenMapVisible]);

  /**
   * Gesto en la página o en #mapa: activar sonido si el universo ya es visible.
   * Respeta silencio explícito del usuario (`userSilencedMapAmbientRef`).
   */
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      initFromUserGesture();
      const pending = peekMapAmbientPending();
      const node = e.target;
      if (!(node instanceof Node)) return;
      const root =
        node instanceof Element ? node : node.parentElement != null ? node.parentElement : null;
      const inMapa = root != null && root.closest('#mapa') != null;
      if (!pending && !inMapa) return;
      if (pending) consumeMapAmbientPending();
      tryPlayUniverseWhenMapVisible();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      initFromUserGesture();
      const pending = peekMapAmbientPending();
      const ae = document.activeElement;
      const inMapa = ae instanceof Element && ae.closest('#mapa') != null;
      if (!pending && !inMapa) return;
      if (pending) consumeMapAmbientPending();
      tryPlayUniverseWhenMapVisible();
    };
    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
      document.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [tryPlayUniverseWhenMapVisible]);

  /** Scroll al mapa sin menú: el primer toque en la página desbloquea y arranca «universo» si aún no suena. */
  useEffect(() => {
    if (!globeInView || userSilencedMapAmbientRef.current) return;
    if (hasActiveAmbientPlayback()) return;

    const onGesture = () => {
      initFromUserGesture();
      void unlockAmbientAudio().then(() => tryPlayUniverseWhenMapVisible());
    };
    document.addEventListener('pointerdown', onGesture, { capture: true, passive: true, once: true });
    return () => document.removeEventListener('pointerdown', onGesture, { capture: true });
  }, [globeInView, tryPlayUniverseWhenMapVisible]);

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

  const topicQuery = getNewsTopicApiQuery(selectedTopicId);

  const fetchNews = useCallback(
    async (topic: string, signal: AbortSignal) => {
      const topicLabel =
        selectedTopicId != null
          ? (NEWS_TOPIC_GROUPS.find((g) => g.id === selectedTopicId)?.label ?? null)
          : null;

      const mapApiItems = (rawItems: unknown[]): NewsItem[] =>
        rawItems.map((it: unknown) => {
          const i = it as Record<string, unknown>;
          const geo = (() => {
            const g = i.geo as { lat?: number; lng?: number; label?: string } | null | undefined;
            if (g && typeof g.lat === 'number' && typeof g.lng === 'number') {
              return { lat: g.lat, lng: g.lng, label: g.label };
            }
            if (typeof i.lat === 'number' && typeof i.lng === 'number') {
              return { lat: i.lat, lng: i.lng };
            }
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

      const apiTopic = topic.length > 80 ? topic.slice(0, 80) : topic;
      const q = new URLSearchParams({
        kind: 'news',
        topic: apiTopic,
        limit: '20',
        lang: 'es',
      });
      if (selectedTopicId != null) {
        q.set('topicId', selectedTopicId);
      }

      const res = await fetch(`/api/world?${q.toString()}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as {
        items?: unknown[];
        generalItems?: unknown[];
        isFallback?: boolean;
        relaxedTopic?: boolean;
        topicMatched?: boolean;
      };

      const topicItems = filterRealNewsItems(
        mapApiItems(Array.isArray(data.items) ? data.items : [])
      );
      const generalItems = filterRealNewsItems(
        mapApiItems(Array.isArray(data.generalItems) ? data.generalItems : [])
      );

      if (process.env.NODE_ENV === 'development') {
        console.debug('[news] topic', selectedTopicId, apiTopic, {
          topic: topicItems.length,
          general: generalItems.length,
          relaxedTopic: data.relaxedTopic,
        });
      }

      return {
        topicItems,
        generalItems,
        topicMatched: Boolean(data.topicMatched) && topicItems.length > 0,
        relaxedTopic: Boolean(data.relaxedTopic) && generalItems.length > 0,
        isFallback: Boolean(data.isFallback) && topicItems.length === 0 && generalItems.length === 0,
      };
    },
    [selectedTopicId]
  );

  const {
    topicItems: topicNewsItems,
    generalItems: generalNewsItems,
    loading: newsLoading,
    error: newsError,
    topicMatched,
    relaxedTopic,
    loadingTimedOut,
    isRefreshing,
  } = useNewsLayer(
    selectedTopicId,
    topicQuery,
    'actualidad',
    fetchNews,
    {
      refreshIntervalMs: 120_000,
    }
  );
  const filteredNewsItems = useMemo(
    () => [...topicNewsItems, ...generalNewsItems],
    [topicNewsItems, generalNewsItems]
  );

  const globeNewsMarkers = useMemo((): GlobeBitMarker[] => {
    if (!newsMarkersMounted) return [];
    const withGeo = filteredNewsItems.filter(
      (n): n is typeof n & { lat: number; lng: number } =>
        typeof n.lat === 'number' &&
        typeof n.lng === 'number' &&
        Number.isFinite(n.lat) &&
        Number.isFinite(n.lng) &&
        Math.abs(n.lat) <= 90 &&
        Math.abs(n.lng) <= 180
    );
    return withGeo.slice(0, GLOBE_NEWS_MAX).map((n, i) => {
      const j = jitterNewsOffset(n.id || String(i));
      return {
        id: NEWS_GLOBE_ID_BASE + i,
        lat: n.lat + j.dLat,
        lon: n.lng + j.dLng,
        markerKind: 'news' as const,
        title: n.title,
        place: n.geo?.label || n.source || n.outletName || undefined,
        url: n.url,
      };
    });
  }, [filteredNewsItems, newsMarkersMounted]);

  const globeMarkers = useMemo((): GlobeBitMarker[] => {
    const storyLayer: GlobeBitMarker[] = storiesOnGlobe.map((s, i) => ({
      id: STORY_GLOBE_ID_BASE + i,
      lat: s.lat,
      lon: s.lng,
      markerKind: 'story' as const,
      title: s.title ?? s.label,
      place: [s.city, s.country].filter(Boolean).join(', ') || undefined,
    }));
    return [...globeBitsMarkers, ...storyLayer, ...globeNewsMarkers];
  }, [globeBitsMarkers, storiesOnGlobe, globeNewsMarkers]);

  const openStoryViewer = useCallback((story: StoryPoint) => {
    if (storyCloseTimerRef.current) {
      clearTimeout(storyCloseTimerRef.current);
      storyCloseTimerRef.current = null;
    }
    setStoryViewerClosing(false);
    setHighlightedStoryId(story.id ?? null);
    setDrawerOpen(false);
    setOpenStory(story);
  }, []);

  const closeStoryViewer = useCallback(() => {
    setStoryViewerClosing(true);
    if (storyCloseTimerRef.current) clearTimeout(storyCloseTimerRef.current);
    storyCloseTimerRef.current = setTimeout(() => {
      setOpenStory(null);
      setHighlightedStoryId(null);
      setStoryViewerClosing(false);
      storyCloseTimerRef.current = null;
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (storyCloseTimerRef.current) clearTimeout(storyCloseTimerRef.current);
    };
  }, []);

  const selectedGlobeMarkerId = useMemo(() => {
    if (drawerMode === 'bits' && selectedBit) return selectedBit.id;
    if (highlightedStoryId != null) {
      const idx = storiesOnGlobe.findIndex((s) => s.id === highlightedStoryId);
      return idx >= 0 ? STORY_GLOBE_ID_BASE + idx : null;
    }
    return null;
  }, [drawerMode, selectedBit, highlightedStoryId, storiesOnGlobe]);

  const handleGlobeMarkerClick = useCallback(
    (id: number) => {
      if (id >= STORY_GLOBE_ID_BASE) {
        const idx = id - STORY_GLOBE_ID_BASE;
        const story = storiesOnGlobe[idx];
        if (!story) return;
        openStoryViewer(story);
        return;
      }
      if (id >= NEWS_GLOBE_ID_BASE) {
        const idx = id - NEWS_GLOBE_ID_BASE;
        const marker = globeNewsMarkers[idx];
        if (marker?.url) {
          window.open(marker.url, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      const bit = huellasPuntos.find((h) => h.id === id);
      if (!bit) return;
      setOpenStory(null);
      setHighlightedStoryId(null);
      setSelectedBit(bit);
      setDrawerMode('bits');
      setDrawerOpen(true);
    },
    [storiesOnGlobe, huellasPuntos, openStoryViewer, globeNewsMarkers]
  );

  function onGlobeLayerPill(mode: 'stories' | 'news' | 'bits', key: keyof GlobeLayerVisibility) {
    const layerOn = globeLayers[key];
    if (drawerOpen && drawerMode === mode) {
      setGlobeLayers((prev) => ({ ...prev, [key]: !layerOn }));
      if (layerOn) close();
      return;
    }
    if (!layerOn) {
      setGlobeLayers((prev) => ({ ...prev, [key]: true }));
    }
    if (mode === 'bits') setSelectedBit(null);
    open(mode);
  }

  function open(mode: MapDockMode) {
    if (storyCloseTimerRef.current) {
      clearTimeout(storyCloseTimerRef.current);
      storyCloseTimerRef.current = null;
    }
    setOpenStory(null);
    setStoryViewerClosing(false);
    setHighlightedStoryId(null);
    setDrawerMode(mode);
    setDrawerOpen(true);
  }

  function close() {
    setDrawerOpen(false);
  }

  const handleSubirMiHistoria = useCallback(() => {
    close();
    requestAnimationFrame(() => {
      const onHome =
        typeof window !== 'undefined' &&
        (window.location.pathname === '/' || window.location.pathname === '');
      if (onHome) {
        window.history.replaceState(null, '', '/#historias');
        document.getElementById('historias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      hardNavigateTo('/#historias');
    });
  }, []);

  const historiasProps = {
    stories,
    exploreQuery,
    onExploreQueryChange: setExploreQuery,
    onStoryFocus: openStoryViewer,
    highlightedStoryId,
  };

  const noticiasProps = {
    topicNews: topicNewsItems,
    generalNews: generalNewsItems,
    news: filteredNewsItems,
    loading: newsLoading,
    isRefreshing,
    loadingTimedOut,
    topicMatched,
    relaxedTopic,
    error: newsError,
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
    <div className="relative flex min-h-[88vh] w-full flex-1 flex-col overflow-hidden">
      {/* Globo — crece dentro del alto del padre (#mapa universo), sin forzar 72vh+ extra */}
      <div
        ref={globeContainerRef}
        className="relative flex min-h-[min(520px,62vh)] w-full flex-1 flex-col overflow-hidden"
        onPointerDownCapture={() => {
          if (!globeInViewRef.current) return;
          if (userSilencedMapAmbientRef.current || !selectedMoodRef.current) return;
          initFromUserGesture();
          soundEnabledRef.current = true;
          setSoundEnabled(true);
          if (!hasActiveAmbientPlayback()) void startMapAmbientFromRefs();
        }}
      >
        {/* GlobeV2 embebido. Rollback vídeo: import NASAEpicEarthVideo y <NASAEpicEarthVideo source="spinning" />. */}
        <div className="relative flex w-full min-h-[58vh] flex-1 flex-col overflow-hidden bg-transparent pt-0 pb-0">
          <div className="relative min-h-[min(380px,48vh)] h-full w-full flex-1 overflow-hidden bg-transparent">
            <GlobeV2Home
              embedded
              forceDaylight={false}
              earthVisualTimeScale={1050}
              initialViewLat={HOME_GLOBE_FRAME_LAT}
              initialViewLng={HOME_GLOBE_FRAME_LNG}
              viewerLat={viewerLat ?? undefined}
              viewerLng={viewerLng ?? undefined}
              bits={globeMarkers}
              selectedBitId={selectedGlobeMarkerId}
              layerVisibility={globeLayers}
              pauseEarthSpinForUi={Boolean(openStory) || (drawerOpen && drawerMode === 'bits')}
              onBitClick={handleGlobeMarkerClick}
            />
          </div>
        </div>
      {/* Franja fecha/hora: capa independiente debajo del globo (regla mapa-seccion-lock); z-10 para que nunca quede tapada */}
      <div
        className="map-timebar-stage relative z-10 -mt-px flex w-full flex-shrink-0 items-end justify-center border-0 pb-4 pt-2 shadow-none outline-none"
        style={{ minHeight: `${TIME_STRIP_HEIGHT}px` }}
      >
        <TimeBar className="pointer-events-none text-center text-[11px] md:text-[12px] tracking-[0.3em] text-slate-400/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]" />
      </div>

      {/* Dock: Historias, También cuenta, Noticias (capas), luego Sonidos (audio), luego buscar. */}
      {dockSlot &&
        createPortal(
          <div className="map-dock-row" role="toolbar" aria-label="Capas y herramientas del mapa">
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'stories'}
                title={globeLayers.stories ? 'Historias visibles. Clic para ver la lista o apagar la capa.' : 'Mostrar historias en el globo'}
                onClick={() => onGlobeLayerPill('stories', 'stories')}
              >
                Historias
              </PillNavButton>
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'bits'}
                title={globeLayers.bits ? 'También cuenta está visible. Clic para ver la ficha o apagar la capa.' : 'Mostrar También cuenta en el globo'}
                onClick={() => onGlobeLayerPill('bits', 'bits')}
              >
                También cuenta
              </PillNavButton>
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'news'}
                title={globeLayers.news ? 'Noticias visibles. Clic para ver la lista o apagar la capa.' : 'Mostrar noticias en el globo'}
                onClick={() => onGlobeLayerPill('news', 'news')}
              >
                Noticias
              </PillNavButton>
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'sounds'}
                title="Abrir sonidos del mapa"
                onClick={() => open('sounds')}
              >
                Sonidos
              </PillNavButton>
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'search'}
                onClick={() => open('search')}
                title="Buscar por palabras clave"
              >
                Buscar
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
              panelMode={drawerMode === 'search' ? 'search' : 'stories'}
              onContarMiHistoria={handleSubirMiHistoria}
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
      {openStory
        ? createPortal(
            <StoryViewer
              story={openStory}
              onClose={closeStoryViewer}
              isClosing={storyViewerClosing}
              variant="compact"
            />,
            document.body
          )
        : null}
      </div>
    </div>
  );
}

