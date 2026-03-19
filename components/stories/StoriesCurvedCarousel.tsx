'use client';

/**
 * Carrusel curvo de historias en video: rueda vertical a la izquierda (thumbnails en arco),
 * detalle y reproductor a la derecha. Inspirado en UI tipo "stories" con rueda giratoria.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { StoryPoint } from '@/lib/map-data/stories';

const RADIUS = 420;
const ITEM_ANGLE = 18;
const THUMB_WIDTH = 120;
const THUMB_HEIGHT = 68;

function formatDate(publishedAt: string | undefined): string {
  if (!publishedAt) return '—';
  const d = new Date(publishedAt);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPlace(s: StoryPoint): string {
  return [s.city, s.country].filter(Boolean).join(', ') || s.label || '—';
}

export type StoriesCurvedCarouselProps = {
  stories: StoryPoint[];
  /** Historias que tienen video (videoUrl o hasVideo). */
  onSelectStory?: (story: StoryPoint) => void;
};

export function StoriesCurvedCarousel({ stories, onSelectStory }: StoriesCurvedCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [startIndex, setStartIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = stories[selectedIndex] ?? null;

  const go = useCallback(
    (delta: number) => {
      if (stories.length === 0) return;
      setSelectedIndex((i) => (i + delta + stories.length) % stories.length);
    },
    [stories.length]
  );

  useEffect(() => {
    if (!selected) return;
    onSelectStory?.(selected);
  }, [selected, onSelectStory]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) go(1);
      else if (e.deltaY < 0) go(-1);
    },
    [go]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragStartY(e.clientY);
    setStartIndex(selectedIndex);
  }, [selectedIndex]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartY === null) return;
      const dy = e.clientY - dragStartY;
      const threshold = 40;
      if (Math.abs(dy) > threshold) {
        const step = dy > 0 ? 1 : -1;
        go(step);
        setDragStartY(e.clientY);
      }
    },
    [dragStartY, go]
  );

  const handlePointerUp = useCallback(() => {
    setDragStartY(null);
  }, []);

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <p className="text-lg">Aún no hay historias en video.</p>
        <Link href="/historias" className="mt-4 text-amber-500 hover:underline">
          Ver todas las historias
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full min-h-[80vh] bg-[#E0E5EC] text-gray-800 overflow-hidden" style={{ fontFamily: `'Avenir Light', Avenir, sans-serif` }}>
      {/* Columna izquierda: rueda curva de thumbnails */}
      <div
        ref={containerRef}
        className="flex-shrink-0 flex flex-col items-center justify-center py-8 pl-4 pr-2 select-none touch-none"
        style={{ width: 200 }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="relative flex flex-col items-center justify-center"
          style={{
            perspective: '1000px',
            perspectiveOrigin: '50% 50%',
            transformStyle: 'preserve-3d',
            height: 340,
          }}
        >
          {stories.map((story, i) => {
            const offset = i - selectedIndex;
            const angle = offset * ITEM_ANGLE;
            const isCenter = offset === 0;
            const y = offset * (THUMB_HEIGHT + 12);
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className="absolute left-1/2 top-1/2 rounded-lg overflow-hidden border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{
                  width: THUMB_WIDTH,
                  height: THUMB_HEIGHT,
                  marginLeft: -THUMB_WIDTH / 2,
                  marginTop: -THUMB_HEIGHT / 2,
                  transform: `translateY(${y}px) rotateX(${angle}deg)`,
                  transformStyle: 'preserve-3d',
                  zIndex: isCenter ? 20 : 10 - Math.abs(offset),
                  opacity: isCenter ? 1 : 0.4 + 0.3 * (1 - Math.min(Math.abs(offset), 4) / 4),
                  borderColor: isCenter ? 'rgba(249, 115, 22, 0.9)' : 'rgba(0,0,0,0.08)',
                  boxShadow: isCenter ? '0 12px 40px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                {story.videoUrl ? (
                  <video
                    src={story.videoUrl}
                    className="w-full h-full object-cover pointer-events-none"
                    muted
                    playsInline
                    preload="metadata"
                    poster={story.imageUrl}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                    {story.imageUrl ? (
                      <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-60">▶</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-4 text-center">
          Gira o arrastra
        </p>
      </div>

        {/* Centro-derecha: detalle de la historia seleccionada — persona, región, ciudad, nombre historia, fecha */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0 p-6 md:p-10 gap-6">
        <div className="flex flex-col flex-1 min-w-0">
          {selected && (
            <>
              {selected.authorName && (
                <p className="text-[10px] font-semibold tracking-[0.2em] text-amber-600 uppercase mb-0.5">
                  {selected.authorName}
                </p>
              )}
              <p className="text-sm text-gray-600 mb-1">
                {[selected.country, selected.city].filter(Boolean).join(' · ') || formatPlace(selected)}
              </p>
              <h1 className="text-2xl md:text-4xl font-serif font-light leading-tight mb-2 text-gray-800">
                {selected.title || 'Sin título'}
              </h1>
              <p className="text-sm text-gray-500 mb-6">{formatDate(selected.publishedAt)}</p>

              <Link
                href={selected.videoUrl ? `/historias/${selected.id}/video` : `/historias/${selected.id}`}
                className="inline-flex items-center justify-center gap-2 w-14 h-14 rounded-full bg-[var(--almamundi-orange,#f97316)] hover:opacity-90 text-white transition-colors mb-6"
                aria-label={selected.videoUrl ? 'Ver en cine' : 'Reproducir'}
              >
                <span className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-white ml-1" />
              </Link>

              <div className="flex items-center gap-4 text-gray-600">
                <button type="button" className="flex items-center gap-1.5 hover:text-gray-900 transition-colors" aria-label="Compartir">
                  <span className="text-lg">↗</span>
                  <span className="text-xs">Compartir</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Grid de previews a la derecha */}
        <div className="flex-shrink-0 w-full md:w-72 grid grid-cols-2 gap-2">
          {selected?.images?.slice(0, 4).map((url, i) => (
            <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-300/50 shadow-inner">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          )) ?? (
            selected?.imageUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-300/50 shadow-inner col-span-2">
                <img src={selected.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )
          )}
          {selected && !selected.images?.length && !selected.imageUrl && (
            <div className="col-span-2 aspect-video rounded-lg bg-gray-300/30 flex items-center justify-center text-gray-500 text-sm">
              Sin imágenes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
