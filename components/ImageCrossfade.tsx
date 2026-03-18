'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Varias imágenes que se funden una en otra (crossfade) para dar sensación de video.
 * Dos capas con transición de opacidad; ciclo infinito.
 */

export type ImageCrossfadeProps = {
  /** URLs de las imágenes (orden del ciclo). */
  images: string[];
  /** Tiempo en ms que cada imagen se muestra antes de fundir a la siguiente. */
  intervalMs?: number;
  /** Duración en ms de la transición de fundido. */
  fadeDurationMs?: number;
  /** Clases del contenedor. */
  className?: string;
  /** Estilo del contenedor. */
  style?: React.CSSProperties;
};

const DEFAULT_INTERVAL = 4000;
const DEFAULT_FADE = 2000;

export function ImageCrossfade({
  images,
  intervalMs = DEFAULT_INTERVAL,
  fadeDurationMs = DEFAULT_FADE,
  className = '',
  style,
}: ImageCrossfadeProps) {
  const [index, setIndex] = useState(0);
  const [showingA, setShowingA] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = images.length;
  const hasMultiple = n > 1;

  useEffect(() => {
    if (!hasMultiple || n === 0) return;

    const scheduleNext = () => {
      timeoutRef.current = setTimeout(() => {
        setShowingA((a) => !a);
        timeoutRef.current = setTimeout(() => {
          setIndex((i) => (i + 1) % n);
          setShowingA(true);
          scheduleNext();
        }, fadeDurationMs);
      }, intervalMs);
    };

    scheduleNext();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hasMultiple, n, intervalMs, fadeDurationMs]);

  if (n === 0) return null;

  const transition = `opacity ${fadeDurationMs}ms ease-in-out`;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
      aria-hidden
    >
      {/* Capa A: imagen actual */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${images[index]})`,
          opacity: showingA ? 1 : 0,
          transition,
        }}
      />
      {/* Capa B: siguiente imagen */}
      {hasMultiple && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${images[(index + 1) % n]})`,
            opacity: showingA ? 0 : 1,
            transition,
          }}
        />
      )}
    </div>
  );
}
