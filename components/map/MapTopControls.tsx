'use client';

import { Music, Volume2, VolumeX } from 'lucide-react';

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
  /** Abre el panel para cambiar el sonido de fondo. */
  onOpenSounds?: () => void;
  soundsLabel?: string;
};

const NEO_BG = 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)';
const NEO_RAISED = '4px 4px 10px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.04)';
const NEO_PRESSED = 'inset 2px 2px 5px rgba(0,0,0,0.35)';

export function MapTopControls({ soundEnabled, onToggleSound, hidden, embedded, topOffset, navbarZIndex, onOpenSounds, soundsLabel }: MapTopControlsProps) {
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10 }}
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
          border: soundEnabled ? '1px solid var(--almamundi-orange)' : undefined,
          background: soundEnabled ? 'var(--almamundi-orange)' : NEO_BG,
          color: soundEnabled ? '#ffffff' : 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 200ms ease',
          boxShadow: soundEnabled ? NEO_PRESSED : NEO_RAISED }}
      >
        {soundEnabled ? <Volume2 size={iconSize} /> : <VolumeX size={iconSize} />}
      </button>
      {onOpenSounds ? (
        <button
          type="button"
          onClick={onOpenSounds}
          title={soundsLabel}
          aria-label={soundsLabel}
          className="shrink-0 rounded-full border border-solid border-white/10 h-11 w-11 sm:h-12 sm:w-12 active:scale-[0.98]"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: NEO_BG,
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            boxShadow: NEO_RAISED }}
        >
          <Music size={iconSize - 4} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
