'use client';

import { useState, useRef, useEffect } from 'react';
import { ImageCrossfade } from '@/components/ImageCrossfade';

/**
 * Vídeo NASA fotorrealista: atmósfera, nubes, fondo espacio.
 * - SVS 5570: Spinning Earth with clouds, atmosphere, and night lights (Blue Marble + MODIS).
 * - EPIC: imágenes reales DSCOVR.
 * - Blue Marble 50 Years: EPIC 2022.
 */

/** SVS 5570: Globo girando con nubes, atmósfera y luces nocturnas. Local primero para evitar CORS y que el play arranque. */
const SPINNING_LOCAL = '/Earth_wAtmos_spin_02_1080p60.mp4';
const SPINNING_FALLBACK_REMOTE =
  'https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005570/Earth_wAtmos_spin_02_1080p60.mp4';
/** EPIC Earth Highlights: imágenes reales DSCOVR, 45s. */
const NASA_EPIC_HIGHLIGHTS_MP4 =
  'https://svs.gsfc.nasa.gov/vis/a010000/a012300/a012312/12312_EPIC_EarthHighlights-1920-MASTER_large.mp4';
/** EPIC One Year: timelapse un año. */
const NASA_EPIC_FULL_YEAR_MP4 =
  'https://svs.gsfc.nasa.gov/vis/a010000/a012300/a012312/12312_EPIC_EarthTimelapse-1920-MASTER_large.mp4';
/** Blue Marble 50 años: EPIC 7 dic 2022, imágenes reales. */
const NASA_EPIC_BLUE_MARBLE_50 =
  'https://epic.gsfc.nasa.gov/epic-galleries/2022/blue_marble/epic_blue_marble.mp4';
/** Rotating Blue Marble con nubes MODIS. */
const NASA_CLOUDS_MP4 =
  'https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003640/phytoClouds_30fps.mp4';
/** EPIC One Year – versión limpia sin gráficos/créditos (Broadcast). */
const NASA_EPIC_TIMELAPSE_CLEAN =
  'https://svs.gsfc.nasa.gov/vis/a010000/a012300/a012312/12312_EPIC_EarthTimelapse_ProRes_1920x1080_2997.mp4';

const FALLBACK_IMAGE = '/textures/earth-day.jpg';

export type NASAEpicEarthVideoProps = {
  /**
   * Origen del vídeo. Por defecto: 'spinning'.
   * 'epic-timelapse-clean' = versión sin títulos ni créditos.
   */
  source?: 'spinning' | 'epic-highlights' | 'epic-year' | 'epic-timelapse-clean' | 'epic-blue-marble-50' | 'clouds' | string;
  /** Imagen de fondo mientras carga (una sola). */
  fallbackImage?: string;
  /** Varias imágenes que se funden entre sí mientras carga o si falla el vídeo (sensación de video). */
  fallbackImages?: string[];
  /** Clases extra para el contenedor. */
  className?: string;
};

function getVideoSrc(source: NASAEpicEarthVideoProps['source']): string {
  if (typeof source === 'string' && (source.startsWith('http') || source.startsWith('/')))
    return source;
  switch (source) {
    case 'epic-year':
      return NASA_EPIC_FULL_YEAR_MP4;
    case 'epic-timelapse-clean':
      return NASA_EPIC_TIMELAPSE_CLEAN;
    case 'epic-blue-marble-50':
      return NASA_EPIC_BLUE_MARBLE_50;
    case 'clouds':
      return NASA_CLOUDS_MP4;
    case 'epic-highlights':
      return NASA_EPIC_HIGHLIGHTS_MP4;
    case 'spinning':
    default:
      return SPINNING_LOCAL;
  }
}

const DEFAULT_FALLBACK_IMAGES = ['/textures/earth-day.jpg', '/textures/earth-night.jpg', '/textures/earth-clouds.png'];

export function NASAEpicEarthVideo({
  source = 'spinning',
  fallbackImage = FALLBACK_IMAGE,
  fallbackImages,
  className = '',
}: NASAEpicEarthVideoProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  /** Para 'spinning': intentar local primero; si falla, pasar a URL NASA. */
  const [videoSrc, setVideoSrc] = useState(() => getVideoSrc(source));
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  /** El usuario ya llegó al mapa (scroll o evento); intentar play cuando el vídeo esté listo. */
  const mapInViewRef = useRef(false);
  /** Si el navegador bloqueó autoplay, no seguir llamando play() en intervalos (solo con clic). */
  const autoplayBlockedRef = useRef(false);
  /** El usuario ya hizo clic y el vídeo llegó a reproducirse; si después se pausa (ej. cambiar pestaña), sí reintentar. */
  const userStartedPlayRef = useRef(false);
  /** Seek a la hora local del usuario una sola vez al cargar: globo diurno o nocturno según dónde está. */
  const hasSeekedToTimeRef = useRef(false);

  const seekToUserTimeOfDay = (video: HTMLVideoElement) => {
    if (hasSeekedToTimeRef.current) return;
    const now = new Date();
    const fractionOfDay = (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) / 24;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = fractionOfDay * video.duration;
      hasSeekedToTimeRef.current = true;
    }
  };

  useEffect(() => {
    setVideoSrc(getVideoSrc(source));
  }, [source]);
  const showFallback = error || !loaded;
  const imagesForCrossfade = fallbackImages?.length ? fallbackImages : null;
  const useCrossfade = showFallback && (imagesForCrossfade?.length ?? 0) > 0;
  const useSingleImage = showFallback && !useCrossfade && fallbackImage;

  const play = (fromUserGesture = false) => {
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState < 2) return;
    if (autoplayBlockedRef.current && !fromUserGesture) return;
    video
      .play()
      .then(() => {
        autoplayBlockedRef.current = false;
        if (fromUserGesture) userStartedPlayRef.current = true;
        setPlaying(true);
      })
      .catch(() => {
        autoplayBlockedRef.current = true;
      });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    const onLoadedMetadata = () => {
      seekToUserTimeOfDay(video);
      play();
    };
    const onLoadedData = () => {
      if (!hasSeekedToTimeRef.current) seekToUserTimeOfDay(video);
      setLoaded(true);
      play();
    };
    const onCanPlay = () => {
      if (!hasSeekedToTimeRef.current) seekToUserTimeOfDay(video);
      setLoaded(true);
      play();
      requestAnimationFrame(() => play());
    };
    const onError = () => {
      if (source === 'spinning' && videoSrc === SPINNING_LOCAL) {
        setVideoSrc(SPINNING_FALLBACK_REMOTE);
        setError(false);
        return;
      }
      setError(true);
    };
    const onPause = () => {
      setPlaying(false);
      if (!userStartedPlayRef.current) {
        autoplayBlockedRef.current = true;
      } else if (!video.ended && video.readyState >= 2) {
        play();
      }
    };
    const onPlaying = () => setPlaying(true);
    const onStalled = () => play();
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    video.addEventListener('pause', onPause);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('stalled', onStalled);
    if (video.readyState >= 2) {
      if (!hasSeekedToTimeRef.current) seekToUserTimeOfDay(video);
      setLoaded(true);
      play();
    }
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('stalled', onStalled);
    };
  }, [videoSrc, source]);

  useEffect(() => {
    hasSeekedToTimeRef.current = false;
  }, [videoSrc]);

  useEffect(() => {
    if (!loaded) return;
    const video = videoRef.current;
    if (!video) return;
    const id = setInterval(() => {
      if (autoplayBlockedRef.current) return;
      if (video.paused && video.readyState >= 2) play();
    }, 400);
    return () => clearInterval(id);
  }, [loaded]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          mapInViewRef.current = true;
          play();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cuando el usuario hace scroll y llega al mapa (evento desde HomeMap): marcar y arrancar el vídeo.
  useEffect(() => {
    const onMapInView = () => {
      mapInViewRef.current = true;
      play();
    };
    window.addEventListener('almamundi:mapInView', onMapInView);
    return () => window.removeEventListener('almamundi:mapInView', onMapInView);
  }, []);

  // Si el mapa ya estuvo en vista y el vídeo se hace listo después (carga diferida), arrancar.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mapInViewRef.current) return;
    const onCanPlayLate = () => {
      if (mapInViewRef.current && video.readyState >= 2) play();
    };
    video.addEventListener('canplay', onCanPlayLate);
    if (video.readyState >= 2) play();
    return () => video.removeEventListener('canplay', onCanPlayLate);
  }, [videoSrc]);

  // Intentar play al cargar la fuente; si el navegador bloquea, no insistir en bucle (solo con clic).
  useEffect(() => {
    const t1 = setTimeout(() => play(), 100);
    const t2 = setTimeout(() => play(), 600);
    const id = setInterval(() => {
      if (autoplayBlockedRef.current) return;
      const v = videoRef.current;
      if (v && v.paused && v.readyState >= 2) play();
    }, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(id);
    };
  }, [videoSrc]);

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      onClick={() => play(true)}
      onKeyDown={(e) => e.key === 'Enter' && play(true)}
      className={`relative aspect-square w-full h-full max-w-[min(88vh,100%)] max-h-[88vh] mx-auto cursor-default ${className}`}
      style={{
        backgroundColor: '#0a0a0a',
        clipPath: 'circle(50% at 50% 50%)',
        WebkitClipPath: 'circle(50% at 50% 50%)',
        minWidth: 'min(280px, 50vmin)',
        minHeight: 'min(280px, 50vmin)',
      }}
    >
      <div className="absolute inset-0 z-0 bg-black pointer-events-none" aria-hidden />
      {useCrossfade && (
        <div className="absolute inset-0 z-0 w-full h-full" style={{ opacity: 1, pointerEvents: 'none' }}>
          <ImageCrossfade
            images={imagesForCrossfade ?? DEFAULT_FALLBACK_IMAGES}
            intervalMs={3500}
            fadeDurationMs={1800}
            className="w-full h-full"
          />
        </div>
      )}
      {useSingleImage && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fallbackImage})`, opacity: 1, pointerEvents: 'none' }}
          aria-hidden
        />
      )}
      <video
        key={videoSrc}
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        width={1920}
        height={1080}
        className="absolute inset-0 z-[1] w-full h-full object-cover pointer-events-none"
        style={{ opacity: error ? 0 : 1 }}
        poster={fallbackImage || undefined}
        aria-label="Vídeo de la Tierra (NASA) girando"
      />
      {loaded && !playing && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          aria-hidden
        >
          <span className="text-white/70 text-sm tracking-widest uppercase px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">
            Toca el globo para que gire
          </span>
        </div>
      )}
    </div>
  );
}
