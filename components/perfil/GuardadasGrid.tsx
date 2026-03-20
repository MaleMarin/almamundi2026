'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { StoryData } from '@/lib/story-schema';

const SH_DARK = 'rgba(163,177,198,0.6)';
const SH_LIGHT = 'rgba(255,255,255,0.85)';
const ORANGE = '#ff6b2b';

const FORMAT_EMOJI: Record<string, string> = {
  video: '🎬',
  audio: '🎙️',
  texto: '✍️',
  foto: '📸',
};

type Props = {
  historias: StoryData[];
  onLoadMore: () => void;
  hasMore: boolean;
  columns?: 2 | 4;
};

type FilterKey = 'all' | 'video' | 'audio' | 'texto' | 'foto';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'video', label: '🎬 Video' },
  { key: 'audio', label: '🎙️ Audio' },
  { key: 'texto', label: '✍️ Texto' },
  { key: 'foto', label: '📸 Foto' },
];

export function GuardadasGrid({ historias, onLoadMore, hasMore, columns = 4 }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return historias;
    return historias.filter((h) => h.formato === filter);
  }, [historias, filter]);

  return (
    <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            style={{
              flexShrink: 0,
              padding: '0.5rem 0.9rem',
              borderRadius: 50,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              background:
                filter === key
                  ? `linear-gradient(135deg, ${ORANGE}, #ff8c55)`
                  : '#e8ecf0',
              color: filter === key ? '#fff' : '#4a5568',
              boxShadow:
                filter === key
                  ? `3px 3px 10px rgba(255,107,43,0.35)`
                  : `4px 4px 8px ${SH_DARK}, -4px -4px 8px ${SH_LIGHT}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 12,
        }}
      >
        {filtered.map((h) => {
          const thumb =
            h.imageUrl ||
            (h.images && h.images[0]) ||
            '';
          const icon = FORMAT_EMOJI[h.formato] ?? '📝';
          return (
            <Link
              key={h.id}
              href={`/historias/${h.id}`}
              style={{
                background: '#e8ecf0',
                borderRadius: 12,
                boxShadow: `5px 5px 12px ${SH_DARK}, -3px -3px 8px ${SH_LIGHT}`,
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  height: 70,
                  background: thumb
                    ? `url(${thumb}) center/cover`
                    : 'linear-gradient(135deg, #1a2332, #2d3748)',
                }}
              />
              <div style={{ padding: '0.5rem 0.6rem' }}>
                <span
                  style={{
                    fontSize: '0.58rem',
                    textTransform: 'uppercase',
                    color: ORANGE,
                  }}
                >
                  {icon}
                </span>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontFamily: 'Fraunces, serif',
                    fontStyle: 'italic',
                    fontSize: '0.72rem',
                    color: '#1a2332',
                    lineHeight: 1.3,
                  }}
                >
                  {h.titulo}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          style={{
            marginTop: 16,
            padding: '0.5rem 1rem',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            background: '#e8ecf0',
            color: '#4a5568',
            boxShadow: `4px 4px 8px ${SH_DARK}, -4px -4px 8px ${SH_LIGHT}`,
          }}
        >
          Cargar más
        </button>
      )}
    </div>
  );
}
