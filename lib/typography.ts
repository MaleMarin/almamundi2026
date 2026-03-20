/**
 * Tipografía única del sitio — misma pila que la home (Tailwind `font-sans` / `globals.css` @theme `--font-sans`).
 * Usar en `style={{ fontFamily: SITE_FONT_STACK }}` cuando no aplique la clase `font-sans`.
 */
export const SITE_FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Avenir, sans-serif' as const;
