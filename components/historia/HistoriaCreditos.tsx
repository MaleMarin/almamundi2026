'use client';

import { AntecedentesText } from '@/components/historia/AntecedentesText';
import { CancionRelacionadaLine } from '@/components/historia/CancionRelacionadaLine';
import { SITE_FONT_STACK } from '@/lib/typography';

export type HistoriaCreditosProps = {
  nombre?: string;
  ubicacion?: string;
  antecedentes?: string;
  cancionRelacionada?: string;
  tone?: 'light' | 'dark';
};

/**
 * Orden fijo: nombre → ubicación → antecedentes → canción.
 * El título queda fuera, en cada página.
 */
export function HistoriaCreditos({
  nombre,
  ubicacion,
  antecedentes,
  cancionRelacionada,
  tone = 'light',
}: HistoriaCreditosProps) {
  const isDark = tone === 'dark';
  const nameColor = isDark ? 'rgba(245, 240, 232, 0.82)' : undefined;
  const placeColor = isDark ? 'rgba(245, 240, 232, 0.5)' : undefined;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        marginTop: isDark ? '1.15rem' : 0,
        marginBottom: isDark ? 0 : '1.15rem',
      }}
    >
      {nombre?.trim() ? (
        <p
          style={{
            fontFamily: SITE_FONT_STACK,
            fontWeight: isDark ? 300 : 500,
            fontSize: isDark ? '0.8rem' : '0.95rem',
            letterSpacing: isDark ? '0.2em' : undefined,
            textTransform: isDark ? 'uppercase' : undefined,
            margin: 0,
            color: nameColor,
          }}
        >
          {nombre}
        </p>
      ) : null}
      {ubicacion?.trim() ? (
        <p
          style={{
            fontFamily: SITE_FONT_STACK,
            fontWeight: isDark ? 300 : 400,
            fontSize: isDark ? '0.72rem' : '0.8rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: isDark ? '0.35rem 0 0' : '0.2rem 0 0',
            color: placeColor,
          }}
        >
          {ubicacion}
        </p>
      ) : null}
      <AntecedentesText value={antecedentes} tone={tone} />
      <CancionRelacionadaLine value={cancionRelacionada} tone={tone} />
    </div>
  );
}
