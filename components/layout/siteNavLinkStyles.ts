/**
 * Pastilla neumórfica compacta para ítems principales del menú superior.
 */
export const SITE_NAV_LINK_CLASS =
  'inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white/55 bg-[#E9ECF3] px-3 py-1.5 text-left text-xs font-semibold text-gray-600 shadow-[8px_8px_20px_rgba(136,150,170,0.34),-8px_-8px_20px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.58),inset_-2px_-2px_5px_rgba(163,177,198,0.16)] transition-colors hover:text-[var(--almamundi-orange)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/45 md:px-3.5 md:py-2 md:text-sm';

export const SITE_NAV_LINK_ACTIVE = '!text-orange-500 font-semibold';

/** Enlaces internos del dropdown de Historias: livianos, sin pastillas. */
export const SITE_NAV_STORIES_ITEM_CLASS =
  'block whitespace-nowrap rounded-md px-1.5 py-1 text-left text-[0.78rem] font-medium text-gray-600 transition-colors hover:bg-white/50 hover:text-[var(--almamundi-orange)] md:text-[0.82rem]';

/** Píldora neumórfica en navs secundarios (subir, exposiciones, temas, etc.). */
export const SITE_NAV_PILL_LINK_CLASS =
  'rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-[var(--almamundi-orange)] md:px-4 md:text-[0.9375rem]';

/** `/historias` o `${base}/historias` si la home está bajo un prefijo (p. ej. preview). */
export function historiasListHrefFromBasePath(basePath: string): string {
  const raw = basePath.replace(/\/$/, '');
  const prefix = raw && raw !== '/' ? raw : '';
  return prefix ? `${prefix}/historias` : '/historias';
}
