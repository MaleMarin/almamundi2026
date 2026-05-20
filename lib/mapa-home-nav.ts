import { initFromUserGesture, unlockAmbientAudio } from '@/lib/sound/ambient';

/** URL canónica tras llegar (ancla en la home). */
export const MAPA_HOME_HREF = '/#mapa' as const;

/** Query de llegada vía redirect HTTP (el hash no viaja en redirects). */
export const MAPA_HOME_QUERY = 'section=mapa' as const;

export const MAPA_HOME_REDIRECT_PATH = `/?${MAPA_HOME_QUERY}` as const;

/** `href` de menús: query fiable en App Router; el scroll deja `/#mapa`. */
export const MAPA_HOME_LINK_HREF = MAPA_HOME_REDIRECT_PATH;

/** Clic en «Mapa»: desbloquear audio en el mismo gesto y avisar a HomeMap. */
export const MAP_NAV_GESTURE_EVENT = 'almamundi:mapNavGesture' as const;

const MAP_AMBIENT_PENDING_KEY = 'almamundi:mapAmbientPending';

/** Llamar en el handler de clic que navega al mapa (antes de scroll o recarga). */
export function primeMapAmbientFromNavGesture(): void {
  if (typeof window === 'undefined') return;
  initFromUserGesture();
  void unlockAmbientAudio();
  try {
    sessionStorage.setItem(MAP_AMBIENT_PENDING_KEY, '1');
  } catch {
    /* modo privado */
  }
  window.dispatchEvent(new CustomEvent(MAP_NAV_GESTURE_EVENT));
}

export function peekMapAmbientPending(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(MAP_AMBIENT_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function consumeMapAmbientPending(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(MAP_AMBIENT_PENDING_KEY) !== '1') return false;
    sessionStorage.removeItem(MAP_AMBIENT_PENDING_KEY);
    return true;
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    /** Instancia Lenis (SmoothScrollProvider) para scroll programático a `#mapa`. */
    __almamundiLenis?: {
      scrollTo: (target: number | string | HTMLElement, options?: { immediate?: boolean }) => void;
    };
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
