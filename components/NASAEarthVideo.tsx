'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Vídeo NASA Blue Marble (Tierra completa).
 * URLs oficiales NASA SVS (opcionales; por CORS/rendimiento se recomienda copia local en public/):
 * - Blue Marble Next Gen UHD: https://svs.gsfc.nasa.gov/vis/a010000/a012500/a012564/12564_Blue_Marble_UHD_large.mp4
 * - Rotating Blue Marble 720p: https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003639/phytoBlue_30fps.mp4
 */

const DEFAULT_VIDEO_SRC = '/earth-globe-nasa.mp4';
const FALLBACK_IMAGE = '/textures/earth-day.jpg';

export type NASAEarthVideoProps = {
  /** URL del vídeo: local (ej. /earth-globe-nasa.mp4) o NASA. Por defecto: public/earth-globe-nasa.mp4 */
  src?: string;
  /** Imagen de fondo mientras carga el vídeo. Por defecto: textura día. */
  fallbackImage?: string;
  /** Clases extra para el contenedor */
  className?: string;
};

export function NASAEarthVideo({
  src = DEFAULT_VIDEO_SRC,
  fallbackImage = FALLBACK_IMAGE,
  className = '',
}: NASAEarthVideoProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onCanPlay = () => setLoaded(true);
    const onError = () => setError(true);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    if (video.readyState >= 2) queueMicrotask(() => setLoaded(true));
    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
    };
  }, [src]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-gray-900/10 aspect-video min-h-[200px] ${className}`}
      style={{
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Fallback: imagen de fondo hasta que el vídeo esté listo o si falla */}
      <div
        className="absolute inset-0 bg-cover bg-center rounded-2xl transition-opacity duration-500"
        style={{
          backgroundImage: `url(${fallbackImage})`,
          opacity: error || !loaded ? 1 : 0,
          pointerEvents: error || !loaded ? 'auto' : 'none',
        }}
        aria-hidden
      />
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="relative w-full h-full object-cover rounded-2xl transition-opacity duration-500"
        style={{
          opacity: error ? 0 : loaded ? 1 : 0,
        }}
        poster={fallbackImage}
        aria-label="Vídeo de la Tierra (NASA Blue Marble)"
      />
    </div>
  );
}
