'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPublishedAtEsStable } from '@/lib/historias/format-published-es-stable';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { formatPublicName, formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { storyReaderPath } from '@/lib/historias/story-json-ld';
import { neu } from '@/lib/historias-neumorph';
import { SITE_FONT_STACK } from '@/lib/typography';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { formatPagesCopy, type FormatPagesCopy } from '@/lib/historias/format-pages-copy';

type SimilarStory = {
  id: string;
  title: string;
  label: string;
  description: string;
  city: string | null;
  country: string | null;
  format: string;
  publishedAt: string | null;
};

function formatLabel(format: string, copy: FormatPagesCopy): string {
  const key = format.toLowerCase();
  if (key === 'audio') return copy.formatAudio;
  if (key === 'video') return copy.formatVideo;
  if (key === 'text' || key === 'texto' || key === 'escrito') return copy.formatText;
  if (key === 'image' || key === 'foto' || key === 'photo') return copy.formatPhoto;
  return copy.formatStory;
}

function authorAndDateLine(label: string, publishedAt: string | null, anonymous: string, locale: AlmaLocale): string {
  const name = formatPublicName(label) || anonymous;
  if (!publishedAt) return name;
  const date = formatPublishedAtEsStable(publishedAt, locale);
  if (!date || date === '—') return name;
  return `${name} · ${date}`;
}

/** Corta en el último espacio dentro de `maxChars`, sin partir una palabra. */
function truncateAtWord(text: string, maxChars: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= maxChars) return t;
  const limited = t.slice(0, maxChars);
  const lastSpace = limited.lastIndexOf(' ');
  const cut = (lastSpace > 0 ? limited.slice(0, lastSpace) : limited).trimEnd();
  return `${cut}…`;
}

type SimilarStoriesProps = {
  storyId: string;
  variant?: 'light' | 'dark';
};

export function SimilarStories({ storyId, variant = 'dark' }: SimilarStoriesProps) {
  const { locale } = useHomeLocale();
  const copy = formatPagesCopy(locale);
  const [stories, setStories] = useState<SimilarStory[]>([]);
  const light = variant === 'light';

  useEffect(() => {
    fetch(`/api/stories/${storyId}/similar`)
      .then((r) => r.json())
      .then((d: { similar: SimilarStory[] }) => setStories(d.similar ?? []))
      .catch(() => {});
  }, [storyId]);

  if (stories.length === 0) return null;

  return (
    <div
      className="am-related-stories"
      data-related-stories
      data-related-variant={variant}
      style={{
        marginTop: light ? 28 : 48,
        paddingTop: light ? 24 : 40,
        textAlign: 'left',
        borderTop: light ? `1px solid rgba(120,110,100,0.28)` : '1px solid rgba(255,255,255,0.06)' }}
    >
      <p
        style={{
          fontSize: 'var(--fs-etiqueta)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: light ? neu.textBody : 'rgba(255,255,255,0.28)',
          marginBottom: 20,
          fontFamily: SITE_FONT_STACK,
          fontWeight: 600 }}
      >
        {copy.related}
      </p>

      <div className="am-related-stories-grid">
        {stories.map((s, i) => (
          <Link
            key={s.id}
            href={storyReaderPath(s.id, s.format)}
            className="am-related-stories-card"
            style={{
              textAlign: 'left',
              borderRadius: 18,
              background: light ? '#FBFAF8' : 'rgba(255,255,255,0.04)',
              border: light ? '1px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: light
                ? '10px 10px 20px rgba(120,110,100,0.28), -8px -8px 16px rgba(255,255,255,0.85)'
                : undefined,
              cursor: 'pointer',
              transition: 'transform 250ms ease, box-shadow 250ms ease',
              fontFamily: SITE_FONT_STACK,
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              animation: `storyFadeIn 500ms ease-out ${i * 100}ms both` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                className="am-related-stories-format"
                style={{
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: light ? 'var(--almamundi-orange)' : 'rgba(var(--almamundi-orange-rgb), 0.85)' }}
              >
                {formatLabel(s.format, copy)}
              </span>
              <span
                className="am-related-stories-title"
                style={{
                  fontWeight: 600,
                  color: light ? neu.textMain : 'rgba(255,255,255,0.88)',
                  lineHeight: 1.25 }}
              >
                {truncateAtWord(s.title, 45)}
              </span>
            </div>
            {s.description && (
              <p
                className="am-related-stories-desc"
                style={{
                  color: light ? neu.textBody : 'rgba(255,255,255,0.40)',
                  margin: '0 0 8px',
                  lineHeight: 1.5 }}
              >
                {truncateAtWord(s.description, 80)}
              </p>
            )}
            {formatPublicPlace(s.city, s.country, locale) ? (
            <p
              style={{
                fontSize: 'var(--fs-etiqueta)',
                color: light ? neu.textBody : 'rgba(255,255,255,0.25)',
                margin: 0 }}
            >
              {formatPublicPlace(s.city, s.country, locale)}
            </p>
            ) : null}
            <p
              style={{
                fontSize: 'var(--fs-etiqueta)',
                color: light ? neu.textBody : 'rgba(255,255,255,0.25)',
                margin: '4px 0 0' }}
            >
              {authorAndDateLine(s.label, s.publishedAt ?? null, copy.anonymous, locale)}
            </p>
          </Link>
        ))}
      </div>
      <style>{`
        .am-related-stories { width: 100%; }
        .am-related-stories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .am-related-stories-card { padding: 18px 20px; }
        .am-related-stories-format { font-size: var(--fs-etiqueta); }
        .am-related-stories-title { font-size: var(--fs-etiqueta); }
        .am-related-stories-desc { font-size: var(--fs-etiqueta); }
        @media (min-width: 640px) {
          .am-related-stories[data-related-variant="light"] {
            width: min(1160px, calc(100vw - 2.5rem));
            max-width: min(1160px, calc(100vw - 2.5rem));
            margin-left: calc(50% - min(580px, 50vw - 1.25rem));
          }
          .am-related-stories-grid {
            grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
            gap: 18px;
          }
          .am-related-stories-card { padding: 24px 26px; }
          .am-related-stories-format { font-size: var(--fs-etiqueta); }
          .am-related-stories-title { font-size: var(--fs-pequeno); }
          .am-related-stories-desc { font-size: var(--fs-pequeno); }
        }
      `}</style>
    </div>
  );
}
