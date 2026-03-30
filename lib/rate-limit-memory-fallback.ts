import "server-only";

/**
 * Respaldo acotado cuando no hay Redis (solo una instancia; no sustituye Upstash en escala).
 * Ventana deslizante por identificador; poda periódica de claves.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 8000;

function prune(now: number, windowMs: number): void {
  if (buckets.size <= MAX_KEYS) return;
  for (const [k, times] of buckets) {
    const fresh = times.filter((t) => now - t < windowMs);
    if (fresh.length === 0) buckets.delete(k);
    else buckets.set(k, fresh);
  }
}

export function memorySlidingWindowHit(
  key: string,
  max: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  prune(now, windowMs);
  let times = buckets.get(key) ?? [];
  times = times.filter((t) => now - t < windowMs);
  if (times.length >= max) {
    buckets.set(key, times);
    return { success: false, remaining: 0 };
  }
  times.push(now);
  buckets.set(key, times);
  return { success: true, remaining: Math.max(0, max - times.length) };
}
