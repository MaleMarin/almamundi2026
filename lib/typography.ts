/**
 * Montserrat en el sitio público, home incluida (`--font-interna` en el layout).
 * El logotipo de texto del pie no usa esta pila.
 */
export const SITE_FONT_STACK = 'var(--font-interna), sans-serif' as const;

export const INTERIOR_FONT_STACK = SITE_FONT_STACK;

/** Familia ya cargada, para canvas (no resuelve var()). */
export function canvasFontFamily(): string {
  if (typeof document === 'undefined') return 'sans-serif';
  const custom = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-interna')
    .trim();
  return custom || 'sans-serif';
}
