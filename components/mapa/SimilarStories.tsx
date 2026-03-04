'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SimilarStory = {
  id: string;
  title: string;
  label: string;
  description: string;
  city: string | null;
  country: string | null;
  format: string;
};

const FORMAT_ICON: Record<string, string> = {
  audio: '🎙',
  video: '🎬',
  text: '✍️',
};

export function SimilarStories({ storyId }: { storyId: string }) {
  const router = useRouter();
  const [stories, setStories] = useState<SimilarStory[]>([]);

  useEffect(() => {
    fetch(`/api/stories/${storyId}/similar`)
      .then((r) => r.json())
      .then((d: { similar: SimilarStory[] }) => setStories(d.similar ?? []))
      .catch(() => {});
  }, [storyId]);

  if (stories.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 48,
        paddingTop: 40,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
          marginBottom: 20,
          fontFamily: "'Avenir Light', Avenir, sans-serif",
        }}
      >
        También podría resonar contigo
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
        }}
      >
        {stories.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => router.push(`/mapa/historias/${s.id}`)}
            style={{
              textAlign: 'left',
              padding: '18px 20px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              transition: 'all 250ms ease',
              fontFamily: "'Avenir Light', Avenir, sans-serif",
              animation: `storyFadeIn 500ms ease-out ${i * 100}ms both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{FORMAT_ICON[s.format] ?? '📖'}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.88)',
                  lineHeight: 1.2,
                }}
              >
                {s.title.length > 45 ? s.title.slice(0, 45) + '…' : s.title}
              </span>
            </div>
            {s.description && (
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.40)',
                  margin: '0 0 8px',
                  lineHeight: 1.5,
                }}
              >
                {s.description.length > 80 ? s.description.slice(0, 80) + '…' : s.description}
              </p>
            )}
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.25)',
                margin: 0,
              }}
            >
              {[s.city, s.country].filter(Boolean).join(', ') || '—'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
