/** Destino canónico del menú «Mapa»: sección embebida en la home (no `/mapa`). */
export const MAPA_HOME_HREF = '/#mapa' as const;

/** Query de llegada vía redirect HTTP (el hash no viaja en redirects). */
export const MAPA_HOME_QUERY = 'section=mapa' as const;

export const MAPA_HOME_REDIRECT_PATH = `/?${MAPA_HOME_QUERY}` as const;

export function isMapaHomeHref(href: string): boolean {
  try {
    const u = new URL(href, 'https://almamundi.local');
    return u.pathname === '/' && u.hash === '#mapa';
  } catch {
    return href === MAPA_HOME_HREF || href.endsWith('#mapa');
  }
}

export function scrollToHomeMapaSection(behavior: ScrollBehavior = 'smooth', attempt = 0): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('mapa');
  if (el) {
    el.scrollIntoView({ behavior, block: 'start' });
    return;
  }
  if (attempt < 32) {
    requestAnimationFrame(() => scrollToHomeMapaSection(behavior, attempt + 1));
  }
}

/** Tras scroll, deja la URL en `/#mapa` (sin `?section=mapa`). */
export function replaceUrlWithMapaHash(): void {
  if (typeof window === 'undefined') return;
  const u = new URL(window.location.href);
  if (u.searchParams.get('section') !== 'mapa' && u.hash !== '#mapa') return;
  u.searchParams.delete('section');
  const q = u.searchParams.toString();
  window.history.replaceState(null, '', `${u.pathname}${q ? `?${q}` : ''}#mapa`);
}

/** Navegación única al mapa de la home (menú, footer, redirect `/mapa`). */
export function navigateToHomeMapa(): void {
  if (typeof window === 'undefined') return;
  const onHome = window.location.pathname === '/' || window.location.pathname === '';
  if (onHome) {
    replaceUrlWithMapaHash();
    scrollToHomeMapaSection();
    return;
  }
  window.location.replace(`${window.location.origin}${MAPA_HOME_HREF}`);
}
