/**
 * Resonancia visual por franjas verticales de borde duro.
 * Palabras del relato → léxico AlmaMundi → VAD → HSL.
 */

import type { AlmaLocale } from '@/lib/i18n/locale';
import { seedFn, seededRnd, formatHuellaImprintFooterLine } from '@/lib/huella/huellaV2';
import { hitsFromText, type LexiconHit } from '@/lib/huella/almamundi-lexicon';
import {
  colorizeVadHits,
  expandSparseVadColors,
  hslCss,
  stripeWidthForCounts,
  type ColorizedVadHit,
} from '@/lib/huella/vad-color';

export const RESONANCE_BG = '#F7F4EE';
export const RESONANCE_STRIPE_MIN_PX = 8;
export const RESONANCE_STRIPE_MAX_PX = 60;

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

type StripeUnit = ColorizedVadHit<LexiconHit> & { width: number; hex: string };

function orderForContrast(units: StripeUnit[]): StripeUnit[] {
  if (units.length <= 2) return units;
  const leftover = [...units];
  const out: StripeUnit[] = [leftover.shift()!];
  while (leftover.length) {
    const prev = out[out.length - 1]!.h;
    leftover.sort((a, b) => hueDist(b.h, prev) - hueDist(a.h, prev));
    out.push(leftover.shift()!);
  }
  return out;
}

function fallbackHits(storyId: string): LexiconHit[] {
  const S = seedFn(storyId);
  const seeds: LexiconHit[] = [
    { lemma: 'casa', lang: 'es', v: 0.64, a: 0.32, d: 0.52, count: 1 },
    { lemma: 'camino', lang: 'es', v: 0.42, a: 0.48, d: 0.44, count: 1 },
    { lemma: 'memoria', lang: 'es', v: 0.7, a: 0.55, d: 0.48, count: 1 },
    { lemma: 'fuego', lang: 'es', v: 0.4, a: 0.82, d: 0.55, count: 1 },
    { lemma: 'agua', lang: 'es', v: 0.6, a: 0.38, d: 0.54, count: 1 },
    { lemma: 'noche', lang: 'es', v: 0.52, a: 0.34, d: 0.5, count: 1 },
  ];
  const n = 4;
  const used = new Set<number>();
  const hits: LexiconHit[] = [];
  for (let i = 0; i < n; i++) {
    let idx = Math.floor(seededRnd(S, 80 + i) * seeds.length);
    let guard = 0;
    while (used.has(idx) && guard < 12) {
      idx = (idx + 1) % seeds.length;
      guard += 1;
    }
    used.add(idx);
    const s = seeds[idx]!;
    hits.push({ ...s, count: 1 + Math.floor(seededRnd(S, 120 + i) * 3) });
  }
  return hits;
}

export type DrawVadResonanceArgs = {
  storyId: string;
  text: string;
  locale: AlmaLocale;
  footerAt?: Date;
};

export function drawVadResonanceOnCanvas(ctx: CanvasRenderingContext2D, args: DrawVadResonanceArgs): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const hitsRaw = hitsFromText(args.text, args.locale);
  const hits = hitsRaw.length > 0 ? hitsRaw : fallbackHits(args.storyId);
  const colored = expandSparseVadColors(colorizeVadHits(hits));
  const counts = colored.map((h) => h.count);
  const units = orderForContrast(
    colored.map((h) => ({
      ...h,
      width: stripeWidthForCounts(h.count, counts, RESONANCE_STRIPE_MIN_PX, RESONANCE_STRIPE_MAX_PX),
      hex: hslCss(h.h, h.s, h.l),
    }))
  );

  ctx.imageSmoothingEnabled = false;
  (ctx as CanvasRenderingContext2D & { webkitImageSmoothingEnabled?: boolean }).webkitImageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = RESONANCE_BG;
  ctx.fillRect(0, 0, W, H);

  const footerH = args.footerAt ? Math.round(H * 0.09) : 0;
  const fieldH = H - footerH;

  let x = 0;
  let repeat = 0;
  while (x < W && repeat < 400) {
    for (let u = 0; u < units.length; u++) {
      const unit = units[u]!;
      let stripeW = unit.width;
      const xi = Math.round(x);
      if (xi + stripeW > W) stripeW = W - xi;
      stripeW = Math.max(0, Math.round(stripeW));
      if (stripeW <= 0) break;
      ctx.fillStyle = unit.hex;
      ctx.fillRect(xi, 0, stripeW, fieldH);
      x = xi + stripeW;
      if (x >= W) break;
    }
    repeat += 1;
  }

  if (args.footerAt && footerH > 0) {
    const line = formatHuellaImprintFooterLine(args.footerAt);
    ctx.fillStyle = RESONANCE_BG;
    ctx.fillRect(0, fieldH, W, footerH);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, fieldH);
    ctx.lineTo(W, fieldH);
    ctx.stroke();
    ctx.fillStyle = '#8A8A7A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const px = Math.max(11, Math.round(W * 0.014));
    ctx.font = `400 ${px}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(line, W / 2, fieldH + footerH * 0.55);
  }
}
