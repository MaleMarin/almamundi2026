import type { CSSProperties } from 'react';

/**
 * Única fuente de verdad: header + dock (PillNavButton).
 * Altura fija ~60px, padding horizontal fijo, mismas sombras y radio.
 */
export const MAP_HOME_NEU_BUTTON_STYLE: CSSProperties = {
  backgroundColor: '#E0E5EC',
  boxShadow: [
    '14px 14px 30px rgba(136, 150, 170, 0.58)',
    '-14px -14px 32px rgba(255, 255, 255, 0.96)',
    'inset 3px 3px 6px rgba(255, 255, 255, 0.82)',
    'inset -4px -4px 12px rgba(163, 177, 198, 0.32)',
  ].join(', '),
  border: '1px solid rgba(255,255,255,0.48)',
  borderRadius: 9999,
  cursor: 'pointer',
};

/**
 * Misma caja siempre: ~60px alto, ancho = celda del grid (1fr), sin crecer por contenido.
 * Una línea de texto por defecto; «Buscar…» usa `.pill-nav-long-line` (misma caja, tipografía más compacta).
 */
export const MAP_HOME_NEU_BUTTON_CLASS =
  'btn-almamundi home-map-neu-pill box-border flex h-[3.75rem] min-h-[3.75rem] max-h-[3.75rem] min-w-0 w-full max-w-none items-center justify-center px-6 py-0 text-center text-base font-semibold leading-none text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis';

/** Base común: max-width y gaps idénticos. Columnas con minmax(0,1fr) = mismo ancho por celda, sin auto-width por contenido. */
export const MAP_HOME_PILL_ROW_LAYOUT = 'w-full max-w-5xl grid gap-3 text-gray-600 lg:gap-4';

/**
 * Nav superior (md+): cuatro píldoras del mismo ancho y alto (grid 4×1fr + ancho total acotado).
 * Sin esto, `max-content` dejaba «Historias» más chica que Propósito / ¿Cómo funciona? / Mapa.
 */
export const MAP_HOME_HEADER_NAV_CLASS =
  'hidden text-gray-600 md:grid md:ml-auto md:shrink-0 md:min-w-0 gap-3 lg:gap-4 md:w-[min(48rem,calc(100vw-14rem))] md:grid-cols-4 md:justify-items-stretch';

/** Dock: misma base que el header; ancho por contenido (max-content) y grupo centrado, no celdas 1fr estiradas. */
export const MAP_HOME_DOCK_NAV_CLASS = `mx-auto ${MAP_HOME_PILL_ROW_LAYOUT} justify-center justify-items-stretch [grid-template-columns:repeat(1,minmax(0,1fr))] sm:[grid-template-columns:repeat(3,max-content)] lg:[grid-template-columns:repeat(5,max-content)] px-2 md:px-3`;
