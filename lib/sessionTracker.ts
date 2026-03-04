/**
 * lib/sessionTracker.ts
 * Rastrea cuántas historias ha leído el usuario en esta sesión y cuáles (IDs).
 * Sin cookies, sin backend. Solo sessionStorage.
 * Para "La historia que te eligió" (roadmap 1D): preferir no leídas en sesión.
 */

const KEY = 'almamundi_stories_read';
const KEY_IDS = 'almamundi_stories_read_ids';
const MAX_IDS = 80;

export function incrementStoriesRead(storyId?: string): number {
  if (typeof sessionStorage === 'undefined') return 0;
  const current = parseInt(sessionStorage.getItem(KEY) ?? '0', 10);
  const next = current + 1;
  sessionStorage.setItem(KEY, String(next));
  if (storyId) {
    try {
      const raw = sessionStorage.getItem(KEY_IDS) ?? '[]';
      const ids: string[] = JSON.parse(raw);
      const nextIds = [storyId, ...ids.filter((id) => id !== storyId)].slice(0, MAX_IDS);
      sessionStorage.setItem(KEY_IDS, JSON.stringify(nextIds));
    } catch {}
  }
  return next;
}

export function getStoriesRead(): number {
  if (typeof sessionStorage === 'undefined') return 0;
  return parseInt(sessionStorage.getItem(KEY) ?? '0', 10);
}

/** IDs de historias leídas en esta sesión (más recientes primero). Para pickStoryForMe. */
export function getStoriesReadIds(): string[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(KEY_IDS) ?? '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

const TIME_KEY = 'almamundi_time_start';
const SHOWN_KEY = 'almamundi_momento_shown';

/** Inicia el timer de sesión (2D Momento Justo). */
export function startSessionTimer() {
  if (typeof sessionStorage === 'undefined') return;
  if (!sessionStorage.getItem(TIME_KEY)) {
    sessionStorage.setItem(TIME_KEY, String(Date.now()));
  }
}

/** Minutos activos en el sitio en esta sesión. */
export function getMinutesActive(): number {
  if (typeof sessionStorage === 'undefined') return 0;
  const start = parseInt(sessionStorage.getItem(TIME_KEY) ?? '0', 10);
  if (!start) return 0;
  return Math.floor((Date.now() - start) / 60000);
}

/** Si debemos mostrar el Momento Justo (20+ min, una sola vez). */
export function shouldShowMomentoJusto(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  if (sessionStorage.getItem(SHOWN_KEY) === '1') return false;
  return getMinutesActive() >= 20;
}

export function markMomentoJustoShown() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SHOWN_KEY, '1');
}
