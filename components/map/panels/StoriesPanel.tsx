'use client';

import { Search } from 'lucide-react';
import type { StoryPoint } from '@/lib/map-data/stories';

export type StoriesPanelProps = {
  stories: StoryPoint[];
  exploreQuery: string;
  onExploreQueryChange: (q: string) => void;
  onStoryFocus: (s: StoryPoint) => void;
  highlightedStoryId: string | null;
  onContarMiHistoria?: () => void;
};

function StoryRow({
  story,
  isActive,
  onClick,
}: {
  story: StoryPoint;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '15px 16px',
        borderRadius: 14,
        background: isActive ? 'rgba(249,115,22,0.10)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(249,115,22,0.30)' : 'rgba(255,255,255,0.07)'}`,
        borderLeft: isActive ? '3px solid rgba(249,115,22,0.6)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        fontFamily: "'Avenir Light', Avenir, sans-serif",
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
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
        {[story.city, story.country].filter(Boolean).join(', ')}
      </p>
    </button>
  );
}

const isEmptyOrAllDemo = (stories: StoryPoint[]) =>
  stories.length === 0 || stories.every((s) => (s as StoryPoint & { isDemo?: boolean }).isDemo);

export function StoriesPanel({
  stories,
  exploreQuery,
  onExploreQueryChange,
  onStoryFocus,
  highlightedStoryId,
  onContarMiHistoria,
}: StoriesPanelProps) {
  const showEmptyState = isEmptyOrAllDemo(stories);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
          <input
            type="search"
            value={exploreQuery}
            onChange={(e) => onExploreQueryChange(e.target.value)}
            placeholder="Buscar por palabra clave"
            aria-label="Buscar historias por palabra clave"
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 13,
              fontFamily: "'Avenir Light', Avenir, sans-serif",
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
        {showEmptyState ? (
          <div style={{
            padding: '24px 20px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.85)',
              margin: '0 0 12px',
              lineHeight: 1.5,
              fontFamily: "'Avenir Light', Avenir, sans-serif",
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
                  background: 'rgba(249,115,22,0.2)',
                  border: '1px solid rgba(249,115,22,0.4)',
                  color: '#fdba74',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                  transition: 'all 200ms ease',
                }}
              >
                Contar mi historia
              </button>
            )}
          </div>
        ) : (
          <>
            <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '4px 0 8px 4px', fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
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
