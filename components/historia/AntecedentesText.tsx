'use client';

import { splitTextWithSafeHttpUrls } from '@/lib/safe-external-href';
import { SITE_FONT_STACK } from '@/lib/typography';

type AntecedentesTextProps = {
  value?: string;
  tone?: 'light' | 'dark';
};

/**
 * Muestra `antecedentes` como texto React, con URLs http(s) convertidas en links.
 * No usa HTML crudo.
 */
export function AntecedentesText({ value, tone = 'light' }: AntecedentesTextProps) {
  const text = value?.trim();
  if (!text) return null;

  const isDark = tone === 'dark';
  const parts = splitTextWithSafeHttpUrls(text);

  return (
    <p
      style={{
        fontFamily: SITE_FONT_STACK,
        fontWeight: 400,
        fontSize: isDark ? '0.88rem' : '0.95rem',
        lineHeight: 1.55,
        margin: isDark ? '0.85rem 0 0' : '0 0 1rem',
        maxWidth: '36rem',
        color: isDark ? 'rgba(245, 240, 232, 0.72)' : 'inherit',
        textAlign: 'inherit',
      }}
    >
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <a
            key={`a-${i}`}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            style={{
              color: isDark ? 'rgba(255, 180, 140, 0.95)' : '#FF4A1C',
              textDecoration: 'underline',
              wordBreak: 'break-word',
            }}
          >
            {part.value}
          </a>
        ) : (
          <span key={`t-${i}`}>{part.value}</span>
        )
      )}
    </p>
  );
}
