'use client';

import { Volume2, VolumeX } from 'lucide-react';

type MapTopControlsProps = {
  soundEnabled: boolean;
  onToggleSound: () => void;
  hidden?: boolean;
  /** En home embebido: colocar arriba del mapa (debajo del header) */
  embedded?: boolean;
  /** En full page: top en px para alinear con la franja del dock */
  topOffset?: number;
  /** z-index del navbar flotante (full page) */
  navbarZIndex?: number;
};

const NEO_BG = 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)';
const NEO_RAISED = '4px 4px 10px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.04)';
const NEO_PRESSED = 'inset 2px 2px 5px rgba(0,0,0,0.35)';

export function MapTopControls({ soundEnabled, onToggleSound, hidden, embedded, topOffset, navbarZIndex }: MapTopControlsProps) {
  if (hidden) return null;

  const topPx = topOffset ?? 20;
  const positionStyle = embedded
    ? { position: 'absolute' as const, top: 20, right: 20 }
    : { position: 'fixed' as const, top: topPx, right: 20 };

  /** Misma escala que DockButtonLight en HomeMap (min-h 52px → sm 56px); forma circular como pills. */
  const iconSize = embedded ? 22 : 24;

  return (
    <div
      style={{
        ...positionStyle,
        zIndex: navbarZIndex ?? 22,
      }}
    >
      <button
        type="button"
        onClick={onToggleSound}
        title={soundEnabled ? 'Cortar sonido del universo' : 'Activar sonido del universo'}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? 'Desactivar sonido ambiente' : 'Activar sonido ambiente'}
        className={
          embedded
            ? 'shrink-0 rounded-full border border-solid border-white/10 h-[52px] w-[52px] sm:h-14 sm:w-14 active:scale-[0.98]'
            : 'rounded-[14px] border border-solid border-white/10 h-12 w-12'
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: soundEnabled ? '1px solid rgba(249,115,22,0.5)' : undefined,
          background: soundEnabled
            ? 'linear-gradient(145deg, rgba(249,115,22,0.45) 0%, rgba(249,115,22,0.22) 100%)'
            : NEO_BG,
          color: soundEnabled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 200ms ease',
          boxShadow: soundEnabled ? NEO_PRESSED : NEO_RAISED,
        }}
      >
        {soundEnabled ? <Volume2 size={iconSize} /> : <VolumeX size={iconSize} />}
      </button>
    </div>
  );
}
