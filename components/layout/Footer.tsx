'use client';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';

/**
 * Footer unificado AlmaMundi (E0E5EC, sans moderna).
 * Se monta una sola vez en `app/layout.tsx` para todas las rutas.
 */
import { HistoriasAccordion } from './HistoriasAccordion';

const APP_FONT = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

/** Misma clase en globals.css: anula naranja global y estado activo naranja. */
const FOOTER_LINK = 'almamundi-footer-link font-normal transition-colors';

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
      className="w-full pb-32 pt-28 md:pt-36 px-8 md:px-12 flex flex-col items-center relative z-20 bg-[#E0E5EC]"
      style={{ fontFamily: APP_FONT }}
    >
      <div className="mb-20 mt-8 w-full flex justify-center select-none">
        <h1 className="text-8xl sm:text-9xl md:text-[170px] lg:text-[240px] text-center leading-none almamundi-footer-title">
          ALMAMUNDI
        </h1>
      </div>

      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center md:items-end gap-12 pt-14 pb-8 text-lg font-normal text-black">
        <div className="flex flex-col items-center md:items-start">
          <span className="mb-4 block text-base text-black">Una iniciativa de</span>
          <img src="/logo-precisar.png" alt="Precisar" className="h-16 w-auto object-contain" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-12 text-black">
          <ActiveInternalNavLink
            href="/#intro"
            className={FOOTER_LINK}
            activeClassName="!text-black font-semibold"
          >
            Nuestro propósito
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/#como-funciona"
            className={FOOTER_LINK}
            activeClassName="!text-black font-semibold"
          >
            ¿Cómo funciona?
          </ActiveInternalNavLink>
          <HistoriasAccordion variant="footer" />
          <ActiveInternalNavLink
            href="/#mapa"
            className={FOOTER_LINK}
            activeClassName="!text-black font-semibold"
          >
            Mapa
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/privacidad"
            className={FOOTER_LINK}
            activeClassName="!text-black font-semibold"
          >
            Política de privacidad
          </ActiveInternalNavLink>
        </div>
      </div>
    </footer>
  );
}
