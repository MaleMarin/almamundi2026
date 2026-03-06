'use client';

import { useRef, useEffect } from 'react';

/**
 * Globo del mapa mundi con vídeo de alta calidad (NASA Blue Marble, 1280x720).
 * Fuente: NASA SVS phytoBlue_30fps — dominio público.
 */
const GLOBE_VIDEO_SRC = '/earth-blue-marble-720p.mp4';
/** Velocidad de reproducción: más bajo = rotación más lenta y suave */
const PLAYBACK_RATE = 0.4;

export function VideoGlobe() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = PLAYBACK_RATE;
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
          className="absolute inset-0 w-full h-full object-cover"
          aria-label="Mapa mundi en rotación"
        />
      </div>
    </div>
  );
}
