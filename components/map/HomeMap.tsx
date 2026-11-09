'use client';

/**
 * Mapa en home (dock + drawer + historias/noticias/sonidos).
 * Globo: GlobeV2 (R3F). El vídeo NASA sigue en @/components/NASAEpicEarthVideo para rollback.
 */

import { DEMO_HISTORIAS, demoHistoriasActiva } from '@/lib/map-data/demo-historias';
import { DEMO_PREGUNTAS, DEMO_RESPUESTAS, demoConstelacionActiva } from '@/lib/me-pregunto/demo-constelacion';
import type { GlobeArc } from '@/components/globe/GlobeArcsLayer';
import { Search } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useStories } from '@/hooks/useStories';
import type { StoryPoint } from '@/lib/map-data/stories';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { useHomeLocaleOptional } from '@/components/i18n/LocaleProvider';
import { mapChrome } from '@/lib/i18n/map-chrome';
import { useNewsLayer, type NewsItem } from '@/components/NewsLayer';
import {
  getNewsTopicApiQuery,
  NEWS_TOPIC_GROUPS } from '@/lib/news-topics';
import { filterRealNewsItems } from '@/components/NewsLayer';
import { type MapDockMode } from '@/components/map/MapDock';
import {
  consumeHomeRestore,
  currentHomeScrollY,
  homeScrollRestored,
  rememberHomeView,
  replaceHomePanel,
  type HomeView } from '@/lib/home-return';
import { MapDrawer } from '@/components/map/MapDrawer';
import { MapTopControls } from '@/components/map/MapTopControls';
import { TimeBar } from '@/components/map/TimeBar';
import { ME_PREGUNTO_MAPA, ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import { esMePreguntaId, type MePreguntaPublica } from '@/lib/me-pregunto/shared';
import { MePreguntoMapPanel } from '@/components/map/panels/MePreguntoMapPanel';
import { BITS_DATA } from '@/lib/bits-data';
import { hardNavigateTo } from '@/lib/home-hard-nav';
import { fetchHuellas, type HuellaPunto } from '@/lib/huellas';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import { HOME_MESSAGES } from '@/lib/i18n/home-messages';
import { PREGUNTA_COPY, preguntaAlias } from '@/lib/i18n/pregunta-messages';
import { preguntaPorId, preguntaTexto } from '@/lib/pregunta-semana';
import type { RespuestaPublica } from '@/lib/respuestas/public';
import { PillNavButton } from '@/components/home/PillNavButton';
import type { GlobeBitMarker, GlobeLayerVisibility } from '@/components/globe/GlobeBitsLayer';
import { StoryViewer } from '@/components/mapa/StoryViewer';

/** Píldora «Sorpréndeme» del dock: ocultar en el lanzamiento (aún no hay historias publicadas). Volver a `true` para reactivarla. */
const SHOW_SURPRISE_ME_BUTTON = false;
/** Respuestas aprobadas en el globo. No entran al catálogo de historias. */
const SHOW_PUBLIC_RESPUESTAS = true;
/** Regla del globo para las preguntas de las personas (Ana, 4 nov 2026). */
const PREGUNTAS_GLOBO_COMPUTADOR = 20;
const PREGUNTAS_GLOBO_CELULAR = 12;
const LINEAS_PREGUNTA_COMPUTADOR = 8;
const LINEAS_PREGUNTA_CELULAR = 5;
/** Los mismos colores del punto multicolor de las preguntas. */
const COLORES_CONSTELACION = ['#FF6200', '#FF0A8A', '#0047FF', '#00B140', '#7A12E0', '#00C2D6', '#FFD000', '#FF1A1A'];

/** IDs sintéticos en el globo para historias (bits reales usan ids bajos desde huellas). */
const STORY_GLOBE_ID_BASE = 9_000_000;
const NEWS_GLOBE_ID_BASE = 8_000_000;
const RESPUESTA_GLOBE_ID_BASE = 7_000_000;
/** Preguntas de «Me pregunto…»: punto multicolor. */
const PREGUNTA_GLOBE_ID_BASE = 6_000_000;
const GLOBE_NEWS_MAX = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

function storyPublishedWithinDays(publishedAt: string | undefined, now: number, days: number): boolean {
  if (!publishedAt) return false;
  const at = Date.parse(publishedAt);
  if (!Number.isFinite(at)) return false;
  const age = now - at;
  return age >= 0 && age <= days * DAY_MS;
}

function jitterNewsOffset(id: string): { dLat: number; dLng: number } {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const a = ((h >>> 0) % 360) * (Math.PI / 180);
  const r = 0.2 + ((h >>> 8) % 16) * 0.015;
  return { dLat: Math.sin(a) * r, dLng: Math.cos(a) * r };
}

function storyHasValidGeo(s: { lat?: number | null; lng?: number | null }): boolean {
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

const RESPUESTA_KIND = {
  es: { texto: 'texto', voz: 'voz', foto: 'foto' },
  pt: { texto: 'texto', voz: 'voz', foto: 'foto' },
  en: { texto: 'text', voz: 'voice', foto: 'photo' },
} as const;

function respuestaAsStory(item: RespuestaPublica, locale: keyof typeof RESPUESTA_KIND): StoryPoint {
  const alias = preguntaAlias(item.alias);
  const pregunta = preguntaPorId(item.questionId);
  const question = item.questionText || (preguntaTexto(item.questionId, item.mode, locale) ?? '');
  const tema = item.questionText ? ME_PREGUNTO_UI[locale].capa : pregunta?.tema[locale] ?? '';
  const story: StoryPoint = {
    id: item.id,
    lat: item.lat ?? Number.NaN,
    lng: item.lng ?? Number.NaN,
    label: alias,
    title: alias,
    city: item.city,
    country: item.country,
    questionId: item.questionId,
    questionMode: item.mode,
    subtitle: tema && question ? `${tema} · ${question}` : question || tema,
    format: RESPUESTA_KIND[locale][item.kind],
    ...(item.anio ? { publishedAt: `${item.anio}-07-01T12:00:00Z` } : {}),
  };
  if (item.kind === 'texto') {
    story.body = item.contenido;
    story.hasText = Boolean(item.contenido);
  } else if (item.kind === 'voz' && item.previewUrl) {
    story.audioUrl = item.previewUrl;
    story.hasAudio = true;
  } else if (item.kind === 'foto' && item.previewUrl) {
    story.imagenes = [{ url: item.previewUrl, descripcion: item.contenido || undefined }];
  }
  return story;
}

function pickSurpriseStory(stories: StoryPoint[], lastId: string | null): StoryPoint | null {
  if (stories.length === 0) return null;
  const pool =
    lastId && stories.length > 1 ? stories.filter((s) => s.id !== lastId) : stories;
  const list = pool.length > 0 ? pool : stories;
  const i = Math.floor(Math.random() * list.length);
  return list[i] ?? null;
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
    ...(b.fuenteUrl ? { fuenteUrl: b.fuenteUrl } : {}) }));
}
import { StoriesPanel } from '@/components/map/panels/StoriesPanel';
import { PreguntaPanel } from '@/components/map/panels/PreguntaPanel';
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
  type AmbientKey } from '@/lib/sound/ambient';
import { MAP_LAYOUT_MOBILE_MAX_WIDTH_PX } from '@/lib/map-layout';
import { useViewportBelow } from '@/hooks/useViewportBelow';
import { resolveViewerAnchor } from '@/lib/viewer-solar-night';
/** Encuadre inicial del globo en home (Sudamérica de frente). La noche usa la zona horaria, sin GPS. */
const HOME_GLOBE_FRAME_LAT = -15;
const HOME_GLOBE_FRAME_LNG = -60;

const GlobeV2Home = dynamic(() => import('@/components/globe/GlobeV2').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center bg-transparent text-[length:var(--fs-pequeno)] text-white/40">
      Cargando mapa…
    </div>
  ) });

export type HomeMapProps = {
  /**
   * Contenedor del universo (globo) desde `MapSectionLocked`.
   * IntersectionObserver usa este nodo para arrancar/cortar el ambiente según scroll (no el globo Three.js).
   */
  universeSectionRef?: RefObject<HTMLDivElement | null>;
};

export default function HomeMap({ universeSectionRef }: HomeMapProps = {}) {
  const [tzFrame, setTzFrame] = useState({ lat: HOME_GLOBE_FRAME_LAT, lng: HOME_GLOBE_FRAME_LNG });

  useEffect(() => {
    const anchor = resolveViewerAnchor();
    if (anchor) setTzFrame(anchor);
  }, []);

  const viewerLat = tzFrame.lat;
  const viewerLng = tzFrame.lng;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<MapDockMode>('stories');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('universo');
  const [exploreQuery, setExploreQuery] = useState('');
  const [respuestaQuery, setRespuestaQuery] = useState('');
  const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(null);
  const [openStory, setOpenStory] = useState<StoryPoint | null>(null);
  const [storyViewerClosing, setStoryViewerClosing] = useState(false);
  const storyCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSurpriseIdRef = useRef<string | null>(null);
  const pendingSurpriseRef = useRef<StoryPoint | null>(null);
  const surpriseSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number; nonce: number } | null>(
    null
  );
  const [surpriseFlying, setSurpriseFlying] = useState(false);
  const [surpriseNotice, setSurpriseNotice] = useState<string | null>(null);
  const selectedTopicId: string | null = null;
  /** Portal del dock neumórfico bajo el título (`#map-dock-slot` en MapSectionLocked). */
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);
  /** Textos curiosos y categorías: `public/huellas2.json`. Fallback = BITS_DATA (solo lugar/país) si falla la carga. */
  const [huellasPuntos, setHuellasPuntos] = useState<HuellaPunto[]>(huellasFallbackDesdeBitsData);
  const [selectedBit, setSelectedBit] = useState<HuellaPunto | BitLike | null>(null);
  const [globeLayers, setGlobeLayers] = useState<GlobeLayerVisibility>({
    stories: true,
    bits: true,
    news: false,
    respuestas: true });
  const [respuestas, setRespuestas] = useState<RespuestaPublica[]>([]);
  const [respuestasReady, setRespuestasReady] = useState(false);
  const [mePreguntas, setMePreguntas] = useState<MePreguntaPublica[]>([]);
  /** Pregunta de «Me pregunto…» tocada en el globo. */
  const [abrirPregunta, setAbrirPregunta] = useState<string | null>(null);
  const [openRespuesta, setOpenRespuesta] = useState<RespuestaPublica | null>(null);
  const [pinnedStory, setPinnedStory] = useState<StoryPoint | null>(null);
  const [pinnedRespuesta, setPinnedRespuesta] = useState<RespuestaPublica | null>(null);
  const hadPanelRef = useRef(false);

  useLayoutEffect(() => {
    const saved = consumeHomeRestore();
    if (!saved) return;
    setGlobeLayers(saved.layers);
    setDrawerMode(saved.capa ?? 'stories');
    setDrawerOpen(Boolean(saved.capa));
  }, []);

  const homeView = useCallback((): HomeView => {
    return {
      scrollY: currentHomeScrollY(),
      capa: drawerOpen ? drawerMode : null,
      layers: globeLayers,
    };
  }, [drawerMode, drawerOpen, globeLayers]);

  useEffect(() => {
    rememberHomeView(homeView());
  }, [homeView]);

  useEffect(() => {
    const storyId = openStory?.id ?? null;
    const respuestaId = openRespuesta?.id ?? null;
    if (!storyId && !respuestaId && !hadPanelRef.current) return;
    hadPanelRef.current = Boolean(storyId || respuestaId);
    const kind = storyId ? 'historia' : respuestaId ? 'respuesta' : null;
    const id = storyId ?? respuestaId;
    replaceHomePanel(kind, id, homeView());
  }, [openStory?.id, openRespuesta?.id, homeView]);

  useEffect(() => {
    if (!SHOW_PUBLIC_RESPUESTAS) {
      setRespuestasReady(true);
      return;
    }
    let cancel = false;
    const lista = (url: string) =>
      fetch(url)
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data: { items?: RespuestaPublica[] }) => (Array.isArray(data.items) ? data.items : []))
        .catch(() => [] as RespuestaPublica[]);
    // Las respuestas de las preguntas del sitio y las de «Me pregunto…» van juntas en el globo.
    void Promise.all([lista('/api/respuestas/public?banco=hilos&limit=500'), lista('/api/respuestas/public?banco=me-pregunto')])
      .then(([hilos, me]) => {
        if (cancel) return;
        setRespuestas([...hilos, ...me, ...(demoConstelacionActiva() ? DEMO_RESPUESTAS : [])]);
      })
      .catch(() => {
        if (!cancel) setRespuestas([]);
      })
      .finally(() => {
        if (!cancel) setRespuestasReady(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    void fetch('/api/me-pregunto')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: MePreguntaPublica[] }) => {
        if (!cancel) setMePreguntas([...(demoConstelacionActiva() ? DEMO_PREGUNTAS : []), ...(Array.isArray(data.items) ? data.items : [])]);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!globeLayers.respuestas) setOpenRespuesta(null);
  }, [globeLayers.respuestas]);
  const [newsMarkersMounted, setNewsMarkersMounted] = useState(false);

  useEffect(() => {
    setDockSlot(typeof document !== 'undefined' ? document.getElementById('map-dock-slot') : null);
  }, []);

  useLayoutEffect(() => {
    if (!dockSlot) return;
    const scroller = dockSlot.querySelector('.map-dock-scroller');
    const row = dockSlot.querySelector('.map-dock-row');
    if (!(scroller instanceof HTMLElement) || !(row instanceof HTMLElement)) return;
    const fit = () => {
      row.style.zoom = '1';
      void row.offsetWidth;
      const available = scroller.clientWidth;
      const needed = row.scrollWidth;
      row.style.zoom = needed > available + 1 ? String(available / needed) : '';
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(scroller);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [dockSlot]);

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

  const storiesReales = useStories();
  // Vista previa: historias inventadas para probar la tarjeta (?demo=historias). Nunca en producción.
  const [demoHistorias, setDemoHistorias] = useState(false);
  useEffect(() => {
    if (demoHistoriasActiva()) setDemoHistorias(true);
  }, []);
  const stories = useMemo(
    () => (demoHistorias ? [...DEMO_HISTORIAS, ...storiesReales] : storiesReales),
    [demoHistorias, storiesReales]
  );
  const searchParams = useSearchParams();
  const locale = useHomeLocaleOptional()?.locale ?? 'es';
  const dockCopy = mapChrome(locale);
  const openedHistoriaRef = useRef<string | null>(null);
  const openedRespuestaRef = useRef<string | null>(null);
  const openedCapaRef = useRef(false);

  const globeBitsMarkers = useMemo(
    () =>
      huellasPuntos.map((b) => ({
        id: b.id,
        lat: b.lat,
        lon: b.lon,
        color: b.color,
        markerKind: 'bit' as const })),
    [huellasPuntos]
  );

  /** Solo historias con lat/lng válidos (misma lista que usa el clic y el resaltado). */
  const storiesOnGlobe = useMemo(() => {
    const list = stories.filter((s) => storyHasValidGeo(s));
    if (
      pinnedStory &&
      openStory?.id === pinnedStory.id &&
      storyHasValidGeo(pinnedStory) &&
      !list.some((item) => item.id === pinnedStory.id)
    ) {
      return [...list, pinnedStory];
    }
    return list;
  }, [stories, pinnedStory, openStory]);

  const realPublishedStories = storiesOnGlobe;

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

  const startMapAmbientFromRefs = useCallback(() => {
    initFromUserGesture();
    const m = selectedMoodRef.current;
    if (!m) return Promise.resolve();
    return unlockAmbientAudio()
      .then(async () => {
        if (!soundEnabledRef.current) return;
        if (isPublicAudioMoodId(m)) {
          const path = publicAudioPathFromMoodId(m);
          if (path) await playAmbientFromPublicUrl(path, { fadeMs: 1500 });
          return;
        }
        await playAmbient(m as AmbientKey, { fadeMs: 1500 });
      })
      .catch(() => {});
  }, []);

  // Visibilidad del globo. El sonido no arranca solo: solo el botón del parlante lo enciende.
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
        window.dispatchEvent(new CustomEvent('almamundi:mapInView'));
      }
    };

    const io = new IntersectionObserver(onIntersect, {
      threshold: thresholds,
      root: null,
      rootMargin: '0px' });
    io.observe(section);
    return () => io.disconnect();
  }, [universeSectionRef]);

  // Reproducir o cortar el ambient según visibilidad del universo + soundEnabled (misma API: stopAmbient / startMapAmbientFromRefs).
  useEffect(() => {
    if (!globeInView || !soundEnabled || !selectedMood) {
      stopAmbient();
      return;
    }
    setAmbientEnabled(true);
    void startMapAmbientFromRefs();
  }, [globeInView, soundEnabled, selectedMood, startMapAmbientFromRefs]);

  /** Al irse de la página el ambiente se apaga con el mismo fundido, no de golpe. */
  useEffect(() => {
    const fadeOut = () => {
      stopAmbient();
    };
    window.addEventListener('pagehide', fadeOut);
    return () => {
      window.removeEventListener('pagehide', fadeOut);
      stopAmbient();
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((v) => {
      const next = !v;
      if (next) initFromUserGesture();
      try {
        window.localStorage.setItem('almamundi_sound_enabled', String(next));
      } catch {
        /* noop */
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
            topic: typeof i.topic === 'string' ? i.topic : topicLabel ?? 'Actualidad' } as NewsItem;
        });

      const apiTopic = topic.length > 80 ? topic.slice(0, 80) : topic;
      const q = new URLSearchParams({
        kind: 'news',
        topic: apiTopic,
        limit: '20',
        lang: 'es' });
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
          relaxedTopic: data.relaxedTopic });
      }

      return {
        topicItems,
        generalItems,
        topicMatched: Boolean(data.topicMatched) && topicItems.length > 0,
        relaxedTopic: Boolean(data.relaxedTopic) && generalItems.length > 0,
        isFallback: Boolean(data.isFallback) && topicItems.length === 0 && generalItems.length === 0 };
    },
    [selectedTopicId]
  );

  const {
    topicItems: topicNewsItems,
    generalItems: generalNewsItems } = useNewsLayer(
    selectedTopicId,
    topicQuery,
    'actualidad',
    fetchNews,
    {
      refreshIntervalMs: 120_000 }
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
        url: n.url };
    });
  }, [filteredNewsItems, newsMarkersMounted]);

  const respuestasOnGlobe = useMemo(() => {
    // 40 respuestas a preguntas de AlmaMundi. Las respuestas a preguntas de las personas no son puntos:
    // viven en la tarjeta de su pregunta y se ven como líneas al abrirla (constelación, 4 nov 2026).
    const conGeo = respuestas.filter((item) => storyHasValidGeo(item));
    const list = conGeo.filter((item) => !esMePreguntaId(item.questionId)).slice(0, 40);
    if (
      pinnedRespuesta &&
      openRespuesta?.id === pinnedRespuesta.id &&
      storyHasValidGeo(pinnedRespuesta) &&
      !list.some((item) => item.id === pinnedRespuesta.id)
    ) {
      return [...list, pinnedRespuesta];
    }
    return list;
  }, [respuestas, pinnedRespuesta, openRespuesta]);

  const globeRespuestaMarkers = useMemo((): GlobeBitMarker[] => {
    return respuestasOnGlobe.map((item, i) => ({
      id: RESPUESTA_GLOBE_ID_BASE + i,
      lat: item.lat as number,
      lon: item.lng as number,
      markerKind: 'respuesta' as const,
      title: item.alias,
      place: item.city,
      color: '#FF4A1C' }));
  }, [respuestasOnGlobe]);

  /** Respuestas a preguntas de las personas, agrupadas por pregunta (llegan de la más nueva a la más antigua). */
  const respuestasPorPregunta = useMemo(() => {
    const mapa = new Map<string, RespuestaPublica[]>();
    for (const item of respuestas) {
      if (!esMePreguntaId(item.questionId)) continue;
      const lista = mapa.get(item.questionId) ?? [];
      lista.push(item);
      mapa.set(item.questionId, lista);
    }
    return mapa;
  }, [respuestas]);

  /**
   * Regla del globo: máximo 20 preguntas en computador y 12 en celular.
   * Primero las que tienen respuestas (la de respuesta más reciente primero); después el resto.
   * La pregunta abierta siempre está.
   */
  const preguntasOnGlobe = useMemo(() => {
    const conGeo = mePreguntas.filter(
      (p) => typeof p.lat === 'number' && typeof p.lng === 'number' && Number.isFinite(p.lat) && Number.isFinite(p.lng)
    );
    const ordenRespuesta = new Map<string, number>();
    [...respuestasPorPregunta.keys()].forEach((id, i) => ordenRespuesta.set(id, i));
    const ordenadas = [...conGeo].sort((a, b) => {
      const ra = ordenRespuesta.get(a.id);
      const rb = ordenRespuesta.get(b.id);
      if (ra != null && rb != null) return ra - rb;
      if (ra != null) return -1;
      if (rb != null) return 1;
      return 0;
    });
    const tope = isMobile ? PREGUNTAS_GLOBO_CELULAR : PREGUNTAS_GLOBO_COMPUTADOR;
    const lista = ordenadas.slice(0, tope);
    const abierta = abrirPregunta ? conGeo.find((p) => p.id === abrirPregunta) : undefined;
    if (abierta && !lista.some((p) => p.id === abierta.id)) lista.push(abierta);
    return lista;
  }, [mePreguntas, respuestasPorPregunta, isMobile, abrirPregunta]);

  /**
   * Constelación de la pregunta abierta: una línea por lugar (varias respuestas de la misma ciudad = una línea),
   * con las respuestas más recientes. Máximo 8 en computador y 5 en celular.
   */
  const preguntaArcs = useMemo((): GlobeArc[] => {
    if (!drawerOpen || drawerMode !== 'mepregunto' || !abrirPregunta) return [];
    const pregunta = preguntasOnGlobe.find((p) => p.id === abrirPregunta);
    if (!pregunta || typeof pregunta.lat !== 'number' || typeof pregunta.lng !== 'number') return [];
    const tope = isMobile ? LINEAS_PREGUNTA_CELULAR : LINEAS_PREGUNTA_COMPUTADOR;
    const vistos = new Set<string>();
    const arcs: GlobeArc[] = [];
    for (const item of respuestasPorPregunta.get(abrirPregunta) ?? []) {
      if (typeof item.lat !== 'number' || typeof item.lng !== 'number') continue;
      const lugar = item.city.trim()
        ? `${item.city.trim().toLowerCase()}|${item.country.trim().toLowerCase()}`
        : `${item.lat.toFixed(1)},${item.lng.toFixed(1)}`;
      if (vistos.has(lugar)) continue;
      vistos.add(lugar);
      arcs.push({
        from: { lat: pregunta.lat, lon: pregunta.lng },
        to: { lat: item.lat, lon: item.lng },
        color: COLORES_CONSTELACION[arcs.length % COLORES_CONSTELACION.length]!,
      });
      if (arcs.length >= tope) break;
    }
    return arcs;
  }, [drawerOpen, drawerMode, abrirPregunta, preguntasOnGlobe, respuestasPorPregunta, isMobile]);

  const globePreguntaMarkers = useMemo((): GlobeBitMarker[] => {
    return preguntasOnGlobe.map((p, i) => ({
      id: PREGUNTA_GLOBE_ID_BASE + i,
      lat: p.lat as number,
      lon: p.lng as number,
      markerKind: 'pregunta' as const,
      title: p.texto.length > 90 ? `${p.texto.slice(0, 88)}…` : p.texto,
      place: formatPublicPlace(p.city, p.country, locale) || undefined,
    }));
  }, [preguntasOnGlobe, locale]);

  const globeMarkers = useMemo((): GlobeBitMarker[] => {
    const now = Date.now();
    const storyLayer: GlobeBitMarker[] = storiesOnGlobe.map((s, i) => ({
      id: STORY_GLOBE_ID_BASE + i,
      lat: s.lat,
      lon: s.lng,
      markerKind: 'story' as const,
      title: s.title ?? s.label,
      place: formatPublicPlace(s.city, s.country, locale) || undefined,
      color: '#FF4A1C',
      pulse: storyPublishedWithinDays(s.publishedAt, now, 7),
    }));
    return [
      ...globeBitsMarkers,
      ...storyLayer,
      ...globeNewsMarkers,
      ...(SHOW_PUBLIC_RESPUESTAS ? globeRespuestaMarkers : []),
      ...globePreguntaMarkers,
    ];
  }, [globeBitsMarkers, storiesOnGlobe, globeNewsMarkers, globeRespuestaMarkers, globePreguntaMarkers, locale]);

  const openStoryViewer = useCallback((story: StoryPoint) => {
    if (storyCloseTimerRef.current) {
      clearTimeout(storyCloseTimerRef.current);
      storyCloseTimerRef.current = null;
    }
    setStoryViewerClosing(false);
    setHighlightedStoryId(story.id ?? null);
    setDrawerOpen(false);
    setOpenRespuesta(null);
    setPinnedRespuesta(null);
    setPinnedStory((current) => (current?.id === story.id ? current : null));
    setOpenStory(story);
    if (storyHasValidGeo(story)) {
      setSurpriseFlying(true);
      setFocusTarget({ lat: story.lat, lng: story.lng, nonce: Date.now() });
    }
  }, []);

  const showRespuesta = useCallback((item: RespuestaPublica) => {
    if (storyCloseTimerRef.current) {
      clearTimeout(storyCloseTimerRef.current);
      storyCloseTimerRef.current = null;
    }
    setStoryViewerClosing(false);
    setOpenStory(null);
    setHighlightedStoryId(null);
    setDrawerOpen(false);
    setPinnedStory(null);
    setPinnedRespuesta(item);
    setOpenRespuesta(item);
    if (storyHasValidGeo(item) && item.lat != null && item.lng != null) {
      setSurpriseFlying(true);
      setFocusTarget({ lat: item.lat, lng: item.lng, nonce: Date.now() });
    }
  }, []);

  const finishSurpriseOpen = useCallback(() => {
    const story = pendingSurpriseRef.current;
    pendingSurpriseRef.current = null;
    if (surpriseSafetyTimerRef.current) {
      clearTimeout(surpriseSafetyTimerRef.current);
      surpriseSafetyTimerRef.current = null;
    }
    setSurpriseFlying(false);
    setFocusTarget(null);
    if (story) openStoryViewer(story);
  }, [openStoryViewer]);

  const handleSurpriseMe = useCallback(() => {
    setSurpriseNotice(null);
    const pick = pickSurpriseStory(realPublishedStories, lastSurpriseIdRef.current);
    if (!pick) {
      setSurpriseNotice('Todavía no hay historias para sorprenderte, vuelve pronto');
      return;
    }
    lastSurpriseIdRef.current = pick.id;
    setGlobeLayers((prev) => ({ ...prev, stories: true }));
    openStoryViewer(pick);
  }, [realPublishedStories, openStoryViewer]);

  useEffect(() => {
    const historiaId = searchParams.get('historia');
    if (!historiaId || openedHistoriaRef.current === historiaId) return;
    const known = stories.find((item) => item.id === historiaId);
    if (known) {
      openedHistoriaRef.current = historiaId;
      setPinnedStory(null);
      setGlobeLayers((prev) => ({ ...prev, stories: true }));
      if (!homeScrollRestored()) {
        document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      openStoryViewer(known);
      return;
    }
    let cancel = false;
    void fetch(`/api/stories/${encodeURIComponent(historiaId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { story?: StoryPoint } | null) => {
        if (cancel || openedHistoriaRef.current === historiaId) return;
        const story = data?.story;
        if (!story || story.id !== historiaId) return;
        openedHistoriaRef.current = historiaId;
        setPinnedStory(story);
        setGlobeLayers((prev) => ({ ...prev, stories: true }));
        if (!homeScrollRestored()) {
          document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        openStoryViewer(story);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [searchParams, stories, openStoryViewer]);

  useEffect(() => {
    const respuestaId = searchParams.get('respuesta');
    if (!SHOW_PUBLIC_RESPUESTAS || !respuestaId || openedRespuestaRef.current === respuestaId || !respuestasReady) return;
    const openRespuestaOnGlobe = (item: RespuestaPublica) => {
      openedRespuestaRef.current = respuestaId;
      setPinnedRespuesta(item);
      setOpenStory(null);
      setHighlightedStoryId(null);
      setDrawerOpen(false);
      setOpenRespuesta(item);
      setGlobeLayers((prev) => ({ ...prev, respuestas: true }));
      if (!homeScrollRestored()) {
        document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (storyHasValidGeo(item) && item.lat != null && item.lng != null) {
        setSurpriseFlying(true);
        setFocusTarget({ lat: item.lat, lng: item.lng, nonce: Date.now() });
      }
    };
    const known = respuestas.find((item) => item.id === respuestaId);
    if (known) {
      openRespuestaOnGlobe(known);
      return;
    }
    let cancel = false;
    void fetch(`/api/respuestas/public/${encodeURIComponent(respuestaId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { item?: RespuestaPublica } | null) => {
        if (cancel || openedRespuestaRef.current === respuestaId) return;
        const item = data?.item;
        if (!item || item.id !== respuestaId) return;
        openRespuestaOnGlobe(item);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [searchParams, respuestas, respuestasReady]);

  useEffect(() => {
    const capa = searchParams.get('capa');
    if (openedCapaRef.current) return;
    if (capa !== 'pregunta' && capa !== 'respuestas' && capa !== 'me-pregunto') return;
    openedCapaRef.current = true;
    if (capa === 'me-pregunto') {
      const mp = searchParams.get('mp');
      if (esMePreguntaId(mp)) setAbrirPregunta(mp);
      setGlobeLayers((prev) => ({ ...prev, respuestas: true }));
      setDrawerMode('mepregunto');
    } else if (capa === 'respuestas') {
      setGlobeLayers((prev) => ({ ...prev, respuestas: true }));
      setDrawerMode('respuestas');
    } else {
      setGlobeLayers((prev) => ({ ...prev, news: true }));
      setDrawerMode('news');
    }
    setDrawerOpen(true);
    if (!homeScrollRestored()) {
      document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  const closeStoryViewer = useCallback(() => {
    setStoryViewerClosing(true);
    if (storyCloseTimerRef.current) clearTimeout(storyCloseTimerRef.current);
    storyCloseTimerRef.current = setTimeout(() => {
      setOpenStory(null);
      setPinnedStory(null);
      setHighlightedStoryId(null);
      setStoryViewerClosing(false);
      storyCloseTimerRef.current = null;
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (storyCloseTimerRef.current) clearTimeout(storyCloseTimerRef.current);
      if (surpriseSafetyTimerRef.current) clearTimeout(surpriseSafetyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!surpriseNotice) return;
    const t = window.setTimeout(() => setSurpriseNotice(null), 6000);
    return () => window.clearTimeout(t);
  }, [surpriseNotice]);

  const selectedGlobeMarkerId = useMemo(() => {
    if (openRespuesta) {
      const idx = respuestasOnGlobe.findIndex((item) => item.id === openRespuesta.id);
      if (idx >= 0) return RESPUESTA_GLOBE_ID_BASE + idx;
    }
    if (drawerMode === 'mepregunto' && abrirPregunta) {
      const idx = preguntasOnGlobe.findIndex((p) => p.id === abrirPregunta);
      if (idx >= 0) return PREGUNTA_GLOBE_ID_BASE + idx;
    }
    if (drawerMode === 'bits' && selectedBit) return selectedBit.id;
    if (highlightedStoryId != null) {
      const idx = storiesOnGlobe.findIndex((s) => s.id === highlightedStoryId);
      return idx >= 0 ? STORY_GLOBE_ID_BASE + idx : null;
    }
    return null;
  }, [drawerMode, selectedBit, highlightedStoryId, storiesOnGlobe, openRespuesta, respuestasOnGlobe, abrirPregunta, preguntasOnGlobe]);

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
          const external = !marker.url.startsWith('/') && !/almamundi\.org/i.test(marker.url);
          if (external) window.open(marker.url, '_blank', 'noopener,noreferrer');
          else window.location.assign(marker.url);
        }
        return;
      }
      if (id >= RESPUESTA_GLOBE_ID_BASE) {
        const item = respuestasOnGlobe[id - RESPUESTA_GLOBE_ID_BASE];
        if (!item) return;
        showRespuesta(item);
        return;
      }
      if (id >= PREGUNTA_GLOBE_ID_BASE) {
        const pregunta = preguntasOnGlobe[id - PREGUNTA_GLOBE_ID_BASE];
        if (!pregunta) return;
        setOpenStory(null);
        setHighlightedStoryId(null);
        setOpenRespuesta(null);
        setAbrirPregunta(pregunta.id);
        setDrawerMode('mepregunto');
        setDrawerOpen(true);
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
    [storiesOnGlobe, huellasPuntos, openStoryViewer, globeNewsMarkers, respuestasOnGlobe, showRespuesta, preguntasOnGlobe]
  );

  function onGlobeLayerPill(mode: 'stories' | 'news' | 'bits' | 'respuestas' | 'mepregunto', key: keyof GlobeLayerVisibility) {
    if (mode === 'mepregunto') setAbrirPregunta(null);
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
    setOpenRespuesta(null);
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
    highlightedStoryId };

  const sonidosProps = {
    currentMood: selectedMood,
    onMoodChange: (m: string) => setSelectedMood(m),
    soundEnabled,
    onToggleSound: handleToggleSound };

  return (
    <div className="relative flex min-h-[88vh] w-full flex-1 flex-col overflow-hidden bg-[#05070D]">
      {/* Globo — crece dentro del alto del padre (#mapa universo), sin forzar 72vh+ extra */}
      <div
        ref={globeContainerRef}
        className="relative flex min-h-[min(520px,62vh)] w-full flex-1 flex-col overflow-hidden"
      >
        {/* GlobeV2 embebido. Rollback vídeo: import NASAEpicEarthVideo y <NASAEpicEarthVideo source="spinning" />. */}
        <div className="map-globe-home relative flex w-full min-h-[58vh] flex-1 flex-col overflow-hidden bg-transparent pt-0 pb-0">
          <div className="relative min-h-[min(380px,48vh)] h-full w-full flex-1 overflow-hidden bg-transparent">
            <GlobeV2Home
              embedded
              forceDaylight
              earthVisualTimeScale={1050}
              initialViewLat={tzFrame.lat}
              initialViewLng={tzFrame.lng}
              viewerLat={viewerLat}
              viewerLng={viewerLng}
              bits={globeMarkers}
              selectedBitId={selectedGlobeMarkerId}
              layerVisibility={globeLayers}
              pauseEarthSpinForUi={
                Boolean(openStory) ||
                Boolean(openRespuesta) ||
                surpriseFlying ||
                (drawerOpen && drawerMode === 'bits') ||
                /* Con una pregunta abierta, el planeta no gira solo: las líneas quedan quietas y se recorren con el mouse o el dedo. */
                preguntaArcs.length > 0
              }
              onBitClick={handleGlobeMarkerClick}
              arcs={preguntaArcs}
              arcsMobile={isMobile}
              focusTarget={focusTarget}
              onFocusArrived={finishSurpriseOpen}
            />
            {SHOW_PUBLIC_RESPUESTAS && openRespuesta ? (
              <StoryViewer
                story={respuestaAsStory(openRespuesta, locale)}
                onClose={() => {
                  setOpenRespuesta(null);
                  setPinnedRespuesta(null);
                }}
                onBack={() => {
                  setOpenRespuesta(null);
                  setDrawerMode('respuestas');
                  setDrawerOpen(true);
                }}
                isClosing={false}
                variant="compact"
                catalog={false}
              />
            ) : null}
            {openStory ? (
              <StoryViewer
                story={openStory}
                onClose={closeStoryViewer}
                isClosing={storyViewerClosing}
                variant="compact"
                onTellStory={() => {
                  if (storyCloseTimerRef.current) {
                    clearTimeout(storyCloseTimerRef.current);
                    storyCloseTimerRef.current = null;
                  }
                  setOpenStory(null);
                  setStoryViewerClosing(false);
                  setHighlightedStoryId(null);
                  handleSubirMiHistoria();
                }}
              />
            ) : null}
          </div>
        </div>
      {/* Franja fecha/hora: capa independiente debajo del globo (regla mapa-seccion-lock); z-10 para que nunca quede tapada */}
      <div
        className="map-timebar-stage relative z-20 -mt-px flex w-full flex-shrink-0 flex-col items-center justify-end border-0 pb-8 pt-2 shadow-none outline-none"
      >
        <TimeBar className="pointer-events-none text-center text-[length:var(--fs-etiqueta)] text-slate-400/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]" />
      </div>

      {/* Dock: Historias, También cuenta, Noticias (capas), luego Sonidos (audio), luego buscar. */}
      {dockSlot &&
        createPortal(
          <div className="map-dock-stack">
          <div className="map-dock-scroller">
          <div className="map-dock-row map-dock-barra" role="toolbar" aria-label={dockCopy.dockAria}>
            {/* Orden (Ana, 4 nov 2026): historias, las dos respuestas juntas, lugares y, aparte, buscar. */}
            <div className="map-dock-line">
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'stories'}
                title={globeLayers.stories ? dockCopy.storiesOn : dockCopy.storiesOff}
                onClick={() => onGlobeLayerPill('stories', 'stories')}
              >
                <i className="map-dock-legend__dot map-dock-legend__dot--story" aria-hidden />
                {dockCopy.stories}
              </PillNavButton>
              {SHOW_SURPRISE_ME_BUTTON ? (
              <PillNavButton
                dock
                title={dockCopy.surpriseTitle}
                onClick={handleSurpriseMe}
              >
                {dockCopy.surprise}
              </PillNavButton>
              ) : null}
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'respuestas'}
                title={ME_PREGUNTO_MAPA[locale].dockAlmaMundi}
                onClick={() => onGlobeLayerPill('respuestas', 'respuestas')}
              >
                <i className="map-dock-legend__dot map-dock-legend__dot--answer" aria-hidden />
                {ME_PREGUNTO_MAPA[locale].dockAlmaMundi}
              </PillNavButton>
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'mepregunto'}
                title={ME_PREGUNTO_MAPA[locale].titulo}
                onClick={() => onGlobeLayerPill('mepregunto', 'respuestas')}
              >
                <i className="map-dock-legend__dot map-dock-legend__dot--me" aria-hidden />
                {ME_PREGUNTO_MAPA[locale].titulo}
              </PillNavButton>
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'bits'}
                title={globeLayers.bits ? dockCopy.bitsOn : dockCopy.bitsOff}
                onClick={() => onGlobeLayerPill('bits', 'bits')}
              >
                <i className="map-dock-legend__dot map-dock-legend__dot--bit" aria-hidden />
                {dockCopy.bits}
              </PillNavButton>
            </div>
            <div className="map-dock-line map-dock-line--buscar">
              <PillNavButton
                dock
                active={drawerOpen && drawerMode === 'search'}
                onClick={() => open('search')}
                title={dockCopy.searchTitle}
              >
                <Search size={16} strokeWidth={2} aria-hidden />
                <span className="map-dock-buscar-texto">{dockCopy.search}</span>
              </PillNavButton>
            </div>
          </div>
          </div>
          </div>,
          dockSlot
        )}

      {/* Cortar sonido del universo: a la derecha del globo para que la persona pueda apagarlo si no quiere escucharlo */}
      <div
        className={`map-sound-control absolute top-0 right-4 md:right-6 z-30 pt-2 md:pt-3${
          openStory || (SHOW_PUBLIC_RESPUESTAS && openRespuesta) ? ' map-sound-control--panel-open' : ''
        }`}
      >
        <MapTopControls
          embedded
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenSounds={() => (drawerOpen && drawerMode === 'sounds' ? close() : open('sounds'))}
          soundsLabel={dockCopy.changeSound}
        />
      </div>
      {surpriseNotice ? (
        <p
          role="status"
          className="pointer-events-none absolute bottom-28 left-1/2 z-30 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 rounded-full px-4 py-2 text-center text-[length:var(--fs-pequeno)] text-white/90"
          style={{
            background: 'rgba(15, 23, 42, 0.82)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
        >
          {surpriseNotice}
        </p>
      ) : null}

      <MapDrawer open={drawerOpen} mode={drawerMode} onClose={close} isMobile={isMobile} fitContent={drawerMode === 'bits' || drawerMode === 'sounds'}>
          {drawerMode === 'stories' || drawerMode === 'search' ? (
            <StoriesPanel
              {...historiasProps}
              panelMode={drawerMode === 'search' ? 'search' : 'stories'}
              onContarMiHistoria={handleSubirMiHistoria}
            />
          ) : drawerMode === 'news' ? (
            <PreguntaPanel />
          ) : drawerMode === 'mepregunto' ? (
            <MePreguntoMapPanel
              locale={locale}
              respuestas={respuestas.filter((item) => esMePreguntaId(item.questionId))}
              openId={openRespuesta?.id ?? null}
              onOpen={showRespuesta}
              preguntas={mePreguntas}
              abrirId={abrirPregunta}
            />
          ) : drawerMode === 'respuestas' ? (
            <StoriesPanel
              stories={respuestas
                .filter((item) => !esMePreguntaId(item.questionId))
                .map((item) => respuestaAsStory(item, locale))}
              exploreQuery={respuestaQuery}
              onExploreQueryChange={setRespuestaQuery}
              onStoryFocus={(story) => {
                const item = respuestas.find((entry) => entry.id === story.id);
                if (item) showRespuesta(item);
              }}
              highlightedStoryId={openRespuesta?.id ?? null}
              answerRows
              kicker={HILOS_UI[locale].leyenda}
              emptyText={PREGUNTA_COPY.empty[locale]}
            />
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
    </div>
  );
}

