'use client';

import { useEffect, useState } from 'react';
import type { NewsItem } from '@/components/NewsLayer';
import { NEWS_TOPIC_GROUPS } from '@/lib/news-topics';
import { SITE_FONT_STACK } from '@/lib/typography';

function chipStyle(active: boolean) {
  if (active) return {
    padding: '8px 16px',
    borderRadius: 999,
    cursor: 'pointer' as const,
    fontSize: 14,
    whiteSpace: 'nowrap' as const,
    fontFamily: SITE_FONT_STACK,
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 180ms ease',
    color: '#fff',
    background: 'linear-gradient(180deg, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.16) 100%)',
    border: '1px solid rgba(255,155,60,0.45)',
    boxShadow: 'inset 0 1.5px 0 rgba(255,185,70,0.45), inset 0 -1px 0 rgba(180,55,0,0.20), 0 0 12px rgba(249,115,22,0.15), 0 4px 8px rgba(0,0,0,0.25)',
  };
  return {
    padding: '8px 16px',
    borderRadius: 999,
    cursor: 'pointer' as const,
    fontSize: 14,
    whiteSpace: 'nowrap' as const,
    fontFamily: SITE_FONT_STACK,
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 180ms ease',
    color: 'rgba(255,255,255,0.55)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: 'none',
  };
}

const topicShortLabel: Record<string, string> = {
  'poder-gobernanza': 'Política',
  'tecnologia-innovacion': 'Tecnología',
  'arte-cultura': 'Arte y cultura',
  'finanzas-salud': 'Finanzas y salud',
  'educacion': 'Educación',
  'medio-ambiente': 'Medio ambiente',
  'deportes': 'Deportes',
  'ciencia': 'Ciencia',
  'migracion-derechos': 'Migración',
};

function NewsRow({
  news,
  isActive,
  onClick,
  dimmed = false,
}: {
  news: NewsItem;
  isActive: boolean;
  onClick: () => void;
  dimmed?: boolean;
}) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  const timeAgo = (date: string | null, currentTime: number) => {
    if (!date) return '';
    const diff = currentTime - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  const handleClick = () => {
    onClick();
    if (news.url) window.open(news.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: 14,
        background: isActive ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderLeft: isActive ? '3px solid rgba(96,165,250,0.6)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        fontFamily: SITE_FONT_STACK,
        width: '100%',
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <p
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: 'rgba(240,245,255,0.96)',
          margin: '0 0 8px',
          lineHeight: 1.42,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {news.title}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)', lineHeight: 1.35 }}>
          {news.source ?? news.outletName ?? '—'}
        </span>
        <span
          style={{ fontSize: 12, color: 'rgba(212,220,232,0.82)', lineHeight: 1.35 }}
          title={news.publishedAt ?? undefined}
        >
          {timeAgo(news.publishedAt ?? null, now)}
        </span>
      </div>
    </button>
  );
}

export type NewsPanelProps = {
  news: NewsItem[];
  selectedTopicId: string | null;
  onTopicIdChange: (id: string | null) => void;
  onNewsFocus: (n: NewsItem) => void;
  selectedNews: NewsItem | null;
};

export function NewsPanel({
  news,
  selectedTopicId,
  onTopicIdChange,
  onNewsFocus,
  selectedNews,
}: NewsPanelProps) {
  const hasLocation = (n: NewsItem) => (n.geo?.lat != null && n.geo?.lng != null) || (n.lat != null && n.lng != null);
  const withLocation = news.filter(hasLocation);
  const withoutLocation = news.filter((n) => !hasLocation(n));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 8,
          alignContent: 'start',
        }}>
          <button
            type="button"
            onClick={() => onTopicIdChange(null)}
            style={{
              ...chipStyle(!selectedTopicId),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              minWidth: 0,
            }}
          >
            Todas
          </button>
          {NEWS_TOPIC_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onTopicIdChange(selectedTopicId === g.id ? null : g.id)}
              style={{
                ...chipStyle(selectedTopicId === g.id),
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                minWidth: 0,
              }}
              title={g.label}
            >
              {topicShortLabel[g.id] ?? (g.label.length > 14 ? g.label.slice(0, 12) + '…' : g.label)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {withLocation.length > 0 && (
          <>
            <p
              style={{
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.48)',
                margin: '6px 0 4px 2px',
                fontFamily: SITE_FONT_STACK,
                lineHeight: 1.35,
              }}
            >
              ◎ En el mapa
            </p>
            {withLocation.map((n, i) => (
              <NewsRow key={`${n.id ?? 'news'}-${i}`} news={n} isActive={selectedNews?.id === n.id} onClick={() => onNewsFocus(n)} />
            ))}
          </>
        )}
        {withoutLocation.map((n, i) => (
          <NewsRow key={`${n.id ?? 'news'}-${i}`} news={n} isActive={selectedNews?.id === n.id} onClick={() => onNewsFocus(n)} dimmed />
        ))}
      </div>
    </div>
  );
}
