'use client';

import { useMemo } from 'react';
import { SITE_FONT_STACK } from '@/lib/typography';
import { Search } from 'lucide-react';
import { DemoStoryDisclosure } from '@/components/stories/DemoStoryDisclosure';
import { storyShowsDemoDisclaimer } from '@/lib/demo-stories-public';
import type { StoryPoint } from '@/lib/map-data/stories';

export type StoriesPanelProps = {
  stories: StoryPoint[];
  exploreQuery: string;
  onExploreQueryChange: (q: string) => void;
  onStoryFocus: (s: StoryPoint) => void;
  highlightedStoryId: string | null;
  onContarMiHistoria?: () => void;
  /**
   * `search` = solo pestaña «Buscar por palabras clave»: no mostrar el listado completo;
   * solo resultados cuando hay texto en el campo.
   */
  panelMode?: 'stories' | 'search';
};

function storyHaystack(s: StoryPoint): string {
  return [
    s.id,
    s.title,
    s.label,
    s.city,
    s.country,
    s.topic,
    s.description,
    s.body,
    s.authorName,
    s.format,
    s.excerpt,
    s.subtitle,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function storiesMatchingQuery(stories: StoryPoint[], q: string): StoryPoint[] {
  const n = q.trim().toLowerCase();
  if (!n) return [];
  return stories.filter((s) => storyHaystack(s).includes(n));
}

function formatStoryType(s: StoryPoint): string {
  if (s.hasVideo) return 'video';
  if (s.hasAudio) return 'audio';
  if (s.body || s.hasText) return 'texto';
  if (s.imageUrl || (s.photos?.length ?? 0) > 0) return 'foto';
  return 'texto';
}

function timeAgo(publishedAt: string | undefined): string {
  if (!publishedAt) return '';
  const diff = Date.now() - new Date(publishedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function StoryRow({
  story,
  isActive,
  onClick,
}: {
  story: StoryPoint;
  isActive: boolean;
  onClick: () => void;
}) {
  const tipo = formatStoryType(story);
  const ago = timeAgo(story.publishedAt);
  const cardShell = {
    borderRadius: 16,
    background: isActive
      ? 'linear-gradient(135deg, rgba(255, 69, 0, 0.42) 0%, rgba(255, 85, 25, 0.2) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)',
    backdropFilter: 'blur(14px) saturate(1.25)',
    WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
    border: `1px solid ${isActive ? 'rgba(255, 100, 45, 0.75)' : 'rgba(255,255,255,0.22)'}`,
    borderLeft: isActive ? '3px solid #ff4500' : '3px solid transparent',
    boxShadow: isActive
      ? 'inset 0 1px 0 rgba(255, 210, 160, 0.45), 0 0 14px rgba(255, 69, 0, 0.25)'
      : 'inset 0 1px 0 rgba(255,255,255,0.22)',
    transition: 'all 200ms ease',
    fontFamily: SITE_FONT_STACK,
    width: '100%' as const,
  };
  return (
    <div style={cardShell}>
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '15px 16px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        fontFamily: SITE_FONT_STACK,
        width: '100%',
      }}
    >
      <p style={{
        fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.80)',
        margin: '0 0 4px',
        lineHeight: 1.35,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {story.title ?? story.label}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          {[story.city, story.country].filter(Boolean).join(', ')}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {tipo}
          {ago ? ` · ${ago}` : ''}
        </span>
      </div>
    </button>
      {storyShowsDemoDisclaimer(story) ? (
        <div style={{ padding: '0 12px 12px' }}>
          <DemoStoryDisclosure story={story} variant="panel" />
        </div>
      ) : null}
    </div>
  );
}

export function StoriesPanel({
  stories,
  exploreQuery,
  onExploreQueryChange,
  onStoryFocus,
  highlightedStoryId,
  onContarMiHistoria,
  panelMode = 'stories',
}: StoriesPanelProps) {
  const isSearchPanel = panelMode === 'search';
  const qTrim = exploreQuery.trim();
  const searchMatches = useMemo(
    () => (isSearchPanel ? storiesMatchingQuery(stories, qTrim) : []),
    [isSearchPanel, stories, qTrim]
  );

  const showEmptyState = stories.length === 0 && !isSearchPanel;

  const hintBoxStyle = {
    padding: '20px 18px',
    textAlign: 'center' as const,
    background: 'linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)',
    backdropFilter: 'blur(22px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(22px) saturate(1.3)',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 90, 35, 0.92)', pointerEvents: 'none' }} />
          <input
            type="search"
            value={exploreQuery}
            onChange={(e) => onExploreQueryChange(e.target.value)}
            placeholder="Buscar por palabra clave"
            aria-label="Buscar historias por palabra clave"
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.32)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.1) 100%)',
              backdropFilter: 'blur(18px) saturate(1.35)',
              WebkitBackdropFilter: 'blur(18px) saturate(1.35)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.38)',
              color: '#fff',
              fontSize: 13,
              fontFamily: SITE_FONT_STACK,
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {isSearchPanel ? (
          !qTrim ? (
            <div style={hintBoxStyle}>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.88)',
                  margin: 0,
                  lineHeight: 1.55,
                  fontFamily: SITE_FONT_STACK,
                }}
              >
                Escribe palabras clave para buscar entre las historias del mapa (lugar, tema o texto).
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                  margin: '12px 0 0',
                  lineHeight: 1.45,
                  fontFamily: SITE_FONT_STACK,
                }}
              >
                Para ver el listado completo, usa la pestaña Historias.
              </p>
            </div>
          ) : searchMatches.length === 0 ? (
            <div style={hintBoxStyle}>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.85)',
                  margin: 0,
                  lineHeight: 1.5,
                  fontFamily: SITE_FONT_STACK,
                }}
              >
                No hay historias que coincidan con tu búsqueda.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff5f1a', margin: '4px 0 8px 4px', fontFamily: SITE_FONT_STACK }}>
                Resultados
              </p>
              {searchMatches.map((s, i) => (
                <StoryRow
                  key={s.id ?? i}
                  story={s}
                  isActive={highlightedStoryId === s.id}
                  onClick={() => onStoryFocus(s)}
                />
              ))}
            </>
          )
        ) : showEmptyState ? (
          <div style={{
            padding: '24px 20px',
            textAlign: 'center',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.1) 100%)',
            backdropFilter: 'blur(22px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.3)',
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.32)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
          }}>
            <p style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.85)',
              margin: '0 0 12px',
              lineHeight: 1.5,
              fontFamily: SITE_FONT_STACK,
            }}>
              Todavía no hay historias públicas aquí. Cuando aparezca la primera, se verá en el mapa.
            </p>
            {onContarMiHistoria && (
              <button
                type="button"
                onClick={onContarMiHistoria}
                style={{
                  padding: '12px 24px',
                  borderRadius: 999,
                  background: 'linear-gradient(180deg, #ff5f1a 0%, #ff4500 100%)',
                  border: '1px solid rgba(255, 160, 100, 0.85)',
                  color: '#ffffff',
                  boxShadow: '0 6px 22px rgba(255, 69, 0, 0.5), inset 0 1px 0 rgba(255, 200, 160, 0.35)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: SITE_FONT_STACK,
                  transition: 'all 200ms ease',
                }}
              >
                Contar mi historia
              </button>
            )}
          </div>
        ) : (
          <>
            <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff5f1a', margin: '4px 0 8px 4px', fontFamily: SITE_FONT_STACK }}>
              Últimas historias
            </p>
            {stories.map((s, i) => (
              <StoryRow
                key={s.id ?? i}
                story={s}
                isActive={highlightedStoryId === s.id}
                onClick={() => onStoryFocus(s)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
