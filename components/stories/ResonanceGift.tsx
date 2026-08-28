'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { hitsFromText } from '@/lib/huella/almamundi-lexicon';
import { drawVadResonanceOnCanvas } from '@/lib/huella/resonance-stripes';
import { STORY_GLOBE_COLOR_MIN_CHARS } from '@/lib/huella/story-globe-color';

const GIFT_PX = 640;

export function messageYieldsResonanceGift(text: string, locale: AlmaLocale): boolean {
  const t = text.trim();
  if (t.length < STORY_GLOBE_COLOR_MIN_CHARS) return false;
  return hitsFromText(t, locale).length > 0;
}

export function ResonanceGift({
  text,
  locale,
  canvasId = 'resonance-gift-canvas',
}: {
  text: string;
  locale: AlmaLocale;
  canvasId?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState('');

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = GIFT_PX;
    canvas.height = GIFT_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawVadResonanceOnCanvas(ctx, {
      storyId: 'resonance-gift',
      text,
      locale,
      footer: { at: new Date(), locale },
    });
  }, [text, locale]);

  const downloadPng = useCallback(() => {
    const canvas =
      (typeof document !== 'undefined'
        ? (document.getElementById(canvasId) as HTMLCanvasElement | null)
        : null) ?? canvasRef.current;
    if (!canvas) return;
    try {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'almamundi-tu-eco.png';
      a.click();
      setErr('');
    } catch {
      setErr('No se pudo descargar en este navegador.');
    }
  }, [canvasId]);

  return (
    <div className="mt-4 space-y-3">
      <div className="mx-auto overflow-hidden rounded-xl border border-white/15 shadow-inner">
        <canvas
          ref={canvasRef}
          id={canvasId}
          className="mx-auto block h-auto w-full max-w-[240px]"
          aria-label="Pieza visual de tu mensaje"
        />
      </div>
      {err ? (
        <p className="text-center text-xs text-amber-200/90" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="button"
        onClick={downloadPng}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/35 bg-white/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/25"
      >
        <Download size={16} aria-hidden />
        Descargar
      </button>
    </div>
  );
}
