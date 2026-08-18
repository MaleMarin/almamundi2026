/**
 * Visibilidad en el mapa: 15 días en público, pero no salen si hay
 * menos de 40 historias visibles. Sin tope artificial de 30.
 */

export const MAP_STORY_TTL_DAYS = 15;
export const MAP_MIN_PUBLIC_STORIES = 40;
export const MAP_STORY_TTL_MS = MAP_STORY_TTL_DAYS * 24 * 60 * 60 * 1000;

function toMillis(ts: unknown): number | null {
  if (ts == null) return null;
  if (typeof ts === "number" && Number.isFinite(ts) && ts > 0) {
    return ts < 1e12 ? ts * 1000 : ts;
  }
  if (typeof ts === "string") {
    const n = Date.parse(ts);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    const d = (ts as { toDate: () => Date }).toDate();
    return Number.isFinite(d.getTime()) ? d.getTime() : null;
  }
  return null;
}

/** Inicio de vida en el mapa: activeSince, si no publishedAt, si no createdAt. */
export function storyMapStartMs(data: Record<string, unknown>): number | null {
  return toMillis(data.activeSince) ?? toMillis(data.publishedAt) ?? toMillis(data.createdAt);
}

export function isStoryExpiredOnMap(data: Record<string, unknown>, now = Date.now()): boolean {
  const start = storyMapStartMs(data);
  if (start == null) return false;
  return now - start >= MAP_STORY_TTL_MS;
}
