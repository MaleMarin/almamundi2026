'use client';

import { useEffect, useRef, useState } from 'react';

const BAR_COUNT = 28;
const THROTTLE_MS = 48;
const ORANGE = '#ff6b35';
const ORANGE_SOFT = '#ffb399';
const ORANGE_DEEP = '#e63e00';
const BG = 'linear-gradient(180deg, #f0f3f8 0%, #e8ecf4 55%, #e0e5ec 100%)';

export type VoiceWaveformMode = 'idle' | 'listening' | 'recording' | 'stopped' | 'error';

type Props = {
  /** Micrófono en vivo; si es null, solo animación suave según `mode`. */
  mediaStream: MediaStream | null;
  mode: VoiceWaveformMode;
  className?: string;
};

function sampleFrequencyBars(analyser: AnalyserNode, mode: VoiceWaveformMode): number[] {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  try {
    analyser.getByteFrequencyData(dataArray);
  } catch {
    return Array.from({ length: BAR_COUNT }, () => 0.12);
  }
  const gain = mode === 'recording' ? 1.08 : 0.92;
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const t0 = (i / BAR_COUNT) ** 1.12;
    const t1 = ((i + 1) / BAR_COUNT) ** 1.12;
    const lo = Math.floor(t0 * bufferLength * 0.1);
    const hi = Math.min(bufferLength, Math.ceil(t1 * bufferLength * 0.9));
    let sum = 0;
    let n = 0;
    for (let j = lo; j < hi; j++) {
      sum += dataArray[j] ?? 0;
      n++;
    }
    const avg = n ? sum / n : 0;
    const norm = Math.min(1, Math.max(0.08, ((avg / 200) * gain) ** 0.7));
    out.push(norm);
  }
  return out;
}

/**
 * Ondas suaves reactivas al micrófono (o animación mínima en idle / error).
 * Estética clara, naranja AlmaMundi, sin “consola de estudio” oscura.
 */
export function VoiceWaveform({ mediaStream, mode, className = '' }: Props) {
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: BAR_COUNT }, () => 0.12));
  const phaseRef = useRef(0);
  const rafRef = useRef(0);
  const lastEmitRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;

    const useAnalyser =
      Boolean(mediaStream?.active) && (mode === 'listening' || mode === 'recording');

    const runAnalyser = () => {
      if (!mediaStream?.active || !mediaStream) return () => {};
      const AC =
        typeof window !== 'undefined' &&
        (window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (!AC) return;
      const ctx = new AC();
      ctxRef.current = ctx;
      let source: MediaStreamAudioSourceNode;
      let analyser: AnalyserNode;
      try {
        source = ctx.createMediaStreamSource(mediaStream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = mode === 'recording' ? 0.55 : 0.68;
        analyser.minDecibels = -92;
        analyser.maxDecibels = -24;
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch {
        void ctx.close().catch(() => {});
        ctxRef.current = null;
        return;
      }
      void ctx.resume().catch(() => {});

      const loop = (now: number) => {
        const a = analyserRef.current;
        if (!a) return;
        if (now - lastEmitRef.current >= THROTTLE_MS) {
          lastEmitRef.current = now;
          setLevels(sampleFrequencyBars(a, mode));
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(rafRef.current);
        try {
          source.disconnect();
          analyser.disconnect();
        } catch {
          /* noop */
        }
        analyserRef.current = null;
        void ctx.close().catch(() => {});
        ctxRef.current = null;
      };
    };

    const softIdle = mode === 'stopped' ? 0.35 : mode === 'error' ? 0.2 : 1;
    const runSoft = () => {
      const loop = (t: number) => {
        phaseRef.current = t * 0.0018;
        const ph = phaseRef.current;
        setLevels(
          Array.from({ length: BAR_COUNT }, (_, i) => {
            const wave =
              0.12 +
              0.08 * Math.sin(ph * 1.2 + i * 0.35) * softIdle +
              0.05 * Math.sin(ph * 2.1 + i * 0.22) * softIdle;
            return Math.min(0.45, Math.max(0.1, wave));
          })
        );
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    };

    if (
      useAnalyser &&
      typeof window !== 'undefined' &&
      (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) &&
      mediaStream
    ) {
      return runAnalyser();
    }
    return runSoft();
  }, [mediaStream, mode]);

  const label =
    mode === 'error'
      ? 'Sin señal de micrófono'
      : mode === 'recording'
        ? 'Tu voz en movimiento'
        : mode === 'listening'
          ? 'Te escuchamos'
          : mode === 'stopped'
            ? 'Grabación lista'
            : 'Listo cuando quieras';

  return (
    <div
      className={`relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/70 px-3 pb-3 pt-8 shadow-[inset_0_2px_12px_rgba(163,177,198,0.35)] ${className}`}
      style={{ background: BG }}
      role="img"
      aria-label={label}
    >
      <span
        className="absolute left-3 top-2.5 text-[11px] font-medium uppercase tracking-[0.14em]"
        style={{ color: '#8b92a8' }}
      >
        {label}
      </span>
      <div className="flex h-[5.5rem] items-end justify-center gap-[3px]">
        {levels.map((lvl, i) => {
          const h = Math.round(8 + lvl * 64);
          const warm = i % 5 === 0 ? ORANGE_DEEP : ORANGE;
          return (
            <div
              key={i}
              className="w-[5px] shrink-0 rounded-full"
              style={{
                height: `${h}px`,
                background: `linear-gradient(180deg, ${ORANGE_SOFT} 0%, ${warm} 55%, ${ORANGE_DEEP} 100%)`,
                opacity: 0.45 + lvl * 0.5,
                boxShadow: '0 1px 2px rgba(255,106,53,0.25)',
                transition: 'height 52ms ease-out, opacity 52ms ease-out',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
