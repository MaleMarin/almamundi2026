import { isMapaHomeHref, navigateToHomeMapa } from '@/lib/mapa-home-nav';

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
      window.history.replaceState(null, '', fullHref);
      const el = document.getElementById(target.hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  } catch {
    /* assign below */
  }

  window.location.replace(
    href.startsWith('http') ? href : `${window.location.origin}${href.startsWith('/') ? href : `/${href}`}`
  );
}
