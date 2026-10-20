/**
 * Tipografía de la home — no usar en páginas internas ni en modales de envío.
 * Tailwind `font-sans` / `globals.css` @theme `--font-sans`.
 */
export const SITE_FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Avenir, sans-serif' as const;

/**
 * Páginas internas y modales de envío. `--font-interna` la define next/font (Nunito Sans).
 */
export const INTERIOR_FONT_STACK =
  'var(--font-interna), system-ui, sans-serif' as const;
