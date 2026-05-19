/** URL canónica tras llegar (ancla en la home). */
export const MAPA_HOME_HREF = '/#mapa' as const;

/** Query de llegada vía redirect HTTP (el hash no viaja en redirects). */
export const MAPA_HOME_QUERY = 'section=mapa' as const;

export const MAPA_HOME_REDIRECT_PATH = `/?${MAPA_HOME_QUERY}` as const;

/** `href` de menús: query fiable en App Router; el scroll deja `/#mapa`. */
export const MAPA_HOME_LINK_HREF = MAPA_HOME_REDIRECT_PATH;

type LenisLike = {
  scrollTo: (target: number | Element | string, options?: { immediate?: boolean }) => void;
};

declare global {
  interface Window {
    __almamundiLenis?: LenisLike;
  }
}

export function isMapaHomeHref(href: string): boolean {
  try {
    const u = new URL(href, 'https://almamundi.local');
    return (
      u.pathname === '/' &&
      (u.hash === '#mapa' || u.searchParams.get('section') === 'mapa')
    );
  } catch {
    return (
      href === MAPA_HOME_HREF ||
      href === MAPA_HOME_LINK_HREF ||
      href.endsWith('#mapa') ||
      href.includes('section=mapa')
    );
  }
}

function scrollMapaElement(el: HTMLElement, behavior: ScrollBehavior): void {
  const headerOffset = 176;
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerOffset);
  const lenis = window.__almamundiLenis;
  if (lenis) {
    lenis.scrollTo(top, { immediate: behavior === 'auto' });
    return;
  }
  window.scrollTo({ top, behavior });
}

export function scrollToHomeMapaSection(behavior: ScrollBehavior = 'smooth', attempt = 0): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('mapa');
  if (el) {
    scrollMapaElement(el, behavior);
    return;
  }
  if (attempt < 48) {
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
  window.location.replace(`${window.location.origin}${MAPA_HOME_REDIRECT_PATH}`);
}
