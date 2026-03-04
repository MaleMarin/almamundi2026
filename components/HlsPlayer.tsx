"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface HlsPlayerProps {
  url: string;
  poster?: string;
  className?: string;
}

export function HlsPlayer({ url, poster, className = "" }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls: Hls | null = null;

    // Safari / iOS (HLS nativo)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(() => {});
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(url);
      });
      hls.on(Hls.Events.ERROR, () => {
        // deja que tu UI superior muestre fallback si quieres
      });
    }

    return () => {
      try {
        hls?.destroy();
      } catch {}
    };
  }, [url]);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-black border border-white/10 ${className}`}>
      <video
        ref={videoRef}
        controls
        playsInline
        autoPlay
        muted
        poster={poster}
        className="w-full h-full aspect-video object-contain"
      />
    </div>
  );
}
