'use client';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { SITE_FONT_STACK } from '@/lib/typography';

/**
 * Footer unificado AlmaMundi (E0E5EC, sans moderna).
 * Se monta una sola vez en `app/layout.tsx` para todas las rutas.
 */
import { HistoriasAccordion } from './HistoriasAccordion';

/** Paridad con `PillNavButton` compact del header: `MAP_HOME_NEU_BUTTON_CLASS_COMPACT` (text-xs, semibold, gray-600). */
const FOOTER_LINK =
  'almamundi-footer-link text-xs font-semibold leading-none tracking-normal transition-colors';

export type FooterProps = {
  /**
   * true = mismo diseño pero sin `data-site-footer` (p. ej. portal cinematográfico;
   * el layout sigue ocultando solo el footer global vía CSS).
   */
  embedded?: boolean;
};

export function Footer({ embedded = false }: FooterProps = {}) {
  return (
    <footer
      {...(!embedded ? { 'data-site-footer': 'global' as const } : {})}
      className="w-full pb-32 pt-36 md:pt-48 px-8 md:px-12 flex flex-col items-center relative z-20 bg-[#E0E5EC]"
      style={{ fontFamily: SITE_FONT_STACK }}
    >
      <div className="mb-24 md:mb-32 mt-10 md:mt-12 w-full flex justify-center select-none">
        <h1 className="text-8xl sm:text-9xl md:text-[170px] lg:text-[240px] text-center leading-none almamundi-footer-title">
          ALMAMUNDI
        </h1>
      </div>

      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center md:items-center gap-12 pt-4 md:pt-6 pb-8 text-gray-600">
        <div className="flex flex-col items-center md:items-start">
          <span className="mb-4 block text-xs font-semibold leading-snug text-gray-600">
            Una iniciativa de
          </span>
          <img
            src="/logo-precisar.png"
            alt="Precisar"
            className="h-16 w-auto object-contain"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-10">
          <ActiveInternalNavLink
            href="/#proposito"
            className={FOOTER_LINK}
            activeClassName="!text-gray-900 font-semibold"
          >
            Nuestro propósito
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/#como-funciona"
            className={FOOTER_LINK}
            activeClassName="!text-gray-900 font-semibold"
          >
            ¿Cómo funciona?
          </ActiveInternalNavLink>
          <HistoriasAccordion variant="footer" />
          <ActiveInternalNavLink
            href="/#mapa"
            className={FOOTER_LINK}
            activeClassName="!text-gray-900 font-semibold"
          >
            Mapa
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/privacidad"
            className={FOOTER_LINK}
            activeClassName="!text-gray-900 font-semibold"
          >
            Política de privacidad
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/mis-datos-personales"
            className={FOOTER_LINK}
            activeClassName="!text-gray-900 font-semibold"
          >
            Mis datos personales
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/terminos"
            className={FOOTER_LINK}
            activeClassName="!text-gray-900 font-semibold"
          >
            Términos de uso
          </ActiveInternalNavLink>
        </div>
      </div>
    </footer>
  );
}
