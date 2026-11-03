'use client';

import { useCallback, useMemo, useState } from 'react';
import { Play, Square, Minus, Plus } from 'lucide-react';
import { SITE_FONT_STACK } from '@/lib/typography';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { mapChrome } from '@/lib/i18n/map-chrome';
import {
  getAmbientOrPublicTrackVolume,
  setAmbientOrPublicTrackVolume } from '@/lib/sound/ambient';

const AMBIENT_OPTS = [
  { id: 'universo' as const, label: 'Universo', desc: '', place: 'Universo', country: '' },
  { id: 'mar' as const, label: 'Mar', desc: '', place: 'Mar', country: '' },
  { id: 'radio' as const, label: 'Radio', desc: '', place: 'Radio', country: '' },
  { id: 'lluvia' as const, label: 'Lluvia', desc: '', place: 'Lluvia', country: '' },
  { id: 'mercado' as const, label: 'Mercado', desc: '', place: 'Mercado', country: '' },
];

type SoundRowMood = (typeof AMBIENT_OPTS)[number];

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
  onVolumeChange }: {
  mood: SoundRowMood;
  isActive: boolean;
  isPlaying: boolean;
  volume01: number;
  onSelect: () => void;
  onVolumeChange: (v: number) => void;
}) {
  const pct = Math.round(volume01 * 100);
  const copy = mapChrome(useHomeLocale().locale);

  const step = (delta: number) => {
    onVolumeChange(Math.max(0, Math.min(1, volume01 + delta)));
  };

  return (
    <div
      style={{
        borderRadius: 16,
        background: isActive
          ? 'linear-gradient(135deg, rgba(255, 74, 28, 0.38) 0%, rgba(255, 74, 28, 0.18) 100%)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 100%)',
        backdropFilter: 'blur(14px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
        border: `1px solid ${isActive ? 'rgba(255, 110, 50, 0.72)' : 'rgba(255,255,255,0.22)'}`,
        borderLeft: isActive ? '3px solid #FF4A1C' : '3px solid transparent',
        boxShadow: isActive
          ? 'inset 0 1px 0 rgba(255, 200, 150, 0.4), 0 0 12px rgba(255, 74, 28, 0.22)'
          : 'inset 0 1px 0 rgba(255,255,255,0.2)',
        overflow: 'hidden',
        fontFamily: SITE_FONT_STACK,
        flexShrink: 0,
        minWidth: 0 }}
    >
      <button
        type="button"
        aria-pressed={isPlaying}
        onClick={onSelect}
        style={{
          textAlign: 'left',
          padding: '8px 16px',
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
          color: 'inherit' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 'var(--fs-pequeno)', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.4 }}>
            {mood.place}
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: isPlaying ? 'var(--almamundi-orange)' : 'rgba(255,255,255,0.12)',
            border: isPlaying ? '1px solid var(--almamundi-orange)' : '1px solid rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isPlaying ? '#ffffff' : 'rgba(255,255,255,0.6)' }}
          aria-hidden
        >
          {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} style={{ marginLeft: 2 }} />}
        </span>
      </button>

      <div
        className="flex items-center gap-2 px-4 pb-1 pt-0"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span className="sr-only">{copy.volumeOf} {mood.label}</span>
        <button
          type="button"
          aria-label={`${copy.volumeDown} ${mood.label}`}
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
          aria-label={`${copy.volumeOf} ${mood.label}: ${pct} ${copy.volumePercent}`}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          className="min-h-8 flex-1 cursor-pointer accent-orange-500"
          style={{ maxWidth: '100%' }}
        />
        <button
          type="button"
          aria-label={`${copy.volumeUp} ${mood.label}`}
          disabled={volume01 >= 1}
          onClick={() => step(0.05)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden />
        </button>
        <span
          className="w-9 shrink-0 text-right text-[length:var(--fs-etiqueta)] tabular-nums text-white/50"
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
  onToggleSound }: SoundsPanelProps) {
  const { locale } = useHomeLocale();
  const copy = mapChrome(locale);
  const ambientLabels: Record<(typeof AMBIENT_OPTS)[number]['id'], string> = {
    universo: copy.universo,
    mar: copy.mar,
    radio: copy.radio,
    lluvia: copy.lluvia,
    mercado: copy.mercado,
  };
  const soundCopy = {
    es: { on: 'Encendido', off: 'Apagado' },
    pt: { on: 'Ligado', off: 'Desligado' },
    en: { on: 'On', off: 'Off' },
  }[locale];
  const [volTick, setVolTick] = useState(0);

  const volumes = useMemo(() => {
    void volTick;
    const next: Record<string, number> = {};
    for (const m of AMBIENT_OPTS) {
      next[m.id] = getAmbientOrPublicTrackVolume(m.id);
    }
    return next;
  }, [volTick]);

  const handleVolume = useCallback((id: string, v: number) => {
    setAmbientOrPublicTrackVolume(id, v);
    setVolTick((t) => t + 1);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ flexShrink: 0, margin: '0 0 2px' }}>
        <p
          style={{
            fontSize: 'var(--fs-etiqueta)',
            color: 'rgba(248, 250, 255, 0.82)',
            lineHeight: 1.5,
            margin: 0,
            fontFamily: SITE_FONT_STACK }}
        >
          {copy.soundsIntro}
        </p>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? copy.soundOff : copy.soundOn}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: soundEnabled ? '1px solid rgba(255, 120, 60, 0.85)' : '1px solid rgba(255,255,255,0.22)',
            background: soundEnabled
              ? 'linear-gradient(180deg, rgba(255, 74, 28, 0.5) 0%, rgba(255, 74, 28, 0.28) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: soundEnabled ? '#ffffff' : 'rgba(255,255,255,0.55)',
            boxShadow: soundEnabled ? '0 0 16px rgba(255, 74, 28, 0.35), inset 0 1px 0 rgba(255, 200, 160, 0.35)' : 'inset 0 1px 0 rgba(255,255,255,0.2)',
            cursor: 'pointer',
            fontSize: 'var(--fs-etiqueta)',
            fontFamily: SITE_FONT_STACK,
            outline: 'none',
            transition: 'all 200ms ease' }}
        >
          {soundEnabled ? soundCopy.on : soundCopy.off}
        </button>
      </div>
      <p className="text-[length:var(--fs-etiqueta)] leading-snug text-white/40" style={{ fontFamily: SITE_FONT_STACK, margin: 0 }}>
        {copy.volumeHelp}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AMBIENT_OPTS.map((m) => (
          <SoundRow
            key={m.id}
            mood={{ ...m, label: ambientLabels[m.id], place: ambientLabels[m.id] }}
            isActive={currentMood === m.id}
            isPlaying={soundEnabled && currentMood === m.id}
            volume01={volumes[m.id] ?? 0.25}
            onSelect={() => {
              // Tocar un sonido lo hace sonar de inmediato; tocar el que suena lo detiene.
              if (currentMood === m.id) {
                onToggleSound();
                return;
              }
              onMoodChange(m.id);
              if (!soundEnabled) onToggleSound();
            }}
            onVolumeChange={(v) => handleVolume(m.id, v)}
          />
        ))}
      </div>
    </div>
  );
}
