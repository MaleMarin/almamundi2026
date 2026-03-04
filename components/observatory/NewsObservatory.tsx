'use client';

import { ExternalLink, Tag } from 'lucide-react';
import Link from 'next/link';

export type NewsItemObservatory = {
  id: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
  sourceCountry: string | null;
  /** Tema curado (ej. de NEWS_TOPIC_GROUPS) */
  topic?: string | null;
};

interface NewsObservatoryProps {
  item: NewsItemObservatory;
}

function formatTime(publishedAt: string | null): string {
  if (!publishedAt) return '—';
  try {
    const d = new Date(publishedAt);
    if (Number.isNaN(d.getTime())) return publishedAt;
    return d.toLocaleString('es', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return publishedAt;
  }
}

export function NewsObservatory({ item }: NewsObservatoryProps) {
  const timeStr = formatTime(item.publishedAt);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm p-5">
        <p className="text-sm text-white/80">
          <span className="text-white/50">Hora: </span>
          <span>{timeStr}</span>
          <span className="text-white/50"> · Medio: </span>
          <span>{item.source ?? '—'}</span>
        </p>
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 transition-colors text-sm font-semibold w-fit"
      >
        <ExternalLink size={18} />
        Abrir fuente
      </a>

      <Link
        href="/mapa?view=actualidad"
        className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition"
      >
        <Tag size={16} />
        Más de este tema
      </Link>
    </div>
  );
}
