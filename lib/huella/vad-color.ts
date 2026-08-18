/**
 * VAD → HSL para resonancia.
 *
 * Saturación 45–95%, luminosidad 20–85%.
 * Tono a paso 12°. Tierras (60–96°) solo si L es baja o alta.
 * Negro excepcional para la palabra más negativa. Sin blanco puro.
 */

export type VadTriple = { v: number; a: number; d: number };

export const VAD_SAT_MIN = 45;
export const VAD_SAT_MAX = 95;
export const VAD_LIGHT_MIN = 20;
export const VAD_LIGHT_MAX = 85;
export const VAD_HUE_STEP = 12;
export const VAD_BLACK = '#000000';

/** 12° en el círculo, con tierras (60–96°) para L baja o alta. */
export const VAD_CLEAN_HUES = [
  0, 12, 24, 36, 50, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216, 228,
  240, 252, 264, 276, 288, 300, 312, 324, 336, 348,
];

const FEW_WORDS = 5;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0.5;
  return values.reduce((s, x) => s + x, 0) / values.length;
}

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function normInStory(values: number[]): number[] {
  if (values.length === 0) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo;
  if (span < 0.04) return values.map(() => 0.5);
  return values.map((x) => (x - lo) / span);
}

export function storyCenterHue(vMean: number, aMean: number): number {
  const ang = Math.atan2(clamp01(aMean) - 0.5, clamp01(vMean) - 0.5);
  return wrapHue((ang * 180) / Math.PI);
}

/** Redondea al tono de paleta. Tierras 60–96° solo si L ≤ 32 o L ≥ 72. */
export function snapHue(h: number, l?: number): number {
  let hue = wrapHue(h);
  if (hue >= 60 && hue <= 96 && l != null && l > 32 && l < 72) {
    hue = hue < 78 ? 50 : 120;
  }
  let best = VAD_CLEAN_HUES[0]!;
  let bestD = 999;
  for (const c of VAD_CLEAN_HUES) {
    const d = hueDist(hue, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  let q = best;
  if (l != null && l > 32 && l < 72 && q >= 60 && q <= 96) {
    q = q < 78 ? 50 : 120;
  }
  return q;
}

export function vadToHsl(
  vRel: number,
  aAbs: number,
  dRel: number,
  aRel: number,
  centerHue: number
): { h: number; s: number; l: number } {
  const spread = (vRel - 0.5) * 200;
  const wobble = (aRel - 0.5) * 80 + (dRel - 0.5) * 40;
  const rawH = wrapHue(centerHue + spread + wobble);
  let l = VAD_LIGHT_MIN + clamp01(aRel) * (VAD_LIGHT_MAX - VAD_LIGHT_MIN);
  let s = VAD_SAT_MIN + clamp01(dRel) * (VAD_SAT_MAX - VAD_SAT_MIN);
  s = VAD_SAT_MIN + Math.round((s - VAD_SAT_MIN) / 10) * 10;
  l = VAD_LIGHT_MIN + Math.round((l - VAD_LIGHT_MIN) / 8) * 8;
  s = Math.max(VAD_SAT_MIN, Math.min(VAD_SAT_MAX, s));
  l = Math.max(VAD_LIGHT_MIN, Math.min(VAD_LIGHT_MAX, l));
  const h = snapHue(rawH, l);
  return { h, s, l };
}

function neighborHues(base: number, extra = 2): number[] {
  const idx = VAD_CLEAN_HUES.indexOf(base);
  const i0 = idx >= 0 ? idx : 0;
  const out = [VAD_CLEAN_HUES[i0]!];
  for (let k = 1; k <= extra; k++) {
    const n = VAD_CLEAN_HUES.length;
    out.push(VAD_CLEAN_HUES[(i0 + k + n) % n]!);
    out.push(VAD_CLEAN_HUES[(i0 - k + n) % n]!);
  }
  return out;
}

export type ColorizedVadHit<T extends VadTriple> = T & {
  h: number;
  s: number;
  l: number;
  accent?: 'black';
};

export function colorizeVadHits<T extends VadTriple>(
  hits: T[]
): Array<ColorizedVadHit<T>> {
  if (hits.length === 0) return [];
  const vs = hits.map((h) => h.v);
  const as = hits.map((h) => h.a);
  const ds = hits.map((h) => h.d);
  const vRel = normInStory(vs);
  const aRel = normInStory(as);
  const dRel = normInStory(ds);
  const center = storyCenterHue(mean(vs), mean(as));
  const colored: Array<ColorizedVadHit<T>> = hits.map((hit, i) => {
    const hsl = vadToHsl(vRel[i] ?? 0.5, hit.a, dRel[i] ?? 0.5, aRel[i] ?? 0.5, center);
    return { ...hit, ...hsl };
  });

  if (hits.length >= 1) {
    let iMin = 0;
    for (let i = 1; i < vs.length; i++) {
      if (vs[i]! < vs[iMin]!) iMin = i;
    }
    if ((vs[iMin] ?? 1) < 0.4) {
      colored[iMin] = { ...colored[iMin]!, h: 0, s: 0, l: 0, accent: 'black' };
    }
  }

  const chrom = colored.filter((c) => c.accent !== 'black');
  if (chrom.length >= 2) {
    const hues = chrom.map((c) => c.h);
    const sortedH = [...hues].sort((a, b) => a - b);
    let gap = sortedH[0]! + 360 - sortedH[sortedH.length - 1]!;
    for (let i = 1; i < sortedH.length; i++) gap = Math.max(gap, sortedH[i]! - sortedH[i - 1]!);
    if (360 - gap < 180) {
      const ranked = [...chrom].sort((a, b) => a.v - b.v);
      const n = Math.max(1, ranked.length - 1);
      ranked.forEach((row, k) => {
        row.h = snapHue(center + (k / n - 0.5) * 220, row.l);
      });
    }
  }

  return colored;
}

/** Con pocas palabras, abanico de tonos vecinos (no un rayado de 2 colores). */
export function expandSparseVadColors<T extends ColorizedVadHit<VadTriple>>(
  colored: T[]
): T[] {
  if (colored.length === 0 || colored.length > FEW_WORDS) return colored;
  const chrom = colored.filter((c) => c.accent !== 'black');
  const out: T[] = colored.filter((c) => c.accent === 'black');
  const seen = new Set<number>();
  const center = chrom.length ? chrom.reduce((s, c) => s + c.h, 0) / chrom.length : 0;
  for (const hit of chrom) {
    const h = Math.round(snapHue(hit.h, hit.l));
    if (seen.has(h)) continue;
    seen.add(h);
    out.push(hit);
  }
  let i = 0;
  const src = chrom.length ? chrom : colored;
  while (seen.size < 8 && i < 40) {
    const t = i / 7;
    const l = VAD_LIGHT_MIN + t * (VAD_LIGHT_MAX - VAD_LIGHT_MIN);
    const s = VAD_SAT_MIN + ((i * 3) % 6) / 5 * (VAD_SAT_MAX - VAD_SAT_MIN);
    const h = Math.round(snapHue(center + (t - 0.5) * 220, l));
    if (!seen.has(h)) {
      seen.add(h);
      const base = src[i % src.length]!;
      out.push({ ...base, h, s, l, accent: undefined });
    }
    i += 1;
  }
  return out;
}

export function stripeWidthForCounts(count: number, counts: number[], minPx = 8, maxPx = 60): number {
  if (counts.length === 0) return minPx;
  const lo = Math.min(...counts);
  const hi = Math.max(...counts);
  if (hi <= lo) return minPx;
  return Math.round(minPx + ((count - lo) / (hi - lo)) * (maxPx - minPx));
}
