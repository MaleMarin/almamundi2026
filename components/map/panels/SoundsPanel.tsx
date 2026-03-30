'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Play, Square, Minus, Plus } from 'lucide-react';
import { SITE_FONT_STACK } from '@/lib/typography';
import {
  dedupePublicAudioPaths,
  folderHintFromPublicPath,
  friendlyTitleFromPublicPath,
  publicAudioMoodIdFromPath,
} from '@/lib/public-audio-mood';
import {
  getAmbientOrPublicTrackVolume,
  setAmbientOrPublicTrackVolume,
} from '@/lib/sound/ambient';

const AMBIENT_OPTS = [
  { id: 'universo' as const, label: 'Universo', desc: 'Sonido del espacio', place: 'Espacio', country: '—' },
  { id: 'mar' as const, label: 'Mar', desc: 'Olas, calma', place: 'Océano', country: '—' },
  { id: 'ciudad' as const, label: 'Ciudad', desc: 'Urbano, presente', place: 'Ciudad', country: 'Varios' },
  { id: 'viento' as const, label: 'Viento', desc: 'Aire, naturaleza', place: 'Naturaleza', country: '—' },
  { id: 'radio' as const, label: 'Radios comunitarias', desc: 'Voces y transmisiones', place: 'Radio', country: '—' },
  { id: 'lluvia' as const, label: 'Lluvia en ciudades', desc: 'Lluvia en distintas ciudades', place: 'Lluvia', country: 'Varias ciudades' },
  { id: 'mercado' as const, label: 'Mercados', desc: 'Ambiente de mercado', place: 'Mercado', country: '—' },
];

type SoundRowMood = (typeof AMBIENT_OPTS)[number] | {
  id: string;
  label: string;
  desc: string;
  place: string;
  country: string;
};

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
  mood: SoundRowMood;
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
        borderRadius: 16,
        background: isActive
          ? 'linear-gradient(135deg, rgba(255, 69, 0, 0.38) 0%, rgba(255, 95, 30, 0.18) 100%)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 100%)',
        backdropFilter: 'blur(14px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
        border: `1px solid ${isActive ? 'rgba(255, 110, 50, 0.72)' : 'rgba(255,255,255,0.22)'}`,
        borderLeft: isActive ? '3px solid #ff4500' : '3px solid transparent',
        boxShadow: isActive
          ? 'inset 0 1px 0 rgba(255, 200, 150, 0.4), 0 0 12px rgba(255, 69, 0, 0.22)'
          : 'inset 0 1px 0 rgba(255,255,255,0.2)',
        overflow: 'hidden',
        fontFamily: SITE_FONT_STACK,
        flexShrink: 0,
        minWidth: 0,
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
            background: isPlaying ? 'rgba(255, 69, 0, 0.45)' : 'rgba(255,255,255,0.12)',
            border: isPlaying ? '1px solid rgba(255, 150, 80, 0.7)' : '1px solid rgba(255,255,255,0.18)',
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
  const [publicPaths, setPublicPaths] = useState<string[]>([]);
  const [publicListError, setPublicListError] = useState<string | null>(null);
  const [volTick, setVolTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public-audio')
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ paths?: string[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setPublicPaths(Array.isArray(data.paths) ? data.paths : []);
        setPublicListError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setPublicPaths([]);
        setPublicListError('No se pudo listar archivos en public.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const volumes = useMemo(() => {
    void volTick;
    const next: Record<string, number> = {};
    for (const m of AMBIENT_OPTS) {
      next[m.id] = getAmbientOrPublicTrackVolume(m.id);
    }
    for (const p of publicPaths) {
      const id = publicAudioMoodIdFromPath(p);
      next[id] = getAmbientOrPublicTrackVolume(id);
    }
    return next;
  }, [publicPaths, volTick]);

  const handleVolume = useCallback((id: string, v: number) => {
    setAmbientOrPublicTrackVolume(id, v);
    setVolTick((t) => t + 1);
  }, []);

  const publicPathsDeduped = useMemo(
    () => dedupePublicAudioPaths(publicPaths),
    [publicPaths]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Cortar sonido' : 'Activar sonido'}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: soundEnabled ? '1px solid rgba(255, 120, 60, 0.85)' : '1px solid rgba(255,255,255,0.22)',
            background: soundEnabled
              ? 'linear-gradient(180deg, rgba(255, 69, 0, 0.5) 0%, rgba(255, 85, 25, 0.28) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: soundEnabled ? '#ffffff' : 'rgba(255,255,255,0.55)',
            boxShadow: soundEnabled ? '0 0 16px rgba(255, 69, 0, 0.35), inset 0 1px 0 rgba(255, 200, 160, 0.35)' : 'inset 0 1px 0 rgba(255,255,255,0.2)',
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
      {publicListError ? (
        <p className="text-[11px] text-amber-200/80" style={{ fontFamily: SITE_FONT_STACK, margin: 0 }}>
          {publicListError}
        </p>
      ) : null}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
        }}
      >
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
        {publicPathsDeduped.length > 0 ? (
          <>
            <p
              className="text-[10px] uppercase tracking-wider text-white/35"
              style={{ fontFamily: SITE_FONT_STACK, margin: '10px 0 2px', flexShrink: 0 }}
            >
              Más sonidos (tu carpeta public)
            </p>
            <div
              className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2"
              style={{ alignContent: 'start' }}
            >
              {publicPathsDeduped.map((p) => {
                const id = publicAudioMoodIdFromPath(p);
                const title = friendlyTitleFromPublicPath(p);
                const row = {
                  id,
                  label: title,
                  desc: '',
                  place: title,
                  country: folderHintFromPublicPath(p),
                };
                return (
                  <div key={id} style={{ minWidth: 0 }} title={p}>
                    <SoundRow
                      mood={row}
                      isActive={currentMood === id}
                      isPlaying={soundEnabled && currentMood === id}
                      volume01={volumes[id] ?? 1}
                      onSelect={() => onMoodChange(id)}
                      onVolumeChange={(v) => handleVolume(id, v)}
                    />
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
