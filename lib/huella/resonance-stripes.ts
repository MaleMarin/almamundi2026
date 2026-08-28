/**
 * Resonancia visual por franjas verticales de borde duro.
 * Palabras del relato → léxico AlmaMundi → VAD → HSL.
 */

import type { AlmaLocale } from '@/lib/i18n/locale';
import { formatLongDate } from '@/lib/i18n/locale';
import { seedFn, seededRnd } from '@/lib/huella/huellaV2';
import { hitsFromText, type LexiconHit } from '@/lib/huella/almamundi-lexicon';
import {
  colorizeVadHits,
  expandSparseVadColors,
  hslCss,
  stripeWidthForCounts,
  type ColorizedVadHit,
  type VadTriple,
} from '@/lib/huella/vad-color';
import { blendHitsTowardVad, ecoBlendT } from '@/lib/huella/eco-vad';

export const RESONANCE_BG = '#F7F4EE';
export const RESONANCE_STRIPE_MIN_PX = 8;
export const RESONANCE_STRIPE_MAX_PX = 60;
export const RESONANCE_EXPORT_PX = 1080;
export const RESONANCE_FOOTER_SITE = 'almamundi.org';
const FOOTER_INK = '#8A8A7A';

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

export type ResonancePieceFooter = {
  at: Date;
  title?: string;
  city?: string;
  country?: string;
  locale: AlmaLocale;
};

export type DrawVadResonanceArgs = {
  storyId: string;
  text: string;
  locale: AlmaLocale;
  footer?: ResonancePieceFooter;
  /** Si no hay `footer`, pinta solo fecha + sitio (compatibilidad). */
  footerAt?: Date;
  /**
   * Promedio de resonancia (cinta del eco). No cambia las palabras del relato:
   * solo acerca poco a poco el color. Ausente = cinta del día de publicar.
   */
  ecoVad?: (VadTriple & { n: number }) | null;
};

function truncateCanvasLine(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  const ell = '…';
  let t = text.trim();
  while (t.length > 0 && ctx.measureText(t + ell).width > maxW) {
    t = t.slice(0, -1);
  }
  return t ? t + ell : ell;
}

function footerMetrics(W: number, H: number, hasTitle: boolean) {
  const padX = Math.round(W * 0.056);
  const padBottom = Math.round(H * 0.042);
  const padTop = Math.round(H * 0.028);
  const titlePx = Math.max(15, Math.round(W * 0.022));
  const metaPx = Math.max(12, Math.round(W * 0.015));
  const sitePx = Math.max(11, Math.round(W * 0.013));
  const gap = Math.max(4, Math.round(H * 0.008));
  const titleBlock = hasTitle ? titlePx + gap : 0;
  const height = padTop + titleBlock + metaPx + gap + sitePx + padBottom;
  return { padX, padBottom, padTop, titlePx, metaPx, sitePx, gap, height };
}

function drawResonancePieceFooter(
  ctx: CanvasRenderingContext2D,
  fieldH: number,
  footer: ResonancePieceFooter
): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const title = footer.title?.trim() ?? '';
  const m = footerMetrics(W, H, Boolean(title));
  const maxW = W - m.padX * 2;
  const place = [footer.city?.trim(), footer.country?.trim()].filter(Boolean).join(', ');
  const date = formatLongDate(footer.at, footer.locale);
  const meta = place ? `${place} · ${date}` : date;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = RESONANCE_BG;
  ctx.fillRect(0, fieldH, W, H - fieldH);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, fieldH);
  ctx.lineTo(W, fieldH);
  ctx.stroke();

  ctx.fillStyle = FOOTER_INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const fontStack = 'ui-sans-serif, system-ui, -apple-system, sans-serif';
  let y = fieldH + m.padTop;
  if (title) {
    y += m.titlePx;
    ctx.font = `400 ${m.titlePx}px ${fontStack}`;
    ctx.fillText(truncateCanvasLine(ctx, title, maxW), m.padX, y);
    y += m.gap;
  }
  y += m.metaPx;
  ctx.font = `400 ${m.metaPx}px ${fontStack}`;
  ctx.fillText(truncateCanvasLine(ctx, meta, maxW), m.padX, y);
  y += m.gap + m.sitePx;
  ctx.font = `400 ${m.sitePx}px ${fontStack}`;
  ctx.fillText(RESONANCE_FOOTER_SITE, m.padX, y);
  ctx.restore();
}

export function drawVadResonanceOnCanvas(ctx: CanvasRenderingContext2D, args: DrawVadResonanceArgs): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const hitsRaw = hitsFromText(args.text, args.locale);
  const hitsBase = hitsRaw.length > 0 ? hitsRaw : fallbackHits(args.storyId);
  const t = args.ecoVad && args.ecoVad.n > 0 ? ecoBlendT(args.ecoVad.n) : 0;
  const hits = t > 0 && args.ecoVad ? blendHitsTowardVad(hitsBase, args.ecoVad, t) : hitsBase;
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

  const footer: ResonancePieceFooter | null = args.footer
    ? args.footer
    : args.footerAt
      ? { at: args.footerAt, locale: args.locale }
      : null;
  const footerH = footer ? footerMetrics(W, H, Boolean(footer.title?.trim())).height : 0;
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

  if (footer) drawResonancePieceFooter(ctx, fieldH, footer);
}
