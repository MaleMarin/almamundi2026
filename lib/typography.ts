/**
 * Solo la home y /contar. El resto del sitio hereda Nunito (`--font-interna`) desde el layout.
 * Tailwind `font-sans` / `globals.css` @theme `--font-sans`.
 */
export const SITE_FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Avenir, sans-serif' as const;

/**
 * Fuente por defecto del sitio (Nunito Sans vía next/font).
 */
export const INTERIOR_FONT_STACK =
  'var(--font-interna), system-ui, sans-serif' as const;
