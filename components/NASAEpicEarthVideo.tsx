'use client';

import { useState, useRef, useEffect } from 'react';

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
  /** Imagen de fondo mientras carga. */
  fallbackImage?: string;
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

export function NASAEpicEarthVideo({
  source = 'spinning',
  fallbackImage = FALLBACK_IMAGE,
  className = '',
}: NASAEpicEarthVideoProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = getVideoSrc(source);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onCanPlay = () => setLoaded(true);
    const onError = () => setError(true);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    if (video.readyState >= 2) setLoaded(true);
    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
    };
  }, [src]);

  return (
    <div
      className={`relative w-full overflow-hidden aspect-video max-h-[70vh] ${className}`}
      style={{ backgroundColor: '#000', clipPath: 'circle(50% at 50% 50%)' }}
    >
      {/* Fondo negro; overflow-hidden recorta zoom y cualquier texto en bordes */}
      <div className="absolute inset-0 bg-black" aria-hidden />
      {/* Fallback: imagen hasta que el vídeo cargue o si falla (omitir si fallbackImage vacío) */}
      {fallbackImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{
            backgroundImage: `url(${fallbackImage})`,
            opacity: error || !loaded ? 1 : 0,
            pointerEvents: error || !loaded ? 'auto' : 'none',
          }}
          aria-hidden
        />
      ) : null}
      {/* scale-110: zoom ligero para recortar títulos/créditos en los bordes */}
      <div className="absolute inset-0 w-full h-full scale-110">
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="relative w-full h-full object-cover transition-opacity duration-700"
          style={{
            opacity: error ? 0 : loaded ? 1 : 0,
          }}
          poster={fallbackImage || undefined}
          aria-label="Vídeo de la Tierra (NASA)"
        />
      </div>
    </div>
  );
}
