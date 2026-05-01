import { SITE_FONT_STACK } from '@/lib/typography';

/**
 * Neumorfismo fuerte para páginas /historias y /temas.
 * Misma paleta que home (soft UI) pero sombras más marcadas.
 *
 * Tipografía: misma pila sans que la home (`lib/typography.ts`).
 */
export const APP_FONT = SITE_FONT_STACK;

export const neu = {
  APP_FONT,
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  /** Menú superior en interiores: inactivo negro; activo / hover píldora = naranja (`ACTIVE_NAV_CLASS` + `.btn-almamundi`). */
  navLinkIdle: '#0a0a0a',
  /** Naranja fuerte como la home (--almamundi-orange) */
  orange: '#ff4500',
  gold: '#ff4500',
  /** Card elevada (relieve hacia fuera) */
  card: {
    position: 'relative' as const,
    backgroundColor: '#E0E5EC',
    boxShadow:
      '14px 14px 28px rgba(163,177,198,0.65), -14px -14px 28px rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '24px',
  },
  /**
   * Misma idea que `card`, pero sobre fondo `neu.bg` idéntico el relieve casi no se ve.
   * Fondo un poco más claro + sombras más profundas para que el neumorfismo sea legible.
   */
  cardProminent: {
    position: 'relative' as const,
    backgroundColor: '#ebeef4',
    boxShadow:
      '14px 14px 32px rgba(130, 148, 172, 0.48), -12px -12px 28px rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.55)',
    borderRadius: '24px',
  },
  /** Card hundida (inset) */
  cardInset: {
    backgroundColor: '#E0E5EC',
    boxShadow:
      'inset 8px 8px 14px rgba(163,177,198,0.7), inset -8px -8px 14px rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '20px',
  },
  /** Inset un poco más oscuro que `bg` para contrastar con `cardProminent` encima. */
  cardInsetProminent: {
    backgroundColor: '#d8dce6',
    boxShadow:
      'inset 10px 10px 22px rgba(150, 165, 188, 0.55), inset -8px -8px 20px rgba(255, 255, 255, 0.82)',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    borderRadius: '24px',
  },
  /** Botón / CTA (nav interiores: sombras acordes a píldoras más compactas) */
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow:
      '6px 6px 12px rgba(163,177,198,0.55), -6px -6px 12px rgba(255,255,255,0.78)',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    fontFamily: APP_FONT,
  },
  /** Badge "En el mapa" */
  badge: {
    backgroundColor: '#E0E5EC',
    boxShadow:
      'inset 4px 4px 8px rgba(163,177,198,0.6), inset -4px -4px 8px rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '9999px',
  },
} as const;

/**
 * Páginas interiores /historias: nav más alto, logo AlmaMundi visible,
 * enlaces más grandes y altura mínima para que el footer no aparezca en el primer pantallazo.
 */
export const historiasInterior = {
  /**
   * Padding superior cuando el menú usa header fijo al estilo home
   * (`HistoriasInteriorSiteHeader`, mismas alturas h-32 / md:h-40 / lg:h-44).
   */
  fixedHeaderContentPadClassName: 'pt-32 md:pt-40 lg:pt-44',
  /** main: fuerza scroll antes del footer */
  mainClassName:
    'min-h-[calc(100svh+32vh)] overflow-x-hidden flex flex-col',
  navClassName:
    'sticky top-0 z-50 flex items-center justify-between gap-3 px-6 md:px-12 py-2 md:py-2.5 min-h-[5rem] md:min-h-[6rem] border-b border-gray-300/50',
  navBarStyle: {
    backgroundColor: 'rgba(224,229,236,0.95)',
    boxShadow: '0 4px 24px rgba(163,177,198,0.3)',
  } as const,
  /** Marca gráfica oficial (PNG en /public). No usar logo.svg de texto plano. */
  logoSrc: '/logo.png' as const,
  /** Logo original — tamaño destacado en interiores (más presencia para lectura cómoda) */
  logoClassName:
    'h-[5.75rem] sm:h-[6.75rem] md:h-28 lg:h-[7.75rem] xl:h-[8.5rem] w-auto max-w-[min(440px,80vw)] md:max-w-[min(600px,82vw)] object-contain object-left select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)]',
  navLinkClassName:
    'px-3 py-1.5 md:px-4 md:py-2 rounded-full text-base md:text-lg font-medium leading-tight',
  navActiveClassName:
    'px-3 py-1.5 md:px-4 md:py-2 rounded-full text-base md:text-lg font-semibold leading-tight',
  /**
   * Botón «Historias ▼» del acordeón: misma escala que navLinkClassName (antes forzaba text-lg + py-3).
   */
  navHistoriasAccordionClassName:
    '[&_button]:btn-almamundi [&_button]:text-base [&_button]:md:text-lg [&_button]:font-medium [&_button]:px-3 [&_button]:py-1.5 [&_button]:md:px-4 [&_button]:md:py-2 [&_button]:leading-tight [&_button]:rounded-full',
  /** Fila de botones del menú superior */
  navLinksRowClassName:
    'flex items-center flex-wrap justify-end gap-x-2.5 gap-y-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-5',
  /** Contenedor header + sección principal */
  contentWrapClassName: 'flex-1 flex flex-col w-full min-h-0',
  headerClassName: 'flex-shrink-0 px-6 md:px-12 pt-10 md:pt-14 pb-6 md:pb-10',
  /** Área de contenido (carrusel / listas): empuja el footer fuera del primer viewport */
  sectionGrowClassName: 'flex-1 flex flex-col min-h-[calc(100svh-16rem)] md:min-h-[calc(100svh-18rem)]',
} as const;
