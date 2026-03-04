'use client';

/**
 * Página pública Archivo AlmaMundi.
 * Muestra historias con status 'archived'. Tres vistas: por semana, por tema, muestras.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { UniverseBackground } from '@/components/UniverseBackground';
import { StoryViewer } from '@/components/mapa/StoryViewer';
import { getThemeLabel } from '@/lib/themes';
import type { StoryPoint } from '@/lib/map-data/stories';

const BG = '#0a0f24';
const APP_FONT = "'Avenir Light', Avenir, sans-serif";

type ViewMode = 'semana' | 'tema' | 'muestras';

type ArchivoStory = {
  id: string;
  title: string;
  alias: string;
  place: string;
  lat: number | null;
  lng: number | null;
  format: 'video' | 'audio' | 'text' | 'photos';
  mediaUrl: string;
  thumbnailUrl: string | null;
  topic: string[];
  createdAt: number | null;
  city?: string;
  country?: string;
  body?: string;
  videoUrl?: string;
  audioUrl?: string;
  imageUrl?: string;
  photos?: { url: string; name?: string; date?: string }[];
};

type MuestraTopic = {
  topic: string;
  topicLabel: string;
  items: { id: string; topic: string; topicLabel: string; publicUrl: string; alias: string; createdAt: string }[];
};

function formatWeekTitle(weekNum: number, startDate: Date): string {
  const d = startDate.getDate();
  const m = startDate.toLocaleString('es-CL', { month: 'long' });
  const y = startDate.getFullYear();
  return `${weekNum} — ${d} ${m} ${y}`;
}

function getWeekKey(ts: number | null): { year: number; week: number; start: Date } | null {
  if (ts == null) return null;
  const d = new Date(ts);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  start.setHours(0, 0, 0, 0);
  const year = start.getFullYear();
  const firstDay = new Date(year, 0, 1);
  const week = Math.ceil((((start.getTime() - firstDay.getTime()) / 86400000) + firstDay.getDay() + 1) / 7);
  return { year, week, start };
}

function archivoToStoryPoint(s: ArchivoStory): StoryPoint {
  return {
    id: s.id,
    lat: s.lat ?? 0,
    lng: s.lng ?? 0,
    label: [s.alias, s.place].filter(Boolean).join(' · ') || s.title,
    title: s.title,
    topic: s.topic?.[0],
    city: s.city,
    country: s.country,
    body: s.body,
    videoUrl: s.videoUrl,
    audioUrl: s.audioUrl,
    imageUrl: s.imageUrl,
    photos: (s.photos ?? []) as { url: string; name?: string; date?: string }[],
    hasText: Boolean(s.body),
    hasAudio: Boolean(s.audioUrl),
    hasVideo: Boolean(s.videoUrl),
  };
}

const FORMAT_ICON: Record<string, string> = {
  video: '🎥',
  audio: '🎙️',
  photos: '📷',
  text: '📝',
};

function StoryCard({
  story,
  onClick,
}: {
  story: ArchivoStory;
  onClick: () => void;
}) {
  const thumb = story.thumbnailUrl || (story.format === 'photos' && story.photos?.[0]?.url) || story.imageUrl;
  const icon = FORMAT_ICON[story.format] ?? '📝';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        textAlign: 'left',
        width: '100%',
        padding: 0,
        fontFamily: APP_FONT,
      }}
      className="hover:border-white/20 hover:bg-white/[0.08]"
    >
      <div style={{ aspectRatio: '16/9', background: '#111', position: 'relative' }}>
        {thumb ? (
          <img
            src={thumb}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.2)',
              fontSize: 48,
            }}
          >
            {icon}
          </div>
        )}
        <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 18 }}>
          {icon}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.90)', margin: '0 0 4px', fontWeight: 600 }}>
          {story.title}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
          {story.alias || '—'} · {story.place || '—'}
        </p>
        {story.topic?.[0] && (
          <p style={{ fontSize: 11, color: 'rgba(249,115,22,0.70)', margin: '4px 0 0' }}>
            {getThemeLabel(story.topic[0]) || story.topic[0]}
          </p>
        )}
      </div>
    </button>
  );
}

export default function ArchivoPage() {
  const [view, setView] = useState<ViewMode>('semana');
  const [stories, setStories] = useState<ArchivoStory[]>([]);
  const [muestras, setMuestras] = useState<MuestraTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<ArchivoStory | null>(null);
  const [viewerClosing, setViewerClosing] = useState(false);
  const [temaFilter, setTemaFilter] = useState<string | null>(null);

  const fetchArchivo = useCallback(async () => {
    try {
      const res = await fetch('/api/archivo');
      const data = (await res.json()) as { stories?: ArchivoStory[] };
      setStories(data.stories ?? []);
    } catch {
      setStories([]);
    }
  }, []);

  const fetchMuestras = useCallback(async () => {
    try {
      const res = await fetch('/api/muestras');
      const data = (await res.json()) as { topics?: MuestraTopic[] };
      setMuestras(data.topics ?? []);
    } catch {
      setMuestras([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchArchivo(), fetchMuestras()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchArchivo, fetchMuestras]);

  const closeViewer = () => {
    setViewerClosing(true);
    setTimeout(() => {
      setSelectedStory(null);
      setViewerClosing(false);
    }, 400);
  };

  const byWeek = (() => {
    const map = new Map<string, ArchivoStory[]>();
    stories.forEach((s) => {
      const key = getWeekKey(s.createdAt);
      if (!key) return;
      const k = `${key.year}-W${key.week}`;
      const list = map.get(k) ?? [];
      list.push(s);
      map.set(k, list);
    });
    const entries = Array.from(map.entries())
      .map(([k, list]) => {
        const first = list[0];
        const key = getWeekKey(first?.createdAt ?? null);
        return { key: k, list, start: key?.start ?? new Date(0), weekNum: key ? key.week : 0 };
      })
      .sort((a, b) => b.start.getTime() - a.start.getTime());
    return entries;
  })();

  const temas = Array.from(
    new Set(stories.flatMap((s) => s.topic ?? []).filter(Boolean))
  ).sort();

  const filteredByTema = temaFilter
    ? stories.filter((s) => s.topic?.includes(temaFilter))
    : stories;

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: BG }}>
      <UniverseBackground />

      <div style={{ position: 'relative', zIndex: 10, padding: '24px 16px', fontFamily: APP_FONT, color: 'rgba(255,255,255,0.92)' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <Link
            href="/"
            style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontSize: 18, fontWeight: 600 }}
          >
            ← AlmaMundi
          </Link>
          <nav style={{ display: 'flex', gap: 8 }}>
            <Link href="/mapa" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 }}>
              Mapa
            </Link>
          </nav>
        </header>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 300, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Archivo
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          Historias que ya pasaron por el mapa y permanecen en el archivo.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {(
            [
              { id: 'semana' as const, label: 'Por semana' },
              { id: 'tema' as const, label: 'Por tema' },
              { id: 'muestras' as const, label: 'Muestras' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setView(tab.id); setTemaFilter(null); }}
              style={{
                padding: '12px 24px',
                borderRadius: 999,
                border: `1px solid ${view === tab.id ? 'rgba(255,69,0,0.5)' : 'rgba(255,255,255,0.2)'}`,
                background: view === tab.id ? 'rgba(255,69,0,0.15)' : 'rgba(255,255,255,0.05)',
                color: view === tab.id ? '#ff6b35' : 'rgba(255,255,255,0.85)',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: APP_FONT,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 48 }}>Cargando…</p>
        )}

        {/* Vista por semana */}
        {!loading && view === 'semana' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {byWeek.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 48 }}>
                Aún no hay historias en el archivo.
              </p>
            )}
            {byWeek.map(({ key, list, start, weekNum }) => (
              <section key={key}>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>
                  {formatWeekTitle(weekNum, start)}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gap: 24 }}>
                  {list.map((s) => (
                    <StoryCard key={s.id} story={s} onClick={() => setSelectedStory(s)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Vista por tema */}
        {!loading && view === 'tema' && (
          <div>
            {temas.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                <button
                  type="button"
                  onClick={() => setTemaFilter(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 999,
                    border: `1px solid ${temaFilter === null ? 'rgba(255,69,0,0.5)' : 'rgba(255,255,255,0.2)'}`,
                    background: temaFilter === null ? 'rgba(255,69,0,0.15)' : 'rgba(255,255,255,0.06)',
                    color: temaFilter === null ? '#ff6b35' : 'rgba(255,255,255,0.8)',
                    fontSize: 14,
                    cursor: 'pointer',
                    fontFamily: APP_FONT,
                  }}
                >
                  Todos
                </button>
                {temas.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemaFilter(t)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 999,
                      border: `1px solid ${temaFilter === t ? 'rgba(255,69,0,0.5)' : 'rgba(255,255,255,0.2)'}`,
                      background: temaFilter === t ? 'rgba(255,69,0,0.15)' : 'rgba(255,255,255,0.06)',
                      color: temaFilter === t ? '#ff6b35' : 'rgba(255,255,255,0.8)',
                      fontSize: 14,
                      cursor: 'pointer',
                      fontFamily: APP_FONT,
                    }}
                  >
                    {getThemeLabel(t) || t}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gap: 24 }}>
              {filteredByTema.map((s) => (
                <StoryCard key={s.id} story={s} onClick={() => setSelectedStory(s)} />
              ))}
            </div>
            {filteredByTema.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 48 }}>
                No hay historias con ese tema.
              </p>
            )}
          </div>
        )}

        {/* Vista muestras */}
        {!loading && view === 'muestras' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gap: 24 }}>
            {muestras.map((m) => (
              <div
                key={m.topic}
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  padding: 20,
                }}
              >
                <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.95)', margin: '0 0 4px' }}>
                  {m.topicLabel}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  AlmaMundi · {m.items.length} historias
                </p>
                <Link
                  href={`/muestras?tema=${encodeURIComponent(m.topic)}`}
                  style={{
                    display: 'inline-block',
                    marginTop: 14,
                    padding: '10px 18px',
                    borderRadius: 999,
                    background: 'rgba(255,69,0,0.2)',
                    border: '1px solid rgba(255,69,0,0.4)',
                    color: '#fdba74',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontFamily: APP_FONT,
                  }}
                >
                  Ver muestra
                </Link>
              </div>
            ))}
            {muestras.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1 / -1', textAlign: 'center', padding: 48 }}>
                No hay muestras publicadas.
              </p>
            )}
          </div>
        )}
      </div>

      {/* StoryViewer modal */}
      {selectedStory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StoryViewer
            story={archivoToStoryPoint(selectedStory)}
            onClose={closeViewer}
            isClosing={viewerClosing}
          />
        </div>
      )}
    </div>
  );
}
