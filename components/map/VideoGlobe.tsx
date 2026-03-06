'use client';

import { useRef, useEffect, useCallback } from 'react';

/**
 * Globo del mapa mundi con vídeo de alta calidad (NASA Blue Marble).
 * Usa versión 60fps para rotación suave sin tiritar. Fuente: NASA SVS 3639 — dominio público.
 */
const GLOBE_VIDEO_SRC = '/earth-blue-marble-720p-60fps.mp4';
/** Velocidad de reproducción: más bajo = rotación más lenta y suave (60fps permite fluidez) */
const PLAYBACK_RATE = 0.35;

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
        className="relative rounded-full overflow-hidden bg-[var(--universe-bg)] flex-shrink-0"
        style={{
          width: 'min(85vw, 85vh)',
          aspectRatio: '1',
          maxHeight: '100%',
          boxShadow: '0 0 80px rgba(100, 150, 255, 0.15), inset 0 0 60px rgba(0,0,0,0.3)',
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
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            imageRendering: 'auto',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
          aria-label="Mapa mundi en rotación"
        />
      </div>
    </div>
  );
}
