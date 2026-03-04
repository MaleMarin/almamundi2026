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
};

const NEO_BG = 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)';
const NEO_RAISED = '4px 4px 10px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.04)';
const NEO_PRESSED = 'inset 2px 2px 5px rgba(0,0,0,0.35)';

export function MapTopControls({ soundEnabled, onToggleSound, hidden, embedded, topOffset }: MapTopControlsProps) {
  if (hidden) return null;

  const topPx = topOffset ?? 20;
  const positionStyle = embedded
    ? { position: 'absolute' as const, top: 20, right: 20 }
    : { position: 'fixed' as const, top: topPx, right: 20 };

  return (
    <div
      style={{
        ...positionStyle,
        zIndex: 22,
      }}
    >
      <button
        type="button"
        onClick={onToggleSound}
        title={soundEnabled ? 'Cortar sonido del universo' : 'Activar sonido del universo'}
        aria-label={soundEnabled ? 'Cortar sonido' : 'Activar sonido'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: 14,
          border: soundEnabled ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.08)',
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
        {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </div>
  );
}
