'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { GlobeView } from '@/components/GlobeView';

const GlobeComp = dynamic(() => import('react-globe.gl'), { ssr: false });

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(700);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      setWidth(r?.width ?? 900);
      setHeight(r?.height ?? 700);
    });
    ro.observe(el);
    requestAnimationFrame(() => {
      setWidth(el.clientWidth || 900);
      setHeight(el.clientHeight || 700);
    });
    return () => ro.disconnect();
  }, []);
  return { ref, width, height };
}

/* Globe constants (lighting, textures) — single source for mapa and home */
const GLOBE_EXPOSURE = 2.65;
const GLOBE_BUMP_SCALE = 0.26;
const AMBIENT_INTENSITY = 1.35;
const KEY_INTENSITY = 3.2;
const FILL_INTENSITY = 1.15;
const RIM_INTENSITY = 1.9;
/** Day: much brighter; night: darker. Contrast so the difference is obvious. */
const DAY_EXPOSURE_MULT = 1.85;
const DAY_AMBIENT_MULT = 2.0;
const DAY_KEY_MULT = 1.9;
const DAY_FILL_MULT = 1.7;
const DAY_RIM_MULT = 1.6;
const NIGHT_EXPOSURE_MULT = 0.65;
const NIGHT_AMBIENT_MULT = 0.6;
const NIGHT_KEY_MULT = 0.65;
const NIGHT_FILL_MULT = 0.6;
const NIGHT_RIM_MULT = 0.7;
const GLOBE_CANVAS_BG = 'rgba(0,0,0,0)';
const GLOBE_IMAGE_LOCAL = '/textures/earth-night.jpg';

export type MapCanvasGlobeRef = {
  pointOfView: (pov: { lat: number; lng: number; altitude: number }, t?: number) => void;
  /** Convierte lat/lng a posición 3D en la escena (x, y, z). Útil para fijar puntos al globo. */
  getCoords?: (lat: number, lng: number, altitude?: number) => { x: number; y: number; z: number };
  controls: () => {
    enableZoom: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
    addEventListener: (event: string, fn: () => void) => void;
  };
  renderer: () => unknown;
  scene: () => unknown;
} | null;

const DEFAULT_POV = { lat: -8, lng: -28, altitude: 2.2 } as const;
/** Embedded (home): más distancia; mismo lat/lng, mayor altitude = globo más lejano. */
const EMBEDDED_POV = { ...DEFAULT_POV, altitude: 2.5 };

export type MapCanvasProps = {
  panelWidth: number;
  globeRef: React.RefObject<MapCanvasGlobeRef | null>;
  onGlobeReady: (initialPOV: { lat: number; lng: number; altitude: number }) => void;
  /** When true, do not use GlobeView (no fixed full-screen); globe stays in document flow (e.g. home section). */
  embedded?: boolean;
  /** If not provided, MapCanvas uses internal container size (e.g. full-screen mapa). Required when embedded. */
  width?: number;
  height?: number;
  /** When width/height not provided, use this min size for globe (default 580). */
  minGlobeSize?: number;
  /** Points (stories or mixed); default [] */
  pointsData?: object[];
  pointLat?: string | ((d: object) => number);
  pointLng?: string | ((d: object) => number);
  pointColor?: (d: object) => string;
  pointAltitude?: (d: object) => number;
  pointRadius?: (d: object) => number;
  pointsMerge?: boolean;
  /** 3D objects (e.g. news); default [] */
  objectsData?: object[];
  objectLat?: (d: object) => number;
  objectLng?: (d: object) => number;
  objectAltitude?: (d: object) => number;
  objectThreeObject?: (d: object) => unknown;
  onObjectClick?: (obj: object) => void;
  onObjectHover?: (obj: object | null) => void;
  /** Rings (pulses); default [] */
  ringsData?: object[];
  ringColor?: (d: object) => string | ((t: number) => string);
  ringMaxRadius?: string | number;
  ringPropagationSpeed?: string | number;
  ringRepeatPeriod?: string | number;
  /** Arcs (e.g. music journey); default [] */
  arcsData?: object[];
  arcStartLat?: string | ((d: object) => number);
  arcStartLng?: string | ((d: object) => number);
  arcEndLat?: string | ((d: object) => number);
  arcEndLng?: string | ((d: object) => number);
  arcColor?: (d: object) => string;
  arcAltitude?: number;
  arcDashLength?: number;
  arcDashGap?: number;
  arcDashAnimateTime?: number;
  arcsTransitionDuration?: number;
  globeImageUrl?: string;
  globeMaterial?: unknown;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  backgroundColor?: string;
  onPointClick?: (point: object) => void;
  onPointHover?: (point: object | null) => void;
  /** Optional stage div: className and onMouseMove (e.g. mapa hover position). */
  stageClassName?: string;
  onStageMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** When false, increase lighting and exposure so the globe looks brighter (day). When true or undefined, use base night values. */
  isNight?: boolean;
  /** Reservar px abajo del viewport para HUD (GlobeView fixed no cubre esa franja). Solo cuando no embedded. */
  bottomReservePx?: number;
  /** Reservar px arriba del viewport para barra con logo/frase (GlobeView no cubre esa franja). Solo cuando no embedded. */
  topReservePx?: number;
  children?: ReactNode;
};

function setupRendererAndLights(
  globeRef: React.RefObject<MapCanvasGlobeRef | null>,
  onLightsReady?: () => void
) {
  const g = globeRef.current;
  if (!g) return;
  const renderer = g.renderer?.() as (import('three').WebGLRenderer & { alpha?: boolean }) | undefined;
  if (!renderer) return;
  try {
    if (typeof (renderer as { alpha?: boolean }).alpha !== 'undefined') (renderer as { alpha?: boolean }).alpha = true;
    renderer.setPixelRatio?.(Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));
    if (typeof renderer.toneMapping !== 'undefined') {
      renderer.toneMapping = 4;
      renderer.toneMappingExposure = GLOBE_EXPOSURE;
    }
    try {
      if (typeof renderer.setClearColor === 'function') renderer.setClearColor(0x000000, 0);
      if (typeof renderer.setClearAlpha === 'function') renderer.setClearAlpha(0);
      const canvas = renderer?.domElement as HTMLCanvasElement | undefined;
      if (canvas) canvas.style.background = 'transparent';
    } catch {}

    const scene = g.scene?.() as import('three').Scene | undefined;
    if (scene) {
      import('three').then((THREE) => {
        try {
          if (typeof renderer.toneMappingExposure !== 'undefined') renderer.toneMappingExposure = GLOBE_EXPOSURE;
          if (!scene.getObjectByName('AM_LIGHT')) {
            const ambient = new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY);
            ambient.name = 'AM_LIGHT';
            scene.add(ambient);
          }
          if (!scene.getObjectByName('KEY_LIGHT')) {
            const key = new THREE.DirectionalLight(0xffffff, KEY_INTENSITY);
            key.name = 'KEY_LIGHT';
            key.position.set(2.2, 1.2, 2.4);
            scene.add(key);
          }
          if (!scene.getObjectByName('FILL_LIGHT')) {
            const fill = new THREE.DirectionalLight(0x9bdcff, FILL_INTENSITY);
            fill.name = 'FILL_LIGHT';
            fill.position.set(-2.0, 0.5, -1.6);
            scene.add(fill);
          }
          if (!scene.getObjectByName('RIM_LIGHT')) {
            const rim = new THREE.DirectionalLight(0xffffff, RIM_INTENSITY);
            rim.name = 'RIM_LIGHT';
            rim.position.set(0.0, 2.4, -3.2);
            scene.add(rim);
          }
          const caps = renderer?.capabilities as { maxAnisotropy?: number; getMaxAnisotropy?: () => number } | undefined;
          const maxAnisotropy = caps?.maxAnisotropy ?? (typeof caps?.getMaxAnisotropy === 'function' ? caps.getMaxAnisotropy() : 1);
          scene.traverse((mesh: import('three').Object3D) => {
            if (mesh instanceof THREE.Mesh) {
              const mat = (mesh as import('three').Mesh).material;
              if (mat && 'opacity' in mat) {
                const phongMat = mat as import('three').MeshPhongMaterial;
                if (phongMat?.map) {
                  const tex = phongMat.map;
                  tex.anisotropy = maxAnisotropy;
                  tex.minFilter = THREE.LinearMipmapLinearFilter;
                  tex.magFilter = THREE.LinearFilter;
                  tex.generateMipmaps = true;
                  tex.needsUpdate = true;
                }
              }
            }
          });
          onLightsReady?.();
        } catch (err) {
          console.error('MapCanvas setupRendererAndLights scene failed', err);
        }
      });
    }
  } catch (e) {
    console.error('MapCanvas setupRendererAndLights failed', e);
  }
}

/** Update scene lights and exposure by time of day (day = brighter). */
function updateLightsForDayNight(
  globeRef: React.RefObject<MapCanvasGlobeRef | null>,
  isNight: boolean | undefined
) {
  const g = globeRef.current;
  if (!g) return;
  const scene = g.scene?.() as import('three').Scene | undefined;
  const renderer = g.renderer?.() as { toneMappingExposure?: number } | undefined;
  if (!scene) return;
  const isDay = isNight === false;
  const ambMult = isDay ? DAY_AMBIENT_MULT : NIGHT_AMBIENT_MULT;
  const keyMult = isDay ? DAY_KEY_MULT : NIGHT_KEY_MULT;
  const fillMult = isDay ? DAY_FILL_MULT : NIGHT_FILL_MULT;
  const rimMult = isDay ? DAY_RIM_MULT : NIGHT_RIM_MULT;
  const expMult = isDay ? DAY_EXPOSURE_MULT : NIGHT_EXPOSURE_MULT;

  const am = scene.getObjectByName('AM_LIGHT') as { intensity?: number } | undefined;
  if (am && typeof am.intensity === 'number') am.intensity = AMBIENT_INTENSITY * ambMult;
  const key = scene.getObjectByName('KEY_LIGHT') as { intensity?: number } | undefined;
  if (key && typeof key.intensity === 'number') key.intensity = KEY_INTENSITY * keyMult;
  const fill = scene.getObjectByName('FILL_LIGHT') as { intensity?: number } | undefined;
  if (fill && typeof fill.intensity === 'number') fill.intensity = FILL_INTENSITY * fillMult;
  const rim = scene.getObjectByName('RIM_LIGHT') as { intensity?: number } | undefined;
  if (rim && typeof rim.intensity === 'number') rim.intensity = RIM_INTENSITY * rimMult;

  if (renderer && typeof renderer.toneMappingExposure === 'number') {
    renderer.toneMappingExposure = GLOBE_EXPOSURE * expMult;
  }
}

export function MapCanvas({
  panelWidth,
  globeRef,
  onGlobeReady,
  width: widthProp,
  height: heightProp,
  minGlobeSize = 580,
  pointsData = [],
  pointLat = 'lat',
  pointLng = 'lng',
  pointColor,
  pointAltitude,
  pointRadius,
  pointsMerge = false,
  objectsData = [],
  objectLat,
  objectLng,
  objectAltitude,
  objectThreeObject,
  onObjectClick,
  onObjectHover,
  ringsData = [],
  ringColor,
  ringMaxRadius = 'maxR',
  ringPropagationSpeed = 'propagationSpeed',
  ringRepeatPeriod = 'repeatPeriod',
  arcsData = [],
  arcStartLat,
  arcStartLng,
  arcEndLat,
  arcEndLng,
  arcColor,
  arcAltitude,
  arcDashLength,
  arcDashGap,
  arcDashAnimateTime,
  arcsTransitionDuration,
  globeImageUrl = GLOBE_IMAGE_LOCAL,
  globeMaterial,
  showAtmosphere = true,
  atmosphereColor = '#6fc8ff',
  atmosphereAltitude = 0.28,
  backgroundColor = GLOBE_CANVAS_BG,
  onPointClick,
  onPointHover,
  stageClassName,
  onStageMouseMove,
  isNight,
  children,
  embedded = false,
  bottomReservePx,
  topReservePx,
}: MapCanvasProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sizeHook = useElementSize<HTMLDivElement>();
  const embedWrapRef = useRef<HTMLDivElement>(null);
  const [embedSize, setEmbedSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!embedded) return;
    const el = embedWrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setEmbedSize({ w: Math.max(0, Math.floor(r.width)), h: Math.max(0, Math.floor(r.height)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [embedded]);

  const useInternalSize = widthProp == null || heightProp == null;
  const measured = sizeHook.width > 0 && sizeHook.height > 0;
  const fallback = typeof window !== 'undefined' ? Math.max(minGlobeSize, Math.min(window.innerWidth, window.innerHeight) - 300) : minGlobeSize;
  const width =
    embedded ? embedSize.w : (widthProp ?? (measured ? Math.max(minGlobeSize, Math.min(sizeHook.width, sizeHook.height)) : fallback));
  const height =
    embedded ? embedSize.h : (heightProp ?? (measured ? Math.max(minGlobeSize, Math.min(sizeHook.width, sizeHook.height)) : fallback));
  const pointColorFn = useCallback(
    (d: object) => (pointColor ? pointColor(d) : '#ff4500'),
    [pointColor]
  );
  const pointAltitudeFn = useCallback(
    (p: object) => (pointAltitude ? pointAltitude(p) : 0.01),
    [pointAltitude]
  );
  const pointRadiusFn = useCallback(
    (p: object) => (pointRadius ? pointRadius(p) : 0.24),
    [pointRadius]
  );
  const ringColorFn = useCallback(
    (d: object) =>
      ringColor
        ? typeof ringColor(d) === 'function'
          ? (ringColor(d) as (t: number) => string)
          : () => (ringColor(d) as string)
        : (t: number) => `rgba(255,255,255,${1 - t})`,
    [ringColor]
  );

  const handleGlobeReady = useCallback(
    (injectedOnGlobeReady: () => void) => {
      return () => {
        setupRendererAndLights(globeRef, () => {
          updateLightsForDayNight(globeRef, isNight);
          injectedOnGlobeReady();
        });
      };
    },
    [globeRef, isNight]
  );

  useEffect(() => {
    updateLightsForDayNight(globeRef, isNight);
  }, [isNight, globeRef]);

  const globeBlock = (injectedOnGlobeReady: () => void) => (
    <div
      className="relative z-[2] w-full h-full flex items-center justify-center min-w-0 min-h-0 pointer-events-none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', minWidth: 400, minHeight: 620 }}
    >
      <div
        style={
          embedded
            ? { width: '100%', height: '100%', minWidth: 200, minHeight: 200 }
            : { width: Math.max(400, width), height: Math.max(400, height) }
        }
        className="pointer-events-auto"
      >
        <GlobeComp
          ref={globeRef as never}
          onGlobeReady={handleGlobeReady(injectedOnGlobeReady)}
          globeImageUrl={globeImageUrl}
          {...(globeMaterial != null ? { globeMaterial: globeMaterial as import('three').Material } : {})}
          showAtmosphere={showAtmosphere}
          atmosphereColor={atmosphereColor}
          atmosphereAltitude={atmosphereAltitude}
          backgroundColor={backgroundColor}
          pointsData={pointsData}
          pointLat={pointLat}
          pointLng={pointLng}
          pointColor={pointColorFn}
          pointAltitude={pointAltitudeFn}
          pointRadius={pointRadiusFn}
          pointsMerge={pointsMerge}
          objectsData={objectsData}
          objectLat={objectLat}
          objectLng={objectLng}
          objectAltitude={objectAltitude}
          objectThreeObject={objectThreeObject as never}
          onObjectClick={onObjectClick}
          onObjectHover={onObjectHover}
          onPointClick={onPointClick}
          onPointHover={onPointHover}
          ringsData={ringsData}
          ringColor={ringColorFn}
          ringMaxRadius={ringMaxRadius}
          ringPropagationSpeed={ringPropagationSpeed}
          ringRepeatPeriod={ringRepeatPeriod}
          arcsData={arcsData}
          arcStartLat={arcStartLat}
          arcStartLng={arcStartLng}
          arcEndLat={arcEndLat}
          arcEndLng={arcEndLng}
          arcColor={arcColor}
          arcAltitude={arcAltitude}
          arcDashLength={arcDashLength}
          arcDashGap={arcDashGap}
          arcDashAnimateTime={arcDashAnimateTime}
          arcsTransitionDuration={arcsTransitionDuration}
          height={height}
          width={width}
        />
      </div>
    </div>
  );

  if (!mounted)
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 600,
          background: '#0F172A',
          borderRadius: '50%',
        }}
        aria-hidden
      />
    );

  if (embedded) {
    const onReady = () => onGlobeReady(EMBEDDED_POV);
    return (
      <div ref={embedWrapRef} className="absolute inset-0 w-full h-full min-h-0 overflow-hidden" style={{ maxHeight: '100%' }}>
        {embedSize.w > 0 && embedSize.h > 0 && globeBlock(onReady)}
        {children}
      </div>
    );
  }

  return (
    <GlobeView panelWidth={panelWidth} onGlobeReady={onGlobeReady} bottomReservePx={bottomReservePx} topReservePx={topReservePx}>
      {({ onGlobeReady: injectedOnGlobeReady }) => {
        const block = globeBlock(injectedOnGlobeReady);
        return useInternalSize ? (
          <div
            ref={sizeHook.ref}
            className={stageClassName}
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              isolation: 'isolate',
              touchAction: 'none',
            }}
            onMouseMove={onStageMouseMove}
          >
            {block}
            {children}
          </div>
        ) : (
          <>
            {block}
            {children}
          </>
        );
      }}
    </GlobeView>
  );
}
