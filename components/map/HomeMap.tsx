'use client';

/**
 * Versión alternativa del mapa para home (dock + drawer + historias/noticias/sonidos).
 * Misma lógica que /mapa: nubes, día/noche por hora del usuario, sin arrastre, auto-rotación.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { useStories } from '@/hooks/useStories';
import { useUserPosition } from '@/hooks/useUserPosition';
import { isNightAtLocation } from '@/lib/sunPosition';
import type { StoryPoint } from '@/lib/map-data/stories';
import { getPulseConfig } from '@/lib/storyPulse';
import { useNewsLayer, type NewsItem } from '@/components/NewsLayer';
import { DEFAULT_NEWS_TOPIC_QUERY, NEWS_TOPIC_GROUPS } from '@/lib/news-topics';
import { type MapDockMode } from '@/components/map/MapDock';
import { MapDrawer } from '@/components/map/MapDrawer';
import { MapTopControls } from '@/components/map/MapTopControls';
import { TimeBar } from '@/components/map/TimeBar';
import { StoriesPanel } from '@/components/map/panels/StoriesPanel';
import { NewsPanel } from '@/components/map/panels/NewsPanel';
import { SoundsPanel } from '@/components/map/panels/SoundsPanel';

const MapCanvas = dynamic(
  () => import('@/components/map/MapCanvas').then((m) => ({ default: m.MapCanvas })),
  { ssr: false }
);

const GLOBE_IMAGE_NIGHT = '/textures/earth-night.jpg';
const GLOBE_IMAGE_DAY = '/textures/earth-day.png';
const GLOBE_CANVAS_BG = 'rgba(0,0,0,0)';
const EMBEDDED_POV = { lat: -8, lng: -28, altitude: 1.35 };

export default function HomeMap() {
  const router = useRouter();
  const globeEl = useRef<unknown>(null);
  const basePOVRef = useRef<{ lat: number; lng: number; altitude: number } | null>(null);
  const cloudMeshRef = useRef<THREE.Mesh | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<MapDockMode>('stories');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('universo');
  const [exploreQuery, setExploreQuery] = useState('');
  const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const userPosition = useUserPosition();

  useEffect(() => {
    const updateDayNight = () => {
      const now = new Date();
      const lat = userPosition?.lat ?? 0;
      const lng = userPosition?.lng ?? 0;
      setIsNight(isNightAtLocation(lat, lng, now));
    };
    updateDayNight();
    const id = setInterval(updateDayNight, 60_000);
    return () => clearInterval(id);
  }, [userPosition?.lat, userPosition?.lng]);

  useEffect(() => {
    setDockSlot(typeof document !== 'undefined' ? document.getElementById('map-dock-slot') : null);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (cloudMeshRef.current) cloudMeshRef.current.rotation.y += 0.00008;
      const g = globeEl.current as { controls?: () => { enableRotate?: boolean; autoRotate: boolean; autoRotateSpeed: number } } | null;
      const ctrl = g?.controls?.();
      if (ctrl) {
        if ('enableRotate' in ctrl) (ctrl as { enableRotate: boolean }).enableRotate = false;
        ctrl.autoRotate = true;
        ctrl.autoRotateSpeed = 0.45;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Centrar el mapa en la posición del usuario cuando tengamos ambas: globo listo y ubicación
  useEffect(() => {
    if (!userPosition || !globeReady) return;
    const g = globeEl.current as { pointOfView?: (pov: object, t?: number) => void } | null;
    if (!g?.pointOfView) return;
    const pov = { lat: userPosition.lat, lng: userPosition.lng, altitude: 1.35 };
    basePOVRef.current = pov;
    try {
      g.pointOfView(pov, 1200);
    } catch {}
  }, [userPosition, globeReady]);

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

  const storyPulseConfigs = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getPulseConfig>>();
    stories.forEach((s) => {
      if (s.id) map.set(s.id, getPulseConfig(s as Parameters<typeof getPulseConfig>[0]));
    });
    return map;
  }, [stories]);

  const pointsForGlobe = useMemo(
    () =>
      stories.map((p) => ({
        ...p,
        lat: p.lat ?? 0,
        lng: p.lng ?? 0,
        altitude: 0.01,
        radius: storyPulseConfigs.get(p.id ?? '')?.baseRadius ?? 0.22,
      })),
    [stories, storyPulseConfigs]
  );

  const pointColorFn = useCallback(
    (d: object) => {
      const s = d as StoryPoint;
      const cfg = s.id ? storyPulseConfigs.get(s.id) : null;
      return cfg?.color ?? '#ff4500';
    },
    [storyPulseConfigs]
  );

  const pointRadiusFn = useCallback(
    (d: object) => {
      const s = d as StoryPoint;
      const cfg = s.id ? storyPulseConfigs.get(s.id) : null;
      return cfg?.baseRadius ?? 0.24;
    },
    [storyPulseConfigs]
  );

  const ringsData = useMemo(
    () =>
      stories
        .filter((s) => s.lat != null && s.lng != null && s.id)
        .map((s) => {
          const cfg = storyPulseConfigs.get(s.id!);
          return {
            lat: s.lat!,
            lng: s.lng!,
            maxR: cfg?.pulseRadius ?? 0.4,
            propagationSpeed: cfg?.speed ?? 0.6,
            repeatPeriod: cfg ? 1000 / cfg.speed : 1800,
            color: (t: number) => {
              const opacity = (cfg?.ringOpacity ?? 0.3) * (1 - t);
              const base = cfg?.color ?? 'rgba(255,69,0,1)';
              return base.replace(/[\d.]+\)$/, `${opacity})`);
            },
          };
        }),
    [stories, storyPulseConfigs]
  );

  const ringColorFn = useCallback(
    (d: object) => {
      const r = d as { color?: (t: number) => string };
      return typeof r.color === 'function' ? r.color : (t: number) => `rgba(255,255,255,${1 - t})`;
    },
    []
  );

  const handleGlobeReady = useCallback((initialPOV: { lat: number; lng: number; altitude: number }) => {
    basePOVRef.current = { ...initialPOV };
    setGlobeReady(true);
    const g = globeEl.current as {
      controls?: () => { enableZoom: boolean; autoRotate: boolean; autoRotateSpeed: number; enableRotate?: boolean };
      scene?: () => THREE.Scene;
    } | null;
    if (g?.controls) {
      const controls = g.controls();
      controls.enableZoom = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.45;
      if ('enableRotate' in controls) {
        (controls as { enableRotate: boolean }).enableRotate = false;
      }
    }
    setTimeout(() => {
      const scene = g?.scene?.() as THREE.Scene | undefined;
      if (!scene) return;
      try {
        const cloudGeo = new THREE.SphereGeometry(1.004, 64, 64);
        const cloudLoader = new THREE.TextureLoader();
        cloudLoader.load(
          '/textures/earth-clouds.png',
          (cloudTex) => {
            if (cloudTex && cloudMeshRef.current === null) {
              (cloudTex as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
              const cloudMat = new THREE.MeshPhongMaterial({
                map: cloudTex,
                transparent: true,
                opacity: 0.68,
                depthWrite: false,
              });
              const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
              scene.add(cloudMesh);
              cloudMeshRef.current = cloudMesh;
            }
          },
          undefined,
          () => {}
        );
      } catch (err) {
        console.error('HomeMap clouds failed', err);
      }
    }, 200);
  }, []);

  const handleResetView = useCallback(() => {
    const base = basePOVRef.current ?? EMBEDDED_POV;
    const g = globeEl.current as { pointOfView?: (pov: object, t?: number) => void } | null;
    if (g?.pointOfView) {
      try {
        g.pointOfView(base, 1200);
      } catch {}
    }
  }, []);

  const handleStoryFocus = useCallback((story: StoryPoint) => {
    setHighlightedStoryId(story.id ?? null);
    const g = globeEl.current as { pointOfView?: (pov: object, t?: number) => void } | null;
    if (g?.pointOfView && story.lat != null && story.lng != null) {
      try {
        g.pointOfView({ lat: story.lat, lng: story.lng, altitude: 0.8 }, 800);
      } catch {}
    }
  }, []);

  function open(mode: MapDockMode) {
    setDrawerMode(mode);
    setDrawerOpen(true);
  }

  function close() {
    setDrawerOpen(false);
  }

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
    onToggleSound: () => setSoundEnabled((v) => !v),
  };

  const TIME_STRIP_HEIGHT = 64;
  return (
    <div className="relative flex flex-col w-full h-full min-h-0" style={{ height: '100%' }}>
      {/* Globo: contenido en el universo con espacio oscuro arriba/abajo (estilo referencia); no invade la franja fecha/hora */}
      <div
        className="relative overflow-hidden px-2 py-6 md:px-4 md:py-10 shrink-0 flex items-center justify-center"
        style={{ height: `calc(100% - ${TIME_STRIP_HEIGHT}px)`, maxHeight: `calc(100% - ${TIME_STRIP_HEIGHT}px)` }}
      >
        <MapCanvas
          panelWidth={0}
          embedded
          globeRef={globeEl as never}
          onGlobeReady={handleGlobeReady}
          globeImageUrl={isNight ? GLOBE_IMAGE_NIGHT : GLOBE_IMAGE_DAY}
          backgroundColor={GLOBE_CANVAS_BG}
          showAtmosphere
          isNight={isNight}
          atmosphereColor={isNight ? '#1a2d4a' : '#7eb8e8'}
          atmosphereAltitude={0.28}
          pointsData={pointsForGlobe}
          pointLat="lat"
          pointLng="lng"
          pointColor={pointColorFn}
          pointAltitude={() => 0.01}
          pointRadius={pointRadiusFn}
          pointsMerge={false}
          onPointClick={(point: { id?: string }) => router.push(point?.id ? `/mapa?story=${point.id}` : '/mapa')}
          ringsData={ringsData}
          ringColor={ringColorFn}
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
        />
      </div>
      {/* Franja fecha/hora: capa independiente debajo del globo (regla mapa-seccion-lock); z-10 para que nunca quede tapada */}
      <div
        className="flex-shrink-0 w-full flex items-center justify-center bg-[var(--universe-bg)] z-10"
        style={{ height: `${TIME_STRIP_HEIGHT}px` }}
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
            <DockSearchLight onClick={() => open('search')} />
          </div>,
          dockSlot
        )}

      {/* MUTE */}
      <div className="absolute top-0 right-4 md:right-6 z-30 pt-2 md:pt-3">
        <MapTopControls soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled((v) => !v)} />
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
          ) : (
            <SoundsPanel {...sonidosProps} />
          )}
      </MapDrawer>
    </div>
  );
}

// UI LOCK: Dock must never wrap words vertically. Keep whitespace-nowrap + min widths.
// 1000% neumorfismo: relieve muy marcado (raised = sombras grandes; pressed = inset profundo).
function DockButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const base = 'whitespace-nowrap min-w-[108px] px-5 py-2.5 rounded-full text-white/90 font-medium transition-all duration-200';
  const raised =
    '6px 6px 14px rgba(0,0,0,0.5), -4px -4px 12px rgba(255,255,255,0.05), inset 3px 3px 6px rgba(0,0,0,0.15), inset -2px -2px 6px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)';
  const pressed =
    'inset 5px 5px 12px rgba(0,0,0,0.55), inset -3px -3px 8px rgba(255,255,255,0.02), 0 0 0 1px rgba(var(--almamundi-orange-rgb), 0.4)';
  return (
    <button
      type="button"
      onClick={onClick}
      className={base}
      style={{
        background: active ? 'linear-gradient(165deg, #0a0f18 0%, #0d1321 100%)' : 'linear-gradient(165deg, #243044 0%, #0f172a 100%)',
        boxShadow: active ? pressed : raised,
      }}
    >
      {children}
    </button>
  );
}

function DockSearch({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap min-w-[240px] px-5 py-2.5 rounded-full text-white/80 font-medium transition-all duration-200"
      style={{
        background: 'linear-gradient(165deg, #243044 0%, #0f172a 100%)',
        boxShadow: '6px 6px 14px rgba(0,0,0,0.5), -4px -4px 12px rgba(255,255,255,0.05), inset 3px 3px 6px rgba(0,0,0,0.15), inset -2px -2px 6px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      Buscar por palabras clave
    </button>
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
      className="whitespace-nowrap min-w-[240px] px-8 py-4 font-medium text-gray-600 hover:text-orange-600 active:scale-95 transition-colors"
      style={dockButtonStyle}
    >
      Buscar por palabras clave
    </button>
  );
}
