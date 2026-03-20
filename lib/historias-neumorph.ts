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
  /** Card hundida (inset) */
  cardInset: {
    backgroundColor: '#E0E5EC',
    boxShadow:
      'inset 8px 8px 14px rgba(163,177,198,0.7), inset -8px -8px 14px rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '20px',
  },
  /** Botón / CTA */
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow:
      '10px 10px 20px rgba(163,177,198,0.6), -10px -10px 20px rgba(255,255,255,0.8)',
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
  /** main: fuerza scroll antes del footer */
  mainClassName:
    'min-h-[calc(100svh+32vh)] overflow-x-hidden flex flex-col',
  navClassName:
    'sticky top-0 z-50 flex items-center justify-between gap-3 px-6 md:px-12 py-4 md:py-5 min-h-[6.5rem] md:min-h-[7.75rem] border-b border-gray-300/50',
  navBarStyle: {
    backgroundColor: 'rgba(224,229,236,0.95)',
    boxShadow: '0 4px 24px rgba(163,177,198,0.3)',
  } as const,
  /** Marca gráfica oficial (PNG en /public). No usar logo.svg de texto plano. */
  logoSrc: '/logo.png' as const,
  /** Logo original — tamaño destacado en interiores (coherente con home, más presencia que texto) */
  logoClassName:
    'h-[4.75rem] sm:h-[5.5rem] md:h-24 lg:h-[6.5rem] w-auto max-w-[min(380px,72vw)] md:max-w-[min(520px,78vw)] object-contain object-left select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)]',
  navLinkClassName:
    'px-5 py-3 md:px-6 md:py-3.5 rounded-full text-base md:text-lg font-medium leading-tight',
  navActiveClassName:
    'px-5 py-3 md:px-6 md:py-3.5 rounded-full text-base md:text-lg font-semibold leading-tight',
  /** Fila de botones del menú superior: más aire horizontal entre cada ítem */
  navLinksRowClassName:
    'flex items-center flex-wrap justify-end gap-x-4 gap-y-2.5 sm:gap-x-5 md:gap-x-6 lg:gap-x-8',
  /** Contenedor header + sección principal */
  contentWrapClassName: 'flex-1 flex flex-col w-full min-h-0',
  headerClassName: 'flex-shrink-0 px-6 md:px-12 pt-10 md:pt-14 pb-6 md:pb-10',
  /** Área de contenido (carrusel / listas): empuja el footer fuera del primer viewport */
  sectionGrowClassName: 'flex-1 flex flex-col min-h-[calc(100svh-16rem)] md:min-h-[calc(100svh-18rem)]',
} as const;
