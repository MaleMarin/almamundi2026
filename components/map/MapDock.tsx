'use client';

import type { CSSProperties } from 'react';

export type MapDockMode = 'stories' | 'news' | 'sounds' | 'bits' | 'search';

type MapDockProps = {
  activeMode: MapDockMode;
  onModeChange: (mode: MapDockMode) => void;
  onResetView: () => void;
  hidden?: boolean;
  drawerOpen?: boolean;
  embedded?: boolean;
  /** En full page: top en px (navbar flotante sobre el globo) */
  topOffset?: number;
  /** z-index del navbar flotante (full page) */
  navbarZIndex?: number;
};

/** Franja (dock): pill neumórfico azul noche — estilos inline para que siempre se apliquen (sin depender del purge de Tailwind). */
const dockWrapperStyle: CSSProperties = {
  pointerEvents: 'auto',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'stretch',
  justifyContent: 'center',
  gap: 12,
  padding: '12px 14px',
  maxWidth: 'min(100vw - 24px, 960px)',
  width: '100%',
  borderRadius: 9999,
  background: 'rgba(10,18,32,0.42)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 18px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)',
  outline: '1px solid rgba(56,189,248,0.18)',
  outlineOffset: -1,
};

const baseBtnStyle: CSSProperties = {
  flex: '1 1 140px',
  minWidth: 120,
  minHeight: 56,
  maxWidth: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '12px 14px',
  borderRadius: 9999,
  fontSize: 15,
  lineHeight: 1.25,
  color: 'rgba(255,255,255,0.85)',
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 600,
  transition: 'background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  whiteSpace: 'normal',
};

const activeBtnStyle: CSSProperties = {
  borderColor: 'rgba(249,115,22,0.5)',
  boxShadow: '0 0 0 1px rgba(249,115,22,0.35), 0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)',
  outline: '1px solid rgba(249,115,22,0.55)',
  outlineOffset: -1,
  fontWeight: 600,
};

export function MapDock({ activeMode, onModeChange, onResetView, hidden, drawerOpen, embedded, topOffset, navbarZIndex }: MapDockProps) {
  if (hidden) return null;

  const topPx = topOffset ?? (drawerOpen ? 8 : 24);
  const dockZ = navbarZIndex ?? 25;
  const positionStyle: CSSProperties = embedded
    ? { position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 25 }
    : { position: 'fixed', top: topPx, left: '50%', transform: 'translateX(-50%)', zIndex: dockZ };

  /** Orden: Historias, Sonidos, Noticias, Bits, Buscar por palabras clave. */
  const buttons: { mode: MapDockMode; label: string }[] = [
    { mode: 'stories', label: 'Historias' },
    { mode: 'sounds', label: 'Sonidos' },
    { mode: 'news', label: 'Noticias en vivo' },
    { mode: 'bits', label: 'Bits' },
    { mode: 'search', label: 'Buscar por palabras clave' },
  ];

  return (
    <div style={{ ...positionStyle, ...dockWrapperStyle }}>
      {buttons.map(({ mode, label }) => {
        const isActive = activeMode === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            aria-pressed={isActive}
            aria-label={label}
            style={{
              ...baseBtnStyle,
              ...(isActive ? activeBtnStyle : {}),
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = baseBtnStyle.background as string;
              }
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
