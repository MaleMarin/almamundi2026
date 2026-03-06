'use client';

import { useRef, useEffect } from 'react';

/**
 * Globo del mapa mundi usando el vídeo rotate_hd_1280_lossless.mp4.
 * Mismo lugar que el globo, velocidad reducida para rotación más suave.
 */
const GLOBE_VIDEO_SRC = '/rotate_hd_1280_lossless.mp4';
/** Velocidad de reproducción: 1 = normal; 0.5 = mitad; más bajo = más lento */
const PLAYBACK_RATE = 0.45;

export function VideoGlobe() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = PLAYBACK_RATE;
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center min-h-0">
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
          className="absolute inset-0 w-full h-full object-cover"
          aria-label="Mapa mundi en rotación"
        />
      </div>
    </div>
  );
}
