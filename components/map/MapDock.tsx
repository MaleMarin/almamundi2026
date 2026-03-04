'use client';

export type MapDockMode = 'stories' | 'news' | 'sounds' | 'search';

type MapDockProps = {
  activeMode: MapDockMode;
  onModeChange: (mode: MapDockMode) => void;
  onResetView: () => void;
  hidden?: boolean;
  drawerOpen?: boolean;
  embedded?: boolean;
  /** En full page: top en px para quedar debajo del título "Mapa de AlmaMundi" */
  topOffset?: number;
};

/** Franja (dock): pill neumórfico azul noche — estilos inline para que siempre se apliquen (sin depender del purge de Tailwind). */
const dockWrapperStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  display: 'inline-flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 9999,
  background: 'rgba(10,18,32,0.42)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 18px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)',
  outline: '1px solid rgba(56,189,248,0.18)',
  outlineOffset: -1,
};

const baseBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 9999,
  fontSize: 14,
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
  fontWeight: 400,
  transition: 'background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  whiteSpace: 'nowrap',
  minWidth: 'min-content',
};

const activeBtnStyle: React.CSSProperties = {
  borderColor: 'rgba(249,115,22,0.5)',
  boxShadow: '0 0 0 1px rgba(249,115,22,0.35), 0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)',
  outline: '1px solid rgba(249,115,22,0.55)',
  outlineOffset: -1,
  fontWeight: 600,
};

export function MapDock({ activeMode, onModeChange, onResetView, hidden, drawerOpen, embedded, topOffset }: MapDockProps) {
  if (hidden) return null;

  const topPx = topOffset ?? (drawerOpen ? 8 : 24);
  const positionStyle: React.CSSProperties = embedded
    ? { position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 25 }
    : { position: 'fixed', top: topPx, left: '50%', transform: 'translateX(-50%)', zIndex: 25 };

  /** Orden: Historias, Sonidos, Noticias, Buscar por palabras clave. */
  const buttons: { mode: MapDockMode; label: string }[] = [
    { mode: 'stories', label: 'Historias' },
    { mode: 'sounds', label: 'Sonidos' },
    { mode: 'news', label: 'Noticias' },
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
