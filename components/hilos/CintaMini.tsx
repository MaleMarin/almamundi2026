'use client';

import { useLayoutEffect, useRef } from 'react';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { drawVadResonanceOnCanvas } from '@/lib/huella/resonance-stripes';

type CintaMiniProps = {
  storyId: string;
  text: string;
  locale: AlmaLocale;
};

/** Miniatura de las cintas de la historia. El lienzo es decorativo: el enlace lleva el título. */
export function CintaMini({ storyId, text, locale }: CintaMiniProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const width = 480;
    const height = 168;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawVadResonanceOnCanvas(ctx, {
      storyId,
      text: text.trim() || ' ',
      locale,
    });
  }, [storyId, text, locale]);

  return <canvas ref={ref} className="h-[88px] w-full" aria-hidden />;
}
