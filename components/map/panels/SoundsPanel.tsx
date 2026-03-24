'use client';

import { useCallback, useEffect, useState } from 'react';
import { Play, Square, Minus, Plus } from 'lucide-react';
import { SITE_FONT_STACK } from '@/lib/typography';
import type { AmbientKey } from '@/lib/sound/ambient';
import { getAmbientTrackVolume, setAmbientTrackVolume } from '@/lib/sound/ambient';

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
  volume01,
  onSelect,
  onVolumeChange,
}: {
  mood: (typeof AMBIENT_OPTS)[number];
  isActive: boolean;
  isPlaying: boolean;
  volume01: number;
  onSelect: () => void;
  onVolumeChange: (v: number) => void;
}) {
  const pct = Math.round(volume01 * 100);

  const step = (delta: number) => {
    onVolumeChange(Math.max(0, Math.min(1, volume01 + delta)));
  };

  return (
    <div
      style={{
        borderRadius: 14,
        background: isActive ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderLeft: isActive ? '3px solid rgba(96,165,250,0.6)' : '3px solid transparent',
        overflow: 'hidden',
        fontFamily: SITE_FONT_STACK,
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        style={{
          textAlign: 'left',
          padding: '14px 16px',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          width: '100%',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'transparent',
          border: 'none',
          color: 'inherit',
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
          aria-hidden
        >
          {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} style={{ marginLeft: 2 }} />}
        </span>
      </button>

      <div
        className="flex items-center gap-2 px-4 pb-3 pt-0"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span className="sr-only">Volumen de {mood.label}</span>
        <button
          type="button"
          aria-label={`Bajar volumen de ${mood.label}`}
          disabled={volume01 <= 0}
          onClick={() => step(-0.05)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          <Minus size={16} strokeWidth={2.5} aria-hidden />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          aria-label={`Volumen de ${mood.label}: ${pct} por ciento`}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          className="min-h-[44px] flex-1 cursor-pointer accent-orange-500"
          style={{ maxWidth: '100%' }}
        />
        <button
          type="button"
          aria-label={`Subir volumen de ${mood.label}`}
          disabled={volume01 >= 1}
          onClick={() => step(0.05)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden />
        </button>
        <span
          className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/50"
          aria-hidden
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

export function SoundsPanel({
  currentMood,
  onMoodChange,
  soundEnabled,
  onToggleSound,
}: SoundsPanelProps) {
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  const refreshVolumes = useCallback(() => {
    const next: Record<string, number> = {};
    for (const m of AMBIENT_OPTS) {
      next[m.id] = getAmbientTrackVolume(m.id as AmbientKey);
    }
    setVolumes(next);
  }, []);

  useEffect(() => {
    refreshVolumes();
  }, [refreshVolumes]);

  const handleVolume = useCallback(
    (id: string, v: number) => {
      setAmbientTrackVolume(id as AmbientKey, v);
      setVolumes((prev) => ({ ...prev, [id]: v }));
    },
    []
  );

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
      <p className="text-[11px] leading-snug text-white/40" style={{ fontFamily: SITE_FONT_STACK, margin: 0 }}>
        Cada ambiente tiene su volumen guardado en este dispositivo. Ajustá con la barra o con − / +.
      </p>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin' }}>
        {AMBIENT_OPTS.map((m) => (
          <SoundRow
            key={m.id}
            mood={m}
            isActive={currentMood === m.id}
            isPlaying={soundEnabled && currentMood === m.id}
            volume01={volumes[m.id] ?? 1}
            onSelect={() => onMoodChange(m.id)}
            onVolumeChange={(v) => handleVolume(m.id, v)}
          />
        ))}
      </div>
    </div>
  );
}
