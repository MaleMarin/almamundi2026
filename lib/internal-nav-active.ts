/**
 * Detección de enlace de navegación activo (rutas internas y anclas en `/`).
 */

export const ACTIVE_NAV_CLASS = '!text-orange-500 font-semibold';

/**
 * @param href Destino del enlace (`/#intro`, `/temas`, `/historias/videos`, etc.)
 * @param pathname `usePathname()` (sin hash)
 * @param hash `window.location.hash` en la home (p. ej. `#intro`)
 */
export function isInternalNavActive(href: string, pathname: string, hash: string): boolean {
  if (!pathname) return false;
  const h = hash || '';
  const pathOnly = href.split('?')[0];

  if (pathOnly.startsWith('/#')) {
    const expectedHash = pathOnly.slice(1);
    return pathname === '/' && h === expectedHash;
  }

  if (pathOnly === '/') {
    return pathname === '/' && !href.includes('#');
  }

  if (pathname === pathOnly) return true;
  if (pathname.startsWith(`${pathOnly}/`)) return true;

  /** `/historias` reutiliza la página de videos; el tab «Videos» debe verse activo. */
  if (pathOnly === '/historias/videos' && pathname === '/historias') return true;

  return false;
}

/** Acordeón «Historias» o cualquier ruta bajo `/historias`. */
export function isHistoriasSectionPath(pathname: string): boolean {
  return pathname === '/historias' || pathname.startsWith('/historias/');
}
