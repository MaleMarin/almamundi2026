/** Query de llegada al mapa embebido en la home (el hash `#mapa` no viaja en redirects HTTP). */
export const MAPA_HOME_QUERY = 'section=mapa' as const;

export const MAPA_HOME_REDIRECT_PATH = `/?${MAPA_HOME_QUERY}` as const;

export function scrollToHomeMapaSection(behavior: ScrollBehavior = 'smooth'): void {
  if (typeof document === 'undefined') return;
  document.getElementById('mapa')?.scrollIntoView({ behavior, block: 'start' });
}

/** Tras scroll, deja la URL en `/#mapa` (sin `?section=mapa`). */
export function replaceUrlWithMapaHash(): void {
  if (typeof window === 'undefined') return;
  const u = new URL(window.location.href);
  if (u.searchParams.get('section') !== 'mapa') return;
  u.searchParams.delete('section');
  const q = u.searchParams.toString();
  window.history.replaceState(null, '', `${u.pathname}${q ? `?${q}` : ''}#mapa`);
}
