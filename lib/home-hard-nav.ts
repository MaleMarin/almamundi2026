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

/** `window.location.assign` — recarga completa del documento. */
export function hardNavigateTo(href: string): void {
  if (typeof window === 'undefined') return;
  if (!isHomeHardNavHref(href)) {
    console.warn('[home-hard-nav] href no es ruta de inicio, se navega igual:', href);
  }
  window.location.assign(href);
}
