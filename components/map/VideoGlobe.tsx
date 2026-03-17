'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';

/**
 * Globo NASA: día o noche según hora local (6–20 = día, 20–6 = noche).
 * Día: vídeo NASA Blue Marble (Tierra girando). Noche: textura Black Marble (ciudades).
 * Vídeo: colocar en public/ un MP4 de una rotación completa (p. ej. NASA SVS Blue Marble).
 *
 * REGLAS FIJAS (no cambiar):
 * - El globo debe ser más grande que el círculo (GLOBE_SCALE) para que no se vea anillo negro.
 * - Giro de izquierda a derecha (sentido Este).
 * - Norte arriba (VIDEO_TRANSFORM = 'none', sin rotate(180deg)).
 */
/** Vídeo del viernes (commit 457f7c07): NASA SVS 5570 "Spinning Earth" — nubes, atmósfera, luces nocturnas, 1920×1080 60fps. */
const GLOBE_VIDEO_PRIMARY = '/earth-1080p60.mp4';
const GLOBE_VIDEO_FALLBACK = '/earth-globe-nasa.mp4';
const GLOBE_VIDEO_FALLBACK_60 = '/earth-blue-marble-720p-60fps.mp4';
const GLOBE_VIDEO_FALLBACK_LOCAL = '/rotate_hd_1280_lossless.mp4';

/** URL absoluta del mismo origen para que el vídeo cargue bien en 127.0.0.1:puerto o localhost. */
function fullVideoSrc(path: string): string {
  if (typeof window === 'undefined') return path;
  const base = window.location.origin;
  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
const GLOBE_NIGHT_IMAGE_SRC = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg';
/** NASA SVS 5570: rotación ya viene en el vídeo. Fallback (vídeo pausado): una vuelta cada ~30 s, de izquierda a derecha (Este). */
const EARTH_FALLBACK_ROTATION_PERIOD_S = 30;
const EARTH_ANGULAR_VELOCITY_RAD_S = (2 * Math.PI) / EARTH_FALLBACK_ROTATION_PERIOD_S;
const AXIAL_INCLINATION_DEG = 23.5;

/** Hora local 6–20 = día; 20–6 = noche */
function getIsDay(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20;
}

const CROSSFADE_MS = 1500;

/** Radio del globo en unidades (para proyección 3D → 2D). */
const GLOBE_R = 1;

export type VideoGlobePoint = {
  lat: number;
  lng: number;
  color?: string;
  id?: string | number;
  titulo?: string;
  lugar?: string;
  pais?: string;
};

/** Bit anclado a coordenadas: mismo formato que points, con label/icon opcionales */
export type BitMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  icon?: string;
};

type VideoGlobeProps = {
  /** Puntos/bits en el globo (lat/lng anclados, giran con el mapa) */
  points?: VideoGlobePoint[];
  /** Alternativa: array de bits con id, lat, lng, label, icon. Si se pasa, se usa en lugar de points */
  bits?: BitMarker[];
  onPointClick?: (point: VideoGlobePoint) => void;
  /** Cuando se selecciona un Bit en el panel, resaltar este punto en el globo */
  highlightedPointId?: number | string;
};

// Textura equirectangular: suele empezar en 180° (Pacífico). π alinea meridiano 0° al frente.
// Rotación solo eje Y (Oeste→Este). Puntos fijos en su lat/lng; overlay se actualiza cada frame.
const ROTATION_Y_INITIAL = Math.PI;
const DRAG_Y_FACTOR = 0.005;
const MOMENTUM_DAMPING = 0.95;
const VELOCITY_THRESHOLD = 0.0001;

/** Coordenadas 3D en la esfera (R=1) para visibilidad: x,y,z. */
function bitPositionOnSphere(lat: number, lon: number) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const R = GLOBE_R;
  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);
  const x = R * cosLat * Math.sin(lonRad);
  const y = R * sinLat;
  const z = R * cosLat * Math.cos(lonRad);
  return { x, y, z };
}

/** Sin rotación: textura equirectangular estándar tiene Norte arriba. Overlay con el mismo transform que vídeo/img. */
const VIDEO_TRANSFORM = 'none';
/** Globo más grande que el círculo para que no se vea anillo negro. Regla: no cambiar. */
const GLOBE_SCALE = 1.3;

/** Posición en coordenadas de textura equirectangular (0–100%). Norte arriba: u=lon, v=lat (top=norte). */
function latLonToTexturePercent(lat: number, lng: number) {
  const u = (lng + 180) / 360;
  const v = (90 - lat) / 180;
  return { left: `${u * 100}%`, top: `${v * 100}%` };
}

/** Centrar el bit en su ancla. */
const BIT_CENTER = 'translate(-50%, -50%)';

/** Posición en vista tras aplicar rotateY(ry) al punto de la esfera. */
function applyRotationY(x: number, y: number, z: number, ry: number) {
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const xView = x * cy + z * sy;
  const yView = y;
  const zView = -x * sy + z * cy;
  return { xView, yView, zView };
}

/** z en vista tras rotateX(inclinación) y rotateY(ry): para visibilidad de bits con eje inclinado. */
function zViewWithTilt(x: number, y: number, z: number, ry: number, inclinationDeg: number) {
  const { yView, zView } = applyRotationY(x, y, z, ry);
  const incRad = (inclinationDeg * Math.PI) / 180;
  return yView * Math.sin(incRad) + zView * Math.cos(incRad);
}

/** Pulso sutil para bits pequeños: escala 0.92–1.08, elegante */
function getPulseStyle(index: number) {
  const duration = 2.2 + (index % 12) * 0.15;
  const delay = (index * 0.2) % 1.5;
  return {
    animation: `bitPulse ${duration}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
  };
}

/** Puntos de luz: 4 capas como antes (core → inner bloom → mid glow → outer atmosphere), tamaño menor */
const BIT_BACKGROUND = [
  'radial-gradient(circle, #FFFAED 0%, transparent 2px)',
  'radial-gradient(circle, rgba(255,200,74,0.7) 0%, transparent 6px)',
  'radial-gradient(circle, rgba(255,154,0,0.25) 0%, transparent 14px)',
  'radial-gradient(circle, rgba(255,102,0,0.06) 0%, transparent 28px)',
].join(', ');

const DOT_SIZE_PX = 40;
const HALF = DOT_SIZE_PX / 2;

const DAY_ATMOSPHERE = [
  '0 0 30px rgba(100, 180, 255, 0.4)',
  '0 0 70px rgba(80, 150, 255, 0.25)',
  '0 0 120px rgba(60, 120, 255, 0.15)',
].join(', ');

const NIGHT_BG = '#03050F';

export function VideoGlobe({ points = [], bits, onPointClick, highlightedPointId }: VideoGlobeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const globeRotationRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const rotationYRef = useRef(ROTATION_Y_INITIAL);
  const userOffsetYRef = useRef(0);
  const velocityYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  const isDay = useMemo(() => getIsDay(), []);
  const [revealOpacity, setRevealOpacity] = useState(1);
  const [videoSrc, setVideoSrc] = useState(GLOBE_VIDEO_PRIMARY);
  /** true = ocultar vídeo y mostrar solo imagen (vídeo falló o no cargó). */
  const [showFallbackImage, setShowFallbackImage] = useState(false);
  /** true = vídeo listo y reproduciendo; hasta entonces mostramos la imagen para no ver círculo negro. */
  const [videoReady, setVideoReady] = useState(false);
  /** Ruta estática por defecto para que el mapa mundi se vea de inmediato (sin depender de la API). */
  const [globeImgSrc, setGlobeImgSrc] = useState('/textures/earth-day.jpg');

  type NormalizedBit = { id: string | number; lat: number; lng: number; titulo?: string; lugar?: string };
  const validPoints = useMemo((): NormalizedBit[] => {
    if (bits?.length) {
      return bits
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, titulo: p.label }));
    }
    return points
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({ id: p.id ?? '', lat: p.lat, lng: p.lng, titulo: p.titulo ?? p.lugar, lugar: p.lugar }));
  }, [bits, points]);

  const pulseStyles = useMemo(
    () => validPoints.map((_, i) => getPulseStyle(i)),
    [validPoints]
  );

  // Posición en coordenadas de textura (u,v). La capa tiene el mismo transform que el vídeo → quedan pegados al mapa.
  const dotPositions = useMemo(
    () => validPoints.map((p) => latLonToTexturePercent(p.lat, p.lng)),
    [validPoints]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = () => {
      video.playbackRate = 1;
      video.play().then(() => setVideoReady(true)).catch(() => {});
    };
    const onCanPlay = () => {
      play();
      setVideoReady(true);
    };
    const onLoadedData = () => play();
    const onError = () => {
      const current = video.src || videoSrc;
      if (current.includes('earth-1080p60')) {
        setVideoSrc(GLOBE_VIDEO_FALLBACK);
      } else if (current.includes('earth-globe-nasa')) {
        setVideoSrc(GLOBE_VIDEO_FALLBACK_60);
      } else if (current.includes('earth-blue-marble')) {
        setVideoSrc(GLOBE_VIDEO_FALLBACK_LOCAL);
      } else {
        setShowFallbackImage(true);
      }
    };
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('error', onError);
    if (video.readyState >= 2) play();
    else video.load();
    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('error', onError);
    };
  }, [videoSrc]);

  useEffect(() => {
    if (showFallbackImage) return;
    const t = setTimeout(() => {
      const video = videoRef.current;
      if (video && video.readyState < 2) setShowFallbackImage(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [showFallbackImage]);

  // Reproducir vídeo cuando el globo entra en vista (por si el navegador bloquea autoplay)
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && video.readyState >= 2) {
          video.play().catch(() => {});
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const timeOriginRef = useRef<number>(0);

  const updateGlobeAndDots = useCallback(() => {
    const globeEl = globeRotationRef.current;
    const overlay = overlayRef.current;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (timeOriginRef.current === 0) timeOriginRef.current = now;
    const elapsedS = (now - timeOriginRef.current) / 1000;

    /* Siempre girar de izquierda a derecha (sentido Este). Regla fija. */
    const baseRy = ROTATION_Y_INITIAL + elapsedS * EARTH_ANGULAR_VELOCITY_RAD_S;
    const ry = baseRy + userOffsetYRef.current;
    rotationYRef.current = ry;

    if (globeEl) {
      const deg = (ry * 180) / Math.PI;
      globeEl.style.transform = `rotateX(${AXIAL_INCLINATION_DEG}deg) rotateY(${deg}deg) scale(${GLOBE_SCALE})`;
    }

    if (overlay && validPoints.length > 0) {
      const dots = overlay.querySelectorAll<HTMLElement>('[data-bit-index]');
      dots.forEach((el) => {
        const idx = parseInt(el.getAttribute('data-bit-index') ?? '0', 10);
        const point = validPoints[idx];
        if (!point) return;
        const { x, y, z } = bitPositionOnSphere(point.lat, point.lng);
        const zV = zViewWithTilt(x, y, z, ry, AXIAL_INCLINATION_DEG);
        const visible = zV > 0.1;
        el.style.opacity = visible ? '1' : '0';
        el.style.pointerEvents = visible ? 'auto' : 'none';
      });
    }
  }, [validPoints]);

  const loopRef = useRef<() => void>(() => {});
  const animationLoop = useCallback(() => {
    const globeEl = globeRotationRef.current;
    if (!globeEl) return;

    if (!isDraggingRef.current) {
      const v = velocityYRef.current;
      if (Math.abs(v) > VELOCITY_THRESHOLD) {
        userOffsetYRef.current += v;
        velocityYRef.current = v * MOMENTUM_DAMPING;
      } else {
        velocityYRef.current = 0;
      }
    }
    updateGlobeAndDots();
    rafRef.current = requestAnimationFrame(() => loopRef.current());
  }, [updateGlobeAndDots]);

  useEffect(() => {
    loopRef.current = animationLoop;
    rafRef.current = requestAnimationFrame(animationLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animationLoop]);

  useEffect(() => {
    const globeEl = globeRotationRef.current;
    if (!globeEl) return;

    const container = globeEl.parentElement;
    if (!container) return;

    const getPointer = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
      if ('touches' in e) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      velocityYRef.current = 0;
      lastPointerRef.current = getPointer(e);
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || lastPointerRef.current === null) return;
      const p = getPointer(e);
      const dx = p.x - lastPointerRef.current.x;
      lastPointerRef.current = p;
      // Arrastrar a la derecha = globo sigue a la derecha (como agarrar el globo).
      userOffsetYRef.current += dx * DRAG_Y_FACTOR;
      velocityYRef.current = dx * DRAG_Y_FACTOR;
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      lastPointerRef.current = null;
    };

    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    return () => {
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, []);

  /* Solo vídeo del globo; sin fondo negro en el contenedor. */
  const dayOpacity = 1;
  const nightOpacity = 0;
  const atmosphereShadow = isDay ? DAY_ATMOSPHERE : 'none';

  return (
    <>
      <style>{`
        @keyframes bitPulse {
          0%, 100% { transform: scale(0.92); }
          50% { transform: scale(1.08); }
        }
        .globe-layer-reveal { transition: opacity ${CROSSFADE_MS}ms ease-out; }
        .globe-bit-dot { pointer-events: none; }
      `}</style>
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center min-h-[50vmin] relative"
        data-globe="video"
        data-globe-version="fixed-dots-sync-video"
        data-day={isDay ? 'true' : 'false'}
        style={{ backgroundColor: 'transparent', minHeight: 'min(400px, 60vh)', width: '100%', height: '100%' }}
      >
        {/* Globo esférico: cuadrado estricto (misma variable en width y height) para que no se aplane. */}
        <div
          className="relative overflow-hidden rounded-full flex shrink-0 items-center justify-center cursor-grab active:cursor-grabbing"
          style={{
            ['--globe-size' as string]: 'min(80vmin, 85vh)',
            width: 'var(--globe-size)',
            height: 'var(--globe-size)',
            maxWidth: 'min(85vw, 85vh)',
            maxHeight: 'min(85vw, 85vh)',
            backgroundColor: 'var(--home-bg, #E0E5EC)',
            border: 'none',
            outline: 'none',
            boxShadow: atmosphereShadow,
            perspective: 2400,
            perspectiveOrigin: '50% 50%',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ backgroundColor: 'transparent', border: 'none' }}
            aria-hidden
          />
          {/* Eje N-S inclinado 23.5°; giro Oeste→Este (rotateY). Fondo con textura para que no se vea negro si la <img> no carga. */}
          {/* backfaceVisibility: visible para que la cara con la Tierra se vea (rotación 23.5° + 180°); hidden dejaba el círculo negro. */}
          <div
            ref={globeRotationRef}
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              transform: `rotateX(${AXIAL_INCLINATION_DEG}deg) rotateY(${(ROTATION_Y_INITIAL * 180) / Math.PI}deg) scale(${GLOBE_SCALE})`,
              transformOrigin: '50% 50%',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'visible',
              /* Globo más grande que el círculo (GLOBE_SCALE); norte arriba, giro izquierda→derecha. Reglas fijas. */
              backgroundColor: 'transparent',
              backgroundImage: 'url(/textures/earth-day.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden
          >
            {/* Capa base: imagen de la Tierra (mapa mundi día); fallback por si la ruta falla. */}
            <img
              src={globeImgSrc}
              alt=""
              onError={() => setGlobeImgSrc('/textures/earth-day.jpg')}
              className="absolute inset-0 w-full h-full object-cover outline-none border-0"
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                transform: 'none',
                transformOrigin: '50% 50%',
                zIndex: 0,
              }}
            />
            {/* Vídeo encima solo cuando está listo; opacity 0 + visibility hidden evitan frame negro hasta que cargue. */}
            <video
              ref={videoRef}
              src={fullVideoSrc(videoSrc)}
              poster={globeImgSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover outline-none border-0 globe-layer-reveal"
              style={{
                opacity: showFallbackImage || !videoReady ? 0 : dayOpacity,
                visibility: showFallbackImage || !videoReady ? 'hidden' : 'visible',
                width: '100%',
                height: '100%',
                display: 'block',
                transform: 'none',
                transformOrigin: '50% 50%',
                zIndex: 1,
              }}
              aria-hidden
            />
            <div
              className="absolute inset-0 globe-layer-reveal pointer-events-none"
              style={{ opacity: nightOpacity }}
              aria-hidden
            >
              <img
                src={GLOBE_NIGHT_IMAGE_SRC}
                alt=""
                className="absolute inset-0 w-full h-full object-cover outline-none border-0"
                style={{ transform: 'none', transformOrigin: '50% 50%' }}
              />
            </div>
            {/* Bits: misma capa que el vídeo con el mismo transform → pegados al mapa. */}
            <div
              ref={overlayRef}
              className="absolute inset-0 overflow-hidden rounded-full pointer-events-auto"
              style={{
                zIndex: 10,
                opacity: revealOpacity,
                pointerEvents: 'none',
                transform: VIDEO_TRANSFORM,
                transformOrigin: '50% 50%',
              }}
              aria-hidden
            >
              {validPoints.map((point, index) => {
                const pos = dotPositions[index];
                const isHighlighted = highlightedPointId != null && String(point.id ?? '') === String(highlightedPointId);
                return (
                  <button
                    key={point.id ?? index}
                    type="button"
                    data-bit-index={String(index)}
                    className="absolute rounded-full border-0 outline-none cursor-pointer p-0 globe-bit-dot"
                    style={{
                      left: pos?.left ?? '50%',
                      top: pos?.top ?? '50%',
                      width: DOT_SIZE_PX,
                      height: DOT_SIZE_PX,
                      transform: BIT_CENTER,
                      transformOrigin: '50% 50%',
                      transition: 'none',
                      pointerEvents: 'auto',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPointClick?.(point);
                    }}
                    aria-label={point.titulo ?? point.lugar ? `Bit: ${point.titulo ?? point.lugar}` : 'Bit'}
                  >
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: BIT_BACKGROUND,
                        boxShadow: isHighlighted
                          ? '0 0 0 2px rgba(255,200,74,0.9), 0 0 24px rgba(255,200,74,0.5), 0 0 40px rgba(255,154,0,0.25)'
                          : undefined,
                        filter: isHighlighted ? 'brightness(1.35)' : undefined,
                        ...pulseStyles[index],
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
