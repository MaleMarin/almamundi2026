/**
 * Pastilla neumórfica compacta para ítems principales del menú superior.
 */
/** `!important` en color: `globals.css` define `a { color: … naranja }`; los botones de la home no son `<a>`, pero Mapa/Historías sí deben verse grises igual que esos botones. */
export const SITE_NAV_LINK_CLASS =
  'btn-am-neutro inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-left text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/45 md:px-3.5 md:py-2 md:text-sm';

/** Cuenta tu historia: píldora secundaria. Visible en la barra, también en móvil. */
export const SITE_NAV_CTA_CLASS =
  'btn-am-secundario inline-flex items-center justify-center whitespace-nowrap px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/45 sm:px-3 sm:text-xs md:px-3.5 md:py-2 md:text-sm';

/** Enlaces internos del dropdown de Historias: livianos, sin pastillas. */
export const SITE_NAV_STORIES_ITEM_CLASS =
  'block whitespace-nowrap rounded-md px-1.5 py-1 text-left text-[0.78rem] font-medium !text-gray-600 visited:!text-gray-600 transition-colors hover:bg-white/50 hover:!text-[var(--almamundi-orange-strong)] md:text-[0.82rem]';

/** Píldora en navs secundarios (subir, exposiciones, temas, etc.). */
export const SITE_NAV_PILL_LINK_CLASS =
  'btn-am-neutro px-3 py-2 text-sm font-medium transition-colors md:px-4 md:text-[0.9375rem]';

/** Submenú Historias del header (mismo orden en footer). */
export const SITE_HEADER_STORIES_LINKS = [
  { href: '/historias/videos', label: 'Videos' },
  { href: '/historias/audios', label: 'Audios' },
  { href: '/historias/escrito', label: 'Escritos' },
  { href: '/historias/fotos', label: 'Fotografías' },
] as const;

/** Anclas en la home (Propósito, Cómo funciona) — `HomeHardLink` + modales. */
export const SITE_FOOTER_HOME_HASH_LINKS = [
  { href: '/#proposito', labelKey: 'navPurpose' as const },
  { href: '/#como-funciona', labelKey: 'navHow' as const },
] as const;

/** Enlaces legales del pie (segunda fila). */
export const SITE_FOOTER_LEGAL_LINKS = [
  { href: '/privacidad', label: 'Aviso de privacidad' },
  { href: '/terminos', label: 'Términos de uso' },
  { href: '/mis-datos-personales', label: 'Mis datos personales' },
] as const;

export const SITE_FOOTER_GUIA_CONDUCTA_HREF = '/Guia%20de%20conducta%20AlmaMundi.pdf';

/** `/historias` o `${base}/historias` si la home está bajo un prefijo (p. ej. preview). */
export function historiasListHrefFromBasePath(basePath: string): string {
  const raw = basePath.replace(/\/$/, '');
  const prefix = raw && raw !== '/' ? raw : '';
  return prefix ? `${prefix}/historias` : '/historias';
}
