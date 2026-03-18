'use client';

import { useState, useRef, useEffect } from 'react';
import { ImageCrossfade } from '@/components/ImageCrossfade';

/**
 * Vídeo NASA fotorrealista: atmósfera, nubes, fondo espacio.
 * - SVS 5570: Spinning Earth with clouds, atmosphere, and night lights (Blue Marble + MODIS).
 * - EPIC: imágenes reales DSCOVR.
 * - Blue Marble 50 Years: EPIC 2022.
 */

/** SVS 5570: Globo girando con nubes, atmósfera y luces nocturnas (Blue Marble, MODIS). 1080p. */
const NASA_SPINNING_EARTH_1080 =
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
      return NASA_SPINNING_EARTH_1080;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = getVideoSrc(source);
  const showFallback = error || !loaded;
  const imagesForCrossfade = fallbackImages?.length ? fallbackImages : null;
  const useCrossfade = showFallback && (imagesForCrossfade?.length ?? 0) > 0;
  const useSingleImage = showFallback && !useCrossfade && fallbackImage;

  const seekToTimeOfDay = (video: HTMLVideoElement) => {
    const now = new Date();
    const fractionOfDay = (now.getHours() + now.getMinutes() / 60) / 24;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = fractionOfDay * video.duration;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    const play = () => video.play().catch(() => {});
    const onLoadedMetadata = () => seekToTimeOfDay(video);
    const onLoadedData = () => {
      seekToTimeOfDay(video);
      play();
    };
    const onCanPlay = () => {
      setLoaded(true);
      seekToTimeOfDay(video);
      play();
      requestAnimationFrame(() => play());
    };
    const onError = () => setError(true);
    const onPause = () => {
      if (!video.ended && video.readyState >= 2) play();
    };
    const onStalled = () => play();
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    video.addEventListener('pause', onPause);
    video.addEventListener('stalled', onStalled);
    if (video.readyState >= 1) seekToTimeOfDay(video);
    if (video.readyState >= 2) {
      setLoaded(true);
      seekToTimeOfDay(video);
      play();
    }
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('stalled', onStalled);
    };
  }, [src]);

  useEffect(() => {
    if (!loaded) return;
    const video = videoRef.current;
    if (!video) return;
    const id = setInterval(() => {
      if (video.paused && video.readyState >= 2) video.play().catch(() => {});
    }, 400);
    return () => clearInterval(id);
  }, [loaded]);

  return (
    <div
      className={`relative aspect-square w-full h-full max-w-[min(88vh,100%)] max-h-[88vh] mx-auto ${className}`}
      style={{
        backgroundColor: '#000',
        clipPath: 'circle(50% at 50% 50%)',
        WebkitClipPath: 'circle(50% at 50% 50%)',
      }}
    >
      <div className="absolute inset-0 bg-black" aria-hidden />
      {useCrossfade && (
        <div className="absolute inset-0 w-full h-full" style={{ opacity: 1, pointerEvents: 'none' }}>
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
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fallbackImage})`, opacity: 1, pointerEvents: 'none' }}
          aria-hidden
        />
      )}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: showFallback ? 0 : 1 }}
        poster={fallbackImage || undefined}
        aria-label="Vídeo de la Tierra (NASA)"
      />
    </div>
  );
}
