'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { GlobeView } from '@/components/GlobeView';
import { GLOBE_PACIFIC_POV } from '@/lib/map-data/globe-pov';
import { MAP_STAGE_SOLID } from '@/lib/map-data/stage-theme';
import { ensureGlobeGlMoon, updateGlobeGlMoon } from '@/lib/map-gl-moon';

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
const GLOBE_EXPOSURE = 2.82;
const GLOBE_BUMP_SCALE = 0.26;
const AMBIENT_INTENSITY = 1.35;
const KEY_INTENSITY = 3.2;
const FILL_INTENSITY = 1.15;
/** Luz de relleno más cobalto; mismo factor al crear y al actualizar día/noche. */
const FILL_INTENSITY_BLUE = FILL_INTENSITY * 1.08;
const RIM_INTENSITY = 1.9;
/** Day: much brighter; night: darker. Contrast so the difference is obvious. */
const DAY_EXPOSURE_MULT = 1.96;
const DAY_AMBIENT_MULT = 2.0;
const DAY_KEY_MULT = 1.9;
const DAY_FILL_MULT = 1.7;
const DAY_RIM_MULT = 1.6;
const NIGHT_EXPOSURE_MULT = 0.82;
const NIGHT_AMBIENT_MULT = 0.78;
const NIGHT_KEY_MULT = 0.78;
const NIGHT_FILL_MULT = 0.88;
const NIGHT_RIM_MULT = 0.82;
const GLOBE_CANVAS_BG = 'rgba(0,0,0,0)';
const GLOBE_IMAGE_LOCAL = '/textures/earth-day.jpg';

/** Hora local 0–23 en una zona IANA (p. ej. America/Santiago). */
function getHourInTimeZone(date: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone,
    }).formatToParts(date);
    const h = parts.find((p) => p.type === 'hour')?.value;
    if (h != null) return parseInt(h, 10);
  } catch {
    /* invalid TZ */
  }
  return date.getHours();
}

function isNightWindowWallClock20to6(date: Date, timeZone: string): boolean {
  const h = getHourInTimeZone(date, timeZone);
  return h >= 20 || h <= 6;
}

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

/** Embedded (home): ligeramente más lejos; vista full usa GlobeView + globe-pov. */
const EMBEDDED_POV = { ...GLOBE_PACIFIC_POV, altitude: 2.48 } as const;

/** Vector sol en UTC (eje Y = norte), misma convención que `@/lib/sunPosition`. */
export type SunDirectionUtc = { x: number; y: number; z: number };

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
  /** Alinea la luz principal del escenario con el sol real (terminador). */
  sunDirectionUtc?: SunDirectionUtc | null;
  /** Grados para el velo CSS que refuerza el terminador (~crepúsculo + penumbra). */
  terminatorGradientDeg?: number | null;
  /** Capa multiply sobre el globo (aprox. esfera); default true. */
  showTerminatorVeil?: boolean;
  /**
   * Textura nocturna (luces): capa HTML con mix-blend-mode screen sobre el globo.
   * Se enciende de noche para el usuario (`isNight`) o en ventana 20:00–06:00 (zona del navegador o `cityLightsTimeZone`).
   * Con textura Phong nocturna se usa intensidad reducida (`city-lights--phong-night`) para no quemar el mapa.
   */
  cityLightsNightImageUrl?: string | null;
  /**
   * Zona IANA para la ventana 20:00–06:00. Si se omite, se usa la zona horaria del navegador.
   * Ej.: `America/Santiago` para sincronizar con Chile.
   */
  cityLightsTimeZone?: string;
  /** Reservar px abajo del viewport para HUD (GlobeView fixed no cubre esa franja). Solo cuando no embedded. */
  bottomReservePx?: number;
  /** Reservar px arriba del viewport para barra con logo/frase (GlobeView no cubre esa franja). Solo cuando no embedded. */
  topReservePx?: number;
  /** Luna en órbita en la escena three.js de react-globe.gl (misma textura que GlobeV2). */
  showOrbitalMoon?: boolean;
  children?: ReactNode;
};

function setupRendererAndLights(
  globeRef: React.RefObject<MapCanvasGlobeRef | null>,
  onLightsReady?: () => void,
  showOrbitalMoon = true
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
            const fill = new THREE.DirectionalLight(0x6ec8ff, FILL_INTENSITY_BLUE);
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
          if (showOrbitalMoon) {
            try {
              ensureGlobeGlMoon(scene);
            } catch (moonErr) {
              console.error('MapCanvas ensureGlobeGlMoon failed', moonErr);
            }
          }
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
  if (fill && typeof fill.intensity === 'number') fill.intensity = FILL_INTENSITY_BLUE * fillMult;
  const rim = scene.getObjectByName('RIM_LIGHT') as { intensity?: number } | undefined;
  if (rim && typeof rim.intensity === 'number') rim.intensity = RIM_INTENSITY * rimMult;

  if (renderer && typeof renderer.toneMappingExposure === 'number') {
    renderer.toneMappingExposure = GLOBE_EXPOSURE * expMult;
  }
}

function updateKeyLightFromSun(
  globeRef: React.RefObject<MapCanvasGlobeRef | null>,
  sun: SunDirectionUtc | null | undefined
) {
  const g = globeRef.current;
  if (!g || !sun) return;
  const scene = g.scene?.() as import('three').Scene | undefined;
  if (!scene) return;
  const key = scene.getObjectByName('KEY_LIGHT') as import('three').DirectionalLight | undefined;
  if (!key) return;
  const k = 24;
  key.position.set(sun.x * k, sun.y * k, sun.z * k);
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
  atmosphereColor = '#c8d0dc',
  atmosphereAltitude = 0.28,
  backgroundColor = GLOBE_CANVAS_BG,
  onPointClick,
  onPointHover,
  stageClassName,
  onStageMouseMove,
  isNight,
  sunDirectionUtc = null,
  terminatorGradientDeg = null,
  showTerminatorVeil = true,
  cityLightsNightImageUrl = null,
  cityLightsTimeZone,
  children,
  embedded = false,
  bottomReservePx,
  topReservePx,
  showOrbitalMoon = true,
}: MapCanvasProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !showOrbitalMoon) return;
    let raf = 0;
    let last = performance.now();
    const tick = () => {
      const g = globeRef.current;
      const scene = g?.scene?.() as import('three').Scene | undefined;
      if (scene) {
        const now = performance.now();
        updateGlobeGlMoon(scene, (now - last) / 1000);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted, showOrbitalMoon, globeRef]);

  const [cityLightsNightWindow, setCityLightsNightWindow] = useState(false);
  useEffect(() => {
    if (!cityLightsNightImageUrl) return;
    const tz =
      cityLightsTimeZone?.trim() ||
      (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC');
    const tick = () => setCityLightsNightWindow(isNightWindowWallClock20to6(new Date(), tz));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [cityLightsNightImageUrl, cityLightsTimeZone]);

  const cityLightsOn =
    !!cityLightsNightImageUrl && (cityLightsNightWindow || isNight === true);

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
        setupRendererAndLights(
          globeRef,
          () => {
            updateLightsForDayNight(globeRef, isNight);
            updateKeyLightFromSun(globeRef, sunDirectionUtc ?? null);
            injectedOnGlobeReady();
          },
          showOrbitalMoon
        );
      };
    },
    [globeRef, isNight, sunDirectionUtc, showOrbitalMoon]
  );

  useEffect(() => {
    updateLightsForDayNight(globeRef, isNight);
  }, [isNight, globeRef]);

  useEffect(() => {
    updateKeyLightFromSun(globeRef, sunDirectionUtc ?? null);
  }, [sunDirectionUtc, globeRef]);

  const globeBlock = (injectedOnGlobeReady: () => void) => (
    <div
      className="relative z-[2] w-full h-full flex items-center justify-center min-w-0 min-h-0 pointer-events-none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', minWidth: 400, minHeight: 620 }}
    >
      <div
        className="pointer-events-auto globe-halo-wrap"
        style={
          embedded
            ? {
                width: '100%',
                height: '100%',
                minWidth: 200,
                minHeight: 200,
                filter:
                  'drop-shadow(0 0 1px rgba(255,255,255,0.92)) drop-shadow(0 0 12px rgba(255,255,255,0.38)) drop-shadow(0 0 32px rgba(190,220,255,0.28))',
              }
            : {
                width: Math.max(400, width),
                height: Math.max(400, height),
                filter:
                  'drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 18px rgba(255,255,255,0.28)) drop-shadow(0 0 36px rgba(180,210,255,0.22))',
              }
        }
      >
        <div className="relative h-full w-full">
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
          {cityLightsNightImageUrl ? (
            <div
              className={`city-lights absolute inset-0 z-[3] rounded-full bg-cover bg-center${cityLightsOn ? ' city-lights--on' : ''}${cityLightsOn && isNight === true ? ' city-lights--phong-night' : ''}`}
              style={{ backgroundImage: `url(${cityLightsNightImageUrl})` }}
              aria-hidden
            />
          ) : null}
          {showTerminatorVeil && terminatorGradientDeg != null ? (
            <div
              className="pointer-events-none absolute inset-0 z-[4] rounded-full"
              style={{
                mixBlendMode: 'multiply',
                background: `linear-gradient(${terminatorGradientDeg}deg,
                  transparent 0%,
                  rgba(255, 130, 70, 0.12) 38%,
                  rgba(95, 55, 135, 0.2) 45%,
                  rgba(5, 5, 16, 0.7) 50%,
                  rgba(95, 55, 135, 0.2) 55%,
                  rgba(255, 130, 70, 0.12) 62%,
                  transparent 100%)`,
              }}
              aria-hidden
            />
          ) : null}
        </div>
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
          background: MAP_STAGE_SOLID,
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
