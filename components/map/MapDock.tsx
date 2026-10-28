'use client';

import type { CSSProperties } from 'react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { PREGUNTA_UI } from '@/lib/pregunta-semana';

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
  minWidth: 108,
  minHeight: 56,
  maxWidth: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '10px 12px',
  fontSize: 13,
  lineHeight: 1.2,
  fontFamily: 'inherit',
  fontWeight: 600,
  whiteSpace: 'normal',
};

export function MapDock({ activeMode, onModeChange, onResetView, hidden, drawerOpen, embedded, topOffset, navbarZIndex }: MapDockProps) {
  const { locale } = useHomeLocale();
  if (hidden) return null;
  const topPx = topOffset ?? (drawerOpen ? 8 : 24);
  const dockZ = navbarZIndex ?? 25;
  const positionStyle: CSSProperties = embedded
    ? { position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 25 }
    : { position: 'fixed', top: topPx, left: '50%', transform: 'translateX(-50%)', zIndex: dockZ };

  /** Orden: capas del globo juntas, luego Sonidos, luego búsqueda. */
  const buttons: { mode: MapDockMode; label: string }[] = [
    { mode: 'stories', label: 'Historias' },
    { mode: 'bits', label: 'También cuenta' },
    { mode: 'news', label: PREGUNTA_UI.tab[locale] },
    { mode: 'sounds', label: 'Sonidos' },
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
            className="btn-am-neutro"
            onClick={() => onModeChange(mode)}
            aria-pressed={isActive}
            style={baseBtnStyle}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
