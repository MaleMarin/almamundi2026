'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
}

export function YouTubeEmbed({ videoId, title, className = '' }: YouTubeEmbedProps) {
  const [error, setError] = useState(false);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`;

  if (error) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-black/40 flex flex-col items-center justify-center p-8 text-center ${className}`}
      >
        <p className="text-white/90 font-medium mb-2">No se puede cargar el vídeo — abrir origen</p>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30 transition-colors text-sm font-semibold"
        >
          <ExternalLink size={18} />
          Abrir señal oficial
        </a>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
