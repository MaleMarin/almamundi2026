'use client';

import { useState, useEffect, useRef } from 'react';

/** Una foto por vez, Ken Burns lento, silencio entre cada una. Nombre + fecha como subtítulo (roadmap 1B). */
const DURATION_MS = 8000;
const KEN_BURNS_DURATION_MS = 7500;

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export interface PhotoStoryViewerProps {
  images: string[];
  title: string;
  date?: string;
  /** Duración por foto en ms (default 8000) */
  durationMs?: number;
}

export function PhotoStoryViewer({
  images,
  title,
  date,
  durationMs = DURATION_MS,
}: PhotoStoryViewerProps) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, durationMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [images.length, durationMs]);

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[280px] text-white/50 rounded-2xl border border-white/10 bg-black/20">
        No hay fotos en esta historia.
      </div>
    );
  }

  const src = images[index] ?? images[0]!;
  const dateStr = formatDate(date);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden min-h-[280px] flex flex-col">
      <div className="relative flex-1 min-h-[260px] overflow-hidden flex items-center justify-center">
        <div
          key={index}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${src})`,
            animation: `ken-burns ${KEN_BURNS_DURATION_MS}ms ease-out forwards`,
          }}
        />
        {/* Overlay suave para legibilidad del subtítulo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 45%)',
          }}
        />
      </div>
      <div className="shrink-0 px-4 py-3 text-center border-t border-white/10">
        <p className="text-white/95 font-medium">{title}</p>
        {dateStr && <p className="text-white/60 text-sm mt-0.5">{dateStr}</p>}
      </div>
    </div>
  );
}
