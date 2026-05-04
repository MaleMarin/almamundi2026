/**
 * Enlaces de cabecera en estilo palabra (sin pastillas ni desplegables).
 * Usar en home, /historias/* y navs secundarios.
 */
export const SITE_NAV_LINK_CLASS =
  'inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-1 text-left text-xs font-medium text-gray-600 transition-colors hover:text-[var(--almamundi-orange)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/45 md:px-2 md:text-sm';

export const SITE_NAV_LINK_ACTIVE = '!text-orange-500 font-semibold';

/** Píldora neumórfica en navs secundarios (subir, exposiciones, temas, etc.). */
export const SITE_NAV_PILL_LINK_CLASS =
  'rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-[var(--almamundi-orange)] md:px-4 md:text-[0.9375rem]';

/** `/historias` o `${base}/historias` si la home está bajo un prefijo (p. ej. preview). */
export function historiasListHrefFromBasePath(basePath: string): string {
  const raw = basePath.replace(/\/$/, '');
  const prefix = raw && raw !== '/' ? raw : '';
  return prefix ? `${prefix}/historias` : '/historias';
}
