'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ObservatoryShell } from '@/components/observatory/ObservatoryShell';
import { NewsObservatory, type NewsItemObservatory } from '@/components/observatory/NewsObservatory';
import { SaveToCollectionButton } from '@/components/collection/SaveToCollectionButton';
import { getMediaByDomain } from '@/lib/media-sources';
import { DEFAULT_NEWS_TOPIC_QUERY } from '@/lib/news-topics';
import { getUserCalendarDayForNewsApi } from '@/lib/news-calendar-day';

function normalizeDomain(hostname: string): string {
  return hostname.replace(/^www\./, '').toLowerCase();
}

function getCuratedSourceName(url: string | null | undefined, fallbackSource: string | null): string | null {
  if (!url || !url.trim()) return fallbackSource;
  try {
    const hostname = new URL(url).hostname || '';
    const domain = normalizeDomain(hostname);
    const media = getMediaByDomain(domain);
    if (media) return media.name;
  } catch {
    // ignore
  }
  return fallbackSource;
}

export function NewsObservatoryModalClient({ newsId }: { newsId: string }) {
  const router = useRouter();
  const [item, setItem] = useState<NewsItemObservatory | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const handleClose = () => router.back();

  useEffect(() => {
    let cancelled = false;
    const topic = DEFAULT_NEWS_TOPIC_QUERY;

    const load = () => {
      const { tz, day } = getUserCalendarDayForNewsApi();
      const q = new URLSearchParams({
        kind: 'news',
        topic,
        limit: '50',
        lang: 'es',
        tz,
        day,
      });
      return fetch(`/api/world?${q.toString()}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('fetch failed'))))
        .then((data: { items?: unknown[] }) => {
          if (cancelled) return;
          const raw = Array.isArray(data.items) ? data.items : [];
          const found = raw.find((i: unknown) => String((i as Record<string, unknown>).id) === newsId) as
            | Record<string, unknown>
            | undefined;
          if (!found) {
            setNotFound(true);
            setLoading(false);
            return;
          }
          const rawUrl = typeof found.url === 'string' ? found.url : '';
          const rawSource = found.source != null ? String(found.source) : null;
          const source = getCuratedSourceName(rawUrl || null, rawSource);
          setItem({
            id: String(found.id),
            title: typeof found.title === 'string' ? found.title : '',
            url: rawUrl,
            source,
            publishedAt: found.publishedAt != null ? String(found.publishedAt) : null,
            sourceCountry: found.sourceCountry != null ? String(found.sourceCountry) : null,
            topic: typeof found.topic === 'string' ? found.topic : 'Actualidad',
          });
          setLoading(false);
          setNotFound(false);
        })
        .catch(() => {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
        });
    };

    void load();
    const interval = window.setInterval(load, 120_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [newsId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0F172A]/98 backdrop-blur-xl">
        <p className="text-white/60">Cargando…</p>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
        <div className="rounded-2xl bg-[#0F172A] border border-white/10 p-8 max-w-md text-center text-white/80">
          <p className="mb-6">Noticia no encontrada.</p>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition"
          >
            Volver al globo
          </button>
        </div>
      </div>
    );
  }

  const subtitleParts = [item.source, item.sourceCountry].filter(Boolean);
  const subtitleStr = subtitleParts.length ? subtitleParts.join(' · ') : '—';
  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0F172A]/98 backdrop-blur-xl overflow-hidden">
      <ObservatoryShell
        title={item.title}
        subtitleLeft={subtitleStr}
        variant="modal"
        backHref="/#mapa"
        onClose={handleClose}
        actions={
          <SaveToCollectionButton
            kind="news"
            id={item.id}
            title={item.title}
            subtitle={subtitleStr}
          />
        }
      >
        <NewsObservatory item={item} />
      </ObservatoryShell>
    </div>
  );
}
