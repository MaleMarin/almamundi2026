import {
  isMapaHomeHref,
  navigateToHomeMapa,
  primeMapAmbientFromNavGesture,
} from '@/lib/mapa-home-nav';

/**
 * Navegación forzada a la home (o anclas / query en `/`).
 * Evita que el App Router reutilice una instantánea antigua de `/` al usar `Link` o `router.push`.
 */
export function isHomeHardNavHref(href: string): boolean {
  if (href === '/') return true;
  if (href.startsWith('/#')) return true;
  if (href.startsWith('/?')) return true;
  return false;
}

/** `window.location.assign` — recarga completa del documento. En home, anclas `/#…` hacen scroll sin recargar. */
export function hardNavigateTo(href: string): void {
  if (typeof window === 'undefined') return;
  if (isMapaHomeHref(href)) {
    primeMapAmbientFromNavGesture();
    navigateToHomeMapa();
    return;
  }
  if (!isHomeHardNavHref(href)) {
    console.warn('[home-hard-nav] href no es ruta de inicio, se navega igual:', href);
    window.location.assign(href);
    return;
  }

  try {
    const target = new URL(href, window.location.origin);
    const onHome = window.location.pathname === '/' || window.location.pathname === '';
    if (onHome && target.pathname === '/' && target.hash) {
      const fullHref = `${target.pathname}${target.search}${target.hash}`;
      const hashId = target.hash.slice(1);
      window.history.replaceState(null, '', fullHref);
      /** Modales Propósito / Cómo funciona: el ancla es solo sr-only; abrir vía `hashchange` en HomePageClient. */
      if (hashId === 'proposito' || hashId === 'como-funciona') {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        return;
      }
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
  } catch {
    /* assign below */
  }

  window.location.replace(
    href.startsWith('http') ? href : `${window.location.origin}${href.startsWith('/') ? href : `/${href}`}`
  );
}
