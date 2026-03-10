'use client';

import { useRef, useEffect, useCallback } from 'react';

/**
 * Globo del mapa mundi con vídeo de alta definición (NASA 1080p60).
 * Fuente: NASA SVS 5570 "Spinning Earth" — 1920×1080, 60fps, dominio público.
 * Para aspecto tipo 4K: vídeo 1080p + render nítido (sin escalado agresivo en CSS).
 */
const GLOBE_VIDEO_SRC = '/earth-1080p60.mp4';
/** Velocidad de reproducción: rotación lenta y suave */
const PLAYBACK_RATE = 0.35;
/** Resolución nativa del vídeo: evita pedir más tamaño al canvas y mantiene nitidez */
const VIDEO_NATIVE_WIDTH = 1920;
const VIDEO_NATIVE_HEIGHT = 1080;

export function VideoGlobe() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackSetRef = useRef(false);

  const applySmoothPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || playbackSetRef.current) return;
    video.playbackRate = PLAYBACK_RATE;
    playbackSetRef.current = true;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState >= 2) {
      video.playbackRate = PLAYBACK_RATE;
      playbackSetRef.current = true;
    }
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center min-h-0" data-globe="video">
      <div
        className="relative rounded-full overflow-hidden flex-shrink-0"
        style={{
          width: 'min(85vw, 85vh)',
          aspectRatio: '1',
          maxHeight: '100%',
          maxWidth: 'min(100%, 1920)',
          background: 'transparent',
          boxShadow: [
            '0 0 30px rgba(100, 180, 255, 0.4)',
            '0 0 70px rgba(80, 150, 255, 0.25)',
            '0 0 120px rgba(60, 120, 255, 0.15)',
          ].join(', '),
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden' as const,
        }}
      >
        <video
          ref={videoRef}
          src={GLOBE_VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={applySmoothPlayback}
          onLoadedData={applySmoothPlayback}
          width={VIDEO_NATIVE_WIDTH}
          height={VIDEO_NATIVE_HEIGHT}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            imageRendering: 'auto',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0) scale(1.14)',
            filter: 'contrast(1.08) saturate(1.05)',
          }}
          aria-label="Mapa mundi en rotación"
        />
      </div>
    </div>
  );
}
