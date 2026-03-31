'use client';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';

/**
 * Footer unificado para páginas internas (E0E5EC, sans moderna, ALMAMUNDI).
 */
import { HistoriasAccordion } from './HistoriasAccordion';

const APP_FONT = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

export function Footer() {
  return (
    <footer
      className="w-full pb-32 pt-28 md:pt-36 px-8 md:px-12 flex flex-col items-center relative z-20 bg-[#E0E5EC]"
      style={{ fontFamily: APP_FONT }}
    >
      <div className="mb-20 mt-8 w-full flex justify-center select-none">
        <h1 className="text-8xl sm:text-9xl md:text-[170px] lg:text-[240px] text-center leading-none almamundi-footer-title">
          ALMAMUNDI
        </h1>
      </div>

      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center md:items-end text-lg font-normal pt-14 pb-8 text-gray-600 gap-12">
        <div className="flex flex-col items-center md:items-start">
          <span className="block mb-4 opacity-70 text-base">Una iniciativa de</span>
          <img src="/logo-precisar.png" alt="Precisar" className="h-16 w-auto object-contain" />
        </div>

        <div className="flex flex-wrap justify-center gap-10 md:gap-12 opacity-90 items-center">
          <ActiveInternalNavLink href="/#intro" className="hover:text-gray-900 transition-colors font-normal">
            Nuestro propósito
          </ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#como-funciona" className="hover:text-gray-900 transition-colors font-normal">
            ¿Cómo funciona?
          </ActiveInternalNavLink>
          <HistoriasAccordion variant="footer" />
          <ActiveInternalNavLink href="/#mapa" className="hover:text-gray-900 transition-colors font-normal">
            Mapa
          </ActiveInternalNavLink>
          <ActiveInternalNavLink href="/privacidad" className="hover:text-gray-900 transition-colors font-normal">
            Política de privacidad
          </ActiveInternalNavLink>
        </div>
      </div>
    </footer>
  );
}
