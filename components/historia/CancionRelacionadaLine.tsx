'use client';

import { parseCancionRelacionadaHref } from '@/lib/cancion-relacionada';
import { SITE_FONT_STACK } from '@/lib/typography';

type CancionRelacionadaLineProps = {
  value?: string;
  /** `dark` para intertítulo de video; `light` para lectores y cierre. */
  tone?: 'light' | 'dark';
};

/**
 * Muestra `cancionRelacionada` como link "Escuchar" o como texto.
 * No usa HTML crudo.
 */
export function CancionRelacionadaLine({ value, tone = 'light' }: CancionRelacionadaLineProps) {
  const text = value?.trim();
  if (!text) return null;

  const href = parseCancionRelacionadaHref(text);
  const isDark = tone === 'dark';
  const color = isDark ? 'rgba(245, 240, 232, 0.72)' : 'inherit';

  if (href) {
    return (
      <p
        style={{
          fontFamily: SITE_FONT_STACK,
          fontWeight: 500,
          fontSize: isDark ? '0.88rem' : '0.92rem',
          letterSpacing: isDark ? '0.06em' : undefined,
          margin: isDark ? '1.1rem 0 0' : '0 0 1rem',
          color,
        }}
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          style={{ color: isDark ? 'rgba(255, 180, 140, 0.95)' : '#FF4A1C', textDecoration: 'underline' }}
        >
          Escuchar
        </a>
      </p>
    );
  }

  return (
    <p
      style={{
        fontFamily: SITE_FONT_STACK,
        fontWeight: 400,
        fontSize: isDark ? '0.88rem' : '0.95rem',
        lineHeight: 1.5,
        margin: isDark ? '1.1rem 0 0' : '0 0 1rem',
        color,
      }}
    >
      Esta historia suena a: {text}
    </p>
  );
}
