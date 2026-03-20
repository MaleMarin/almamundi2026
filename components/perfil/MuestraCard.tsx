'use client';

import type { Muestra } from '@/lib/almamundi/perfil-queries';

const SH_DARK = 'rgba(163,177,198,0.6)';
const SH_LIGHT = 'rgba(255,255,255,0.85)';
const ORANGE = '#ff6b2b';
const TEXT_1 = '#1a2332';
const TEXT_3 = '#8896a5';

type Props = {
  muestra: Muestra;
  onClick?: () => void;
};

export function MuestraCard({ muestra, onClick }: Props) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => onClick && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}
      style={{
        background: '#e8ecf0',
        boxShadow: `5px 5px 12px ${SH_DARK}, -3px -3px 8px ${SH_LIGHT}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = `8px 8px 18px ${SH_DARK}, -4px -4px 12px ${SH_LIGHT}`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = `5px 5px 12px ${SH_DARK}, -3px -3px 8px ${SH_LIGHT}`;
      }}
    >
      {/* Cover 85px */}
      <div style={{ height: 85, position: 'relative', overflow: 'hidden' }}>
        {muestra.portadaUrl ? (
          <img
            src={muestra.portadaUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.7)',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #1a2332 0%, #2d3748 100%)',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            top: 'auto',
            height: '60%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: 10,
            fontFamily: 'Jost, sans-serif',
            fontWeight: 200,
            fontSize: '0.6rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {muestra.historiasCount} historias
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '0.65rem 0.85rem 0.75rem' }}>
        <h3
          style={{
            margin: 0,
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: '0.88rem',
            color: TEXT_1,
          }}
        >
          {muestra.titulo}
        </h3>
        <div
          style={{
            height: 1,
            background: 'rgba(163,177,198,0.25)',
            margin: '4px 0',
          }}
        />
        <span
          style={{
            display: 'block',
            fontSize: '0.58rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: ORANGE,
            marginBottom: 2,
          }}
        >
          Por qué esta muestra
        </span>
        <p
          style={{
            margin: 0,
            fontSize: '0.68rem',
            fontWeight: 300,
            color: TEXT_3,
            fontStyle: 'italic',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {muestra.sentido}
        </p>
      </div>
    </div>
  );
}
