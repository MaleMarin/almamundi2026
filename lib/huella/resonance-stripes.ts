/**
 * Resonancia visual por franjas: conceptos del relato → color de paleta,
 * ancho por frecuencia, orden de aparición, recorte con el id del envío.
 */

import { seedFn, seededRnd } from '@/lib/huella/huellaV2';
import {
  RESONANCE_BG,
  RESONANCE_CANVAS_W,
  RESONANCE_CONCEPTS,
  RESONANCE_STRIPE_MAX_PX,
  RESONANCE_STRIPE_MIN_PX,
  resonanceConceptById,
  type ResonanceConcept,
} from '@/lib/huella/resonance-concepts';
import { foldResonanceToken, matchResonanceConcept } from '@/lib/huella/resonance-lexicon';
import { stripeWidthForCounts } from '@/lib/huella/vad-color';

const STOP = new Set([
  'de', 'la', 'el', 'en', 'y', 'a', 'que', 'los', 'las', 'un', 'una', 'con', 'por', 'del', 'al',
  'su', 'se', 'le', 'lo', 'me', 'te', 'nos', 'les', 'mi', 'tu', 'mis', 'tus', 'sus',
  'es', 'son', 'era', 'fue', 'ser', 'si', 'no', 'ya', 'muy', 'mas', 'pero', 'como',
  'este', 'esta', 'esto', 'estos', 'estas', 'para', 'todo', 'toda', 'hay', 'han',
  'sin', 'cuando', 'donde', 'cada', 'desde', 'hasta', 'sobre', 'entre', 'o', 'e', 'u',
  'porque', 'aunque', 'tambien', 'aqui', 'alli', 'asi', 'eso', 'esa', 'ese',
]);

export type ResonanceHit = {
  concept: ResonanceConcept;
  count: number;
};

export function tokenizeResonanceText(text: string): string[] {
  const folded = foldResonanceToken(text);
  if (!folded) return [];
  return folded.split(' ').filter((w) => w.length > 1 && !STOP.has(w));
}

/** Conceptos en orden de primera aparición, con cuántas veces salen. */
export function extractResonanceHits(text: string): ResonanceHit[] {
  const tokens = tokenizeResonanceText(text);
  const order: number[] = [];
  const counts = new Map<number, number>();
  let i = 0;
  while (i < tokens.length) {
    const hit = matchResonanceConcept(tokens, i);
    if (!hit) {
      i += 1;
      continue;
    }
    if (!counts.has(hit.id)) order.push(hit.id);
    counts.set(hit.id, (counts.get(hit.id) ?? 0) + 1);
    i += hit.consumed;
  }
  return order
    .map((id) => {
      const concept = resonanceConceptById(id);
      if (!concept) return null;
      return { concept, count: counts.get(id) ?? 1 };
    })
    .filter((h): h is ResonanceHit => h != null);
}

function clampStripeWidth(count: number, counts: number[]): number {
  return stripeWidthForCounts(count, counts, RESONANCE_STRIPE_MIN_PX, RESONANCE_STRIPE_MAX_PX);
}

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function hexHue(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b).h;
}

/** Saturación ≥ 60%, sin cremas lavados. */
export function ensureVividHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  let s = Math.max(0.6, Math.min(0.95, hsl.s));
  let l = Math.max(0.28, Math.min(0.62, hsl.l));
  if (hsl.s < 0.22 && hsl.l > 0.62) {
    s = 0.72;
    l = 0.48;
  }
  const rgb = hslToRgb(hsl.h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function orderForContrast<T extends { hex: string }>(units: T[]): T[] {
  if (units.length <= 2) return units;
  const leftover = [...units];
  const out: T[] = [leftover.shift()!];
  while (leftover.length) {
    const prev = hexHue(out[out.length - 1]!.hex);
    leftover.sort((a, b) => hueDist(hexHue(b.hex), prev) - hueDist(hexHue(a.hex), prev));
    out.push(leftover.shift()!);
  }
  return out;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return {
    r: hue(hh + 1 / 3) * 255,
    g: hue(hh) * 255,
    b: hue(hh - 1 / 3) * 255,
  };
}

/** Misma familia de color, otro tono. Nunca un hue al azar. Saturación alta. */
export function varyConceptTone(hex: string, seed: number, step: number): string {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const dl = (seededRnd(seed, step * 3 + 1) - 0.5) * 0.1;
  const ds = (seededRnd(seed, step * 3 + 2) - 0.5) * 0.08;
  const rgb = hslToRgb(
    hsl.h,
    Math.max(0.6, Math.min(0.95, hsl.s + ds)),
    Math.max(0.28, Math.min(0.62, hsl.l + dl))
  );
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

export function nearestResonanceConcept(hex: string): ResonanceConcept {
  const a = hexToRgb(hex);
  let best = RESONANCE_CONCEPTS[0]!;
  let bestD = Infinity;
  for (const c of RESONANCE_CONCEPTS) {
    const b = hexToRgb(c.hex);
    const d = (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function fallbackHitsFromSeed(storyId: string): ResonanceHit[] {
  const S = seedFn(storyId);
  const n = 4;
  const hits: ResonanceHit[] = [];
  const used = new Set<number>();
  for (let i = 0; i < n; i++) {
    let idx = Math.floor(seededRnd(S, 80 + i) * RESONANCE_CONCEPTS.length);
    let guard = 0;
    while (used.has(idx) && guard < 20) {
      idx = (idx + 1) % RESONANCE_CONCEPTS.length;
      guard += 1;
    }
    used.add(idx);
    const concept = RESONANCE_CONCEPTS[idx]!;
    hits.push({ concept, count: 1 + Math.floor(seededRnd(S, 120 + i) * 3) });
  }
  return hits;
}

export function hitsFromPhotoHexes(hexes: string[]): ResonanceHit[] {
  const order: number[] = [];
  const counts = new Map<number, number>();
  for (const hex of hexes) {
    const c = nearestResonanceConcept(hex);
    if (!counts.has(c.id)) order.push(c.id);
    counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
  }
  return order
    .map((id) => {
      const concept = resonanceConceptById(id);
      if (!concept) return null;
      return { concept, count: counts.get(id) ?? 1 };
    })
    .filter((h): h is ResonanceHit => h != null);
}

/** Colores dominantes de una imagen (navegador). */
export async function extractPhotoDominantHexes(file: File, maxColors = 7): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('img'));
      el.src = url;
    });
    const w = 48;
    const h = 48;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const buckets = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const a = data[i + 3] ?? 0;
      if (a < 80) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max > 245 && min > 230) continue;
      if (max < 18) continue;
      const qr = r >> 4;
      const qg = g >> 4;
      const qb = b >> 4;
      const key = `${qr},${qg},${qb}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, maxColors)
      .map(([key]) => {
        const [qr, qg, qb] = key.split(',').map(Number);
        return rgbToHex(((qr ?? 0) << 4) + 8, ((qg ?? 0) << 4) + 8, ((qb ?? 0) << 4) + 8);
      });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type DrawResonanceStripesArgs = {
  storyId: string;
  hits: ResonanceHit[];
  footerLine?: string;
};

export function drawResonanceStripes(
  ctx: CanvasRenderingContext2D,
  args: DrawResonanceStripesArgs
): void {
  const W = ctx.canvas.width || RESONANCE_CANVAS_W;
  const H = ctx.canvas.height || RESONANCE_CANVAS_W;
  const S = seedFn(args.storyId);
  const hits = args.hits.length > 0 ? args.hits : fallbackHitsFromSeed(args.storyId);

  ctx.imageSmoothingEnabled = false;
  (ctx as CanvasRenderingContext2D & { webkitImageSmoothingEnabled?: boolean }).webkitImageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = RESONANCE_BG;
  ctx.fillRect(0, 0, W, H);

  const footerH = args.footerLine ? Math.round(H * 0.08) : 0;
  const fieldH = H - footerH;
  const counts = hits.map((h) => h.count);
  const units = orderForContrast(
    hits.map((h) => ({
      hex: ensureVividHex(h.concept.hex),
      id: h.concept.id,
      width: clampStripeWidth(h.count, counts),
    }))
  );

  let x = 0;
  let repeat = 0;
  while (x < W && repeat < 400) {
    for (let u = 0; u < units.length; u++) {
      const unit = units[u]!;
      const hex = unit.hex;
      let stripeW = unit.width;
      const xi = Math.round(x);
      if (xi + stripeW > W) stripeW = W - xi;
      stripeW = Math.max(0, Math.round(stripeW));
      if (stripeW <= 0) break;
      ctx.fillStyle = hex;
      ctx.fillRect(xi, 0, stripeW, fieldH);
      x = xi + stripeW;
      if (x >= W) break;
    }
    repeat += 1;
  }

  if (args.footerLine && footerH > 0) {
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
    ctx.fillText(args.footerLine, W / 2, fieldH + footerH * 0.55);
  }
}
