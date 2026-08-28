import { hitsFromText } from '@/lib/huella/almamundi-lexicon';
import type { LexiconHit } from '@/lib/huella/almamundi-lexicon';
import type { AlmaLocale } from '@/lib/i18n/locale';
import type { VadTriple } from '@/lib/huella/vad-color';

/** El relato original cuenta como esta cantidad de mensajes al mezclar. */
export const ECO_STORY_WEIGHT = 5;

export type EcoVadState = {
  v: number;
  a: number;
  d: number;
  /** Mensajes de resonancia ya plegados (no incluye el peso del relato). */
  n: number;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function meanVadFromHits(hits: LexiconHit[]): VadTriple | null {
  if (hits.length === 0) return null;
  let w = 0;
  let v = 0;
  let a = 0;
  let d = 0;
  for (const hit of hits) {
    const c = Math.max(1, hit.count);
    v += hit.v * c;
    a += hit.a * c;
    d += hit.d * c;
    w += c;
  }
  if (w <= 0) return null;
  return { v: v / w, a: a / w, d: d / w };
}

export function meanVadFromText(text: string, locale: AlmaLocale = 'es'): VadTriple | null {
  return meanVadFromHits(hitsFromText(text, locale));
}

export function parseEcoVadState(raw: unknown): EcoVadState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const v = Number(o.v);
  const a = Number(o.a);
  const d = Number(o.d);
  const n = Number(o.n);
  if (![v, a, d, n].every(Number.isFinite) || n < 1) return null;
  return { v: clamp01(v), a: clamp01(a), d: clamp01(d), n: Math.floor(n) };
}

/** Promedio corriente de mensajes (sin el relato). */
export function foldEcoVad(prev: EcoVadState | null, incoming: VadTriple): EcoVadState {
  const v = clamp01(incoming.v);
  const a = clamp01(incoming.a);
  const d = clamp01(incoming.d);
  if (!prev || prev.n < 1) return { v, a, d, n: 1 };
  const n = prev.n + 1;
  return {
    v: (prev.v * prev.n + v) / n,
    a: (prev.a * prev.n + a) / n,
    d: (prev.d * prev.n + d) / n,
    n,
  };
}

/** 0 = solo el relato; crece con cada mensaje (n / (5 + n)). */
export function ecoBlendT(n: number, storyWeight = ECO_STORY_WEIGHT): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n / (storyWeight + n);
}

export function blendHitsTowardVad<T extends VadTriple>(hits: T[], target: VadTriple, t: number): T[] {
  const k = Math.max(0, Math.min(1, t));
  if (k <= 0 || hits.length === 0) return hits;
  return hits.map((hit) => ({
    ...hit,
    v: hit.v * (1 - k) + clamp01(target.v) * k,
    a: hit.a * (1 - k) + clamp01(target.a) * k,
    d: hit.d * (1 - k) + clamp01(target.d) * k,
  }));
}
