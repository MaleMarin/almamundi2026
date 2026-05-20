'use client';

import { useEffect, useState } from 'react';
import type { NewsItem } from '@/components/NewsLayer';
import { NEWS_TOPIC_GROUPS } from '@/lib/news-topics';
import { SITE_FONT_STACK } from '@/lib/typography';

function chipStyle(active: boolean) {
  if (active) {
    return {
      padding: '7px 14px',
      borderRadius: 999,
      cursor: 'pointer' as const,
      fontSize: 13,
      whiteSpace: 'nowrap' as const,
      fontFamily: SITE_FONT_STACK,
      outline: 'none',
      WebkitTapHighlightColor: 'transparent',
      transition: 'all 180ms ease',
      color: '#fff8f2',
      background: 'linear-gradient(180deg, rgba(255, 88, 28, 0.72) 0%, rgba(255, 105, 40, 0.42) 100%)',
      backdropFilter: 'blur(10px) saturate(1.25)',
      WebkitBackdropFilter: 'blur(10px) saturate(1.25)',
      border: '1px solid rgba(255, 150, 90, 0.75)',
      boxShadow: 'inset 0 1px 0 rgba(255, 220, 180, 0.4), 0 2px 10px rgba(255, 69, 0, 0.22)',
    };
  }
  return {
    padding: '7px 14px',
    borderRadius: 999,
    cursor: 'pointer' as const,
    fontSize: 13,
    whiteSpace: 'nowrap' as const,
    fontFamily: SITE_FONT_STACK,
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 180ms ease',
    color: 'rgba(248,250,255,0.78)',
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(12px) saturate(1.15)',
    WebkitBackdropFilter: 'blur(12px) saturate(1.15)',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
  };
}

const topicShortLabel: Record<string, string> = {
  'poder-gobernanza': 'Política',
  'tecnologia-innovacion': 'Tecnología',
  'arte-cultura': 'Arte y cultura',
  'finanzas-salud': 'Finanzas y salud',
  educacion: 'Educación',
  'medio-ambiente': 'Medio ambiente',
  deportes: 'Deportes',
  ciencia: 'Ciencia',
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
    if (!Number.isFinite(diff) || diff < 0) return '';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  const handleClick = () => {
    onClick();
    if (news.url) window.open(news.url, '_blank', 'noopener,noreferrer');
  };

  const timeLabel = timeAgo(news.publishedAt ?? null, now);

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        textAlign: 'left',
        padding: '13px 15px',
        borderRadius: 14,
        background: isActive
          ? 'linear-gradient(135deg, rgba(255, 82, 24, 0.28) 0%, rgba(255, 120, 50, 0.12) 100%)'
          : 'rgba(255, 255, 255, 0.09)',
        backdropFilter: 'blur(12px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.15)',
        border: `1px solid ${isActive ? 'rgba(255, 130, 70, 0.55)' : 'rgba(255,255,255,0.14)'}`,
        borderLeft: isActive ? '3px solid #ff5a1f' : '3px solid rgba(255,255,255,0.08)',
        boxShadow: isActive
          ? 'inset 0 1px 0 rgba(255, 210, 160, 0.25)'
          : 'inset 0 1px 0 rgba(255,255,255,0.1)',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        fontFamily: SITE_FONT_STACK,
        width: '100%',
        opacity: dimmed ? 0.72 : 1,
      }}
    >
      <p
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'rgba(248, 250, 255, 0.98)',
          margin: '0 0 8px',
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {news.title}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'rgba(230, 236, 248, 0.72)', lineHeight: 1.35 }}>
          {news.source ?? news.outletName ?? '—'}
        </span>
        {timeLabel ? (
          <span
            style={{ fontSize: 12, color: 'rgba(200, 210, 228, 0.88)', lineHeight: 1.35 }}
            title={news.publishedAt ?? undefined}
          >
            {timeLabel}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function hasLocation(n: NewsItem): boolean {
  return (n.geo?.lat != null && n.geo?.lng != null) || (n.lat != null && n.lng != null);
}

function NewsListSection({
  items,
  selectedNews,
  onNewsFocus,
  sectionLabel,
  dimAll = false,
}: {
  items: NewsItem[];
  selectedNews: NewsItem | null;
  onNewsFocus: (n: NewsItem) => void;
  sectionLabel?: string;
  dimAll?: boolean;
}) {
  if (items.length === 0) return null;

  const withLocation = items.filter(hasLocation);
  const withoutLocation = items.filter((n) => !hasLocation(n));

  return (
    <>
      {sectionLabel ? (
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: sectionLabel === '◎ En el mapa' ? '#ff6b2e' : 'rgba(200, 214, 235, 0.72)',
            margin: '8px 0 2px 2px',
            fontFamily: SITE_FONT_STACK,
            lineHeight: 1.35,
          }}
        >
          {sectionLabel}
        </p>
      ) : null}
      {withLocation.length > 0 && sectionLabel !== '◎ En el mapa' ? (
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#ff6b2e',
            margin: '4px 0 2px 2px',
            fontFamily: SITE_FONT_STACK,
            lineHeight: 1.35,
          }}
        >
          ◎ En el mapa
        </p>
      ) : null}
      {withLocation.map((n, i) => (
        <NewsRow
          key={`${n.id ?? 'news'}-map-${i}`}
          news={n}
          isActive={selectedNews?.id === n.id}
          onClick={() => onNewsFocus(n)}
          dimmed={dimAll}
        />
      ))}
      {withoutLocation.map((n, i) => (
        <NewsRow
          key={`${n.id ?? 'news'}-nl-${i}`}
          news={n}
          isActive={selectedNews?.id === n.id}
          onClick={() => onNewsFocus(n)}
          dimmed
        />
      ))}
    </>
  );
}

export type NewsPanelProps = {
  topicNews?: NewsItem[];
  generalNews?: NewsItem[];
  news: NewsItem[];
  loading?: boolean;
  isRefreshing?: boolean;
  loadingTimedOut?: boolean;
  topicMatched?: boolean;
  relaxedTopic?: boolean;
  error?: string | null;
  selectedTopicId: string | null;
  onTopicIdChange: (id: string | null) => void;
  onNewsFocus: (n: NewsItem) => void;
  selectedNews: NewsItem | null;
};

export function NewsPanel({
  topicNews = [],
  generalNews = [],
  news,
  loading = false,
  isRefreshing = false,
  loadingTimedOut = false,
  topicMatched = true,
  relaxedTopic = false,
  error = null,
  selectedTopicId,
  onTopicIdChange,
  onNewsFocus,
  selectedNews,
}: NewsPanelProps) {
  const isAllTopics = selectedTopicId == null;
  const displayTopic = topicNews.length > 0 ? topicNews : isAllTopics ? news : [];
  const displayGeneral = !isAllTopics && relaxedTopic ? generalNews : [];
  const totalVisible = displayTopic.length + displayGeneral.length;

  const statusMessage = (() => {
    if (loading && totalVisible === 0) {
      return 'Cargando titulares de medios curados…';
    }
    if (loadingTimedOut && totalVisible === 0) {
      return 'No pudimos cargar titulares en este momento. Intenta otra categoría.';
    }
    if (error && totalVisible === 0) return error;
    if (!loading && !error && !isAllTopics && displayTopic.length === 0 && displayGeneral.length === 0) {
      return 'No encontramos titulares recientes para esta categoría.';
    }
    return null;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: 7,
            alignContent: 'start',
          }}
        >
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

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {isRefreshing && totalVisible > 0 ? (
          <p
            style={{
              fontSize: 11,
              color: 'rgba(180, 198, 220, 0.65)',
              fontFamily: SITE_FONT_STACK,
              lineHeight: 1.35,
              padding: '0 4px',
            }}
          >
            Actualizando…
          </p>
        ) : null}

        {statusMessage ? (
          <p
            style={{
              fontSize: 14,
              color: loading || loadingTimedOut ? 'rgba(212,220,232,0.82)' : 'rgba(255,200,170,0.92)',
              fontFamily: SITE_FONT_STACK,
              lineHeight: 1.5,
              padding: '10px 4px',
            }}
          >
            {statusMessage}
          </p>
        ) : null}

        {!isAllTopics && displayTopic.length === 0 && displayGeneral.length > 0 && !loading ? (
          <p
            style={{
              fontSize: 13,
              color: 'rgba(212, 220, 232, 0.88)',
              fontFamily: SITE_FONT_STACK,
              lineHeight: 1.5,
              padding: '4px 4px 0',
            }}
          >
            No encontramos titulares recientes para esta categoría.
          </p>
        ) : null}

        <NewsListSection
          items={displayTopic}
          selectedNews={selectedNews}
          onNewsFocus={onNewsFocus}
        />

        {displayGeneral.length > 0 ? (
          <>
            <p
              style={{
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(200, 214, 235, 0.72)',
                margin: '12px 0 4px 2px',
                fontFamily: SITE_FONT_STACK,
                lineHeight: 1.35,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: 12,
              }}
            >
              Titulares generales
            </p>
            <NewsListSection
              items={displayGeneral}
              selectedNews={selectedNews}
              onNewsFocus={onNewsFocus}
              dimAll
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
