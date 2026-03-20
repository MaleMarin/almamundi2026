'use client';

import { Play, Square } from 'lucide-react';
import { SITE_FONT_STACK } from '@/lib/typography';

const AMBIENT_OPTS = [
  { id: 'universo' as const, label: 'Universo', desc: 'Sonido del espacio', place: 'Espacio', country: '—' },
  { id: 'mar' as const, label: 'Mar', desc: 'Olas, calma', place: 'Océano', country: '—' },
  { id: 'ciudad' as const, label: 'Ciudad', desc: 'Urbano, presente', place: 'Ciudad', country: 'Varios' },
  { id: 'viento' as const, label: 'Viento', desc: 'Aire, naturaleza', place: 'Naturaleza', country: '—' },
  { id: 'radio' as const, label: 'Radios comunitarias', desc: 'Voces y transmisiones', place: 'Radio', country: '—' },
  { id: 'lluvia' as const, label: 'Lluvia en ciudades', desc: 'Lluvia en distintas ciudades', place: 'Lluvia', country: 'Varias ciudades' },
  { id: 'mercado' as const, label: 'Mercados', desc: 'Ambiente de mercado', place: 'Mercado', country: '—' },
];

export type SoundsPanelProps = {
  currentMood: string;
  onMoodChange: (m: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
};

function SoundRow({
  mood,
  isActive,
  isPlaying,
  onClick,
}: {
  mood: (typeof AMBIENT_OPTS)[number];
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 14,
        background: isActive ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderLeft: isActive ? '3px solid rgba(96,165,250,0.6)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        fontFamily: SITE_FONT_STACK,
        width: '100%',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: '0 0 4px', lineHeight: 1.4 }}>
          {mood.place}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          {mood.country} {mood.desc ? ` · ${mood.desc}` : ''}
        </p>
      </div>
      <span
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isPlaying ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isPlaying ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
        }}
        aria-label={isPlaying ? 'Detener' : 'Reproducir'}
      >
        {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} style={{ marginLeft: 2 }} />}
      </span>
    </button>
  );
}

export function SoundsPanel({
  currentMood,
  onMoodChange,
  soundEnabled,
  onToggleSound,
}: SoundsPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Cortar sonido' : 'Activar sonido'}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.15)',
            background: soundEnabled ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.06)',
            color: soundEnabled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: SITE_FONT_STACK,
            outline: 'none',
            transition: 'all 200ms ease',
          }}
        >
          {soundEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin' }}>
        {AMBIENT_OPTS.map((m) => (
          <SoundRow
            key={m.id}
            mood={m}
            isActive={currentMood === m.id}
            isPlaying={soundEnabled && currentMood === m.id}
            onClick={() => onMoodChange(m.id)}
          />
        ))}
      </div>
    </div>
  );
}
