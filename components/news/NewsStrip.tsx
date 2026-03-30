'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserCalendarDayForNewsApi } from '@/lib/news-calendar-day';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  topic: string;
  language: string;
  publishedAt: string | null;
  imageUrl: string | null;
}

const TOPICS = [
  { id: 'conflictos', label: 'Conflictos' },
  { id: 'medio-ambiente', label: 'Clima' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'economia', label: 'Economía' },
  { id: 'arte', label: 'Arte' },
  { id: 'cine', label: 'Cine' },
  { id: 'musica', label: 'Música' },
  { id: 'migracion', label: 'Migración' },
  { id: 'salud', label: 'Salud' },
  { id: 'viajes', label: 'Viajes' },
  { id: 'historias', label: 'Historias' },
  { id: 'literatura', label: 'Literatura' },
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
}

export default function NewsStrip() {
  const [activeTopic, setActiveTopic] = useState('conflictos');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = useCallback(async (topic: string) => {
    setLoading(true);
    try {
      const { tz, day } = getUserCalendarDayForNewsApi();
      const q = new URLSearchParams({ topic, limit: '15', tz, day });
      const res = await fetch(`/api/news-live?${q.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items?: NewsItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(activeTopic);
  }, [activeTopic, fetchNews]);

  useEffect(() => {
    const id = window.setInterval(() => fetchNews(activeTopic), 120_000);
    return () => window.clearInterval(id);
  }, [activeTopic, fetchNews]);

  return (
    <div
      style={{
        width: '300px',
        height: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(205deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.16) 48%, rgba(255,255,255,0.07) 72%, rgba(200, 220, 255, 0.12) 100%)',
        backdropFilter: 'blur(38px) saturate(1.55)',
        WebkitBackdropFilter: 'blur(38px) saturate(1.55)',
        borderLeft: '1px solid rgba(255,255,255,0.46)',
        boxShadow:
          '-14px 0 48px rgba(0,0,0,0.36), inset 1px 0 0 rgba(255,255,255,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.28)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#ff5a14',
            marginBottom: '10px',
            textShadow: '0 0 18px rgba(255, 69, 0, 0.45)',
          }}
        >
          Noticias en vivo
        </div>

        {/* Selector de temas — scroll horizontal */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none',
          }}
        >
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTopic(t.id)}
              style={{
                flexShrink: 0,
                padding: '4px 10px',
                borderRadius: '20px',
                border:
                  activeTopic === t.id
                    ? '1px solid rgba(255, 100, 40, 0.95)'
                    : '1px solid rgba(255,255,255,0.22)',
                background:
                  activeTopic === t.id
                    ? 'linear-gradient(180deg, rgba(255, 69, 0, 0.55) 0%, rgba(255, 85, 20, 0.32) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow:
                  activeTopic === t.id
                    ? 'inset 0 1px 0 rgba(255, 200, 150, 0.45), 0 0 16px rgba(255, 69, 0, 0.35)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.18)',
                color: activeTopic === t.id ? '#ffffff' : 'rgba(255,255,255,0.52)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de noticias */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
        {loading ? (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="news-strip-skeleton"
                style={{
                  height: '64px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            No hay noticias disponibles
          </div>
        ) : (
          items.map((item, i) => (
            <a
              key={item.id ?? i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{item.source}</span>
                <span>{timeAgo(item.publishedAt)}</span>
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.88)',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}
              >
                {item.title}
              </div>
              {item.summary && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.35)',
                    marginTop: '4px',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}
                >
                  {item.summary}
                </div>
              )}
            </a>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
        }}
      >
        Hoy (tu zona) · actualiza cada 2 min
      </div>
    </div>
  );
}
