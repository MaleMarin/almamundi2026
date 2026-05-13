'use client';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { SITE_NAV_LINK_CLASS } from '@/components/layout/siteNavLinkStyles';
import { SITE_FONT_STACK } from '@/lib/typography';

/**
 * Footer unificado AlmaMundi (E0E5EC, sans moderna).
 * Se monta una sola vez en `app/layout.tsx` para todas las rutas.
 */
/** Paridad con `PillNavButton` compact del header: `MAP_HOME_NEU_BUTTON_CLASS_COMPACT` (text-xs, semibold, gray-600). */
const FOOTER_LINK =
  'almamundi-footer-link text-xs font-semibold leading-none tracking-normal transition-colors';

/** PDF estático en `public/` (nombre con espacios; URL codificada para compatibilidad). */
const GUIA_CONDUCTA_PDF_HREF = '/Guia%20de%20conducta%20AlmaMundi.pdf';

/** Mismas entradas que las cards de la home y el flujo `/subir`. */
const FOOTER_STORY_FORMAT_LINKS = [
  { label: 'Video', href: '/subir?format=video&step=capture' },
  { label: 'Audio', href: '/subir?format=audio&step=capture' },
  { label: 'Escrito', href: '/subir?format=texto&step=capture' },
  { label: 'Fotografía', href: '/subir/foto' },
] as const;

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

      <nav
        className="mb-16 md:mb-20 w-full max-w-3xl px-2"
        aria-label="Contar tu historia por formato"
      >
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-600">
          Cuenta tu historia
        </p>
        <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-3 sm:gap-4">
          {FOOTER_STORY_FORMAT_LINKS.map(({ label, href }) => (
            <li key={href}>
              <ActiveInternalNavLink
                href={href}
                className={`${SITE_NAV_LINK_CLASS} almamundi-footer-link min-w-[7.25rem] justify-center px-4 py-2.5 text-sm md:min-w-[8rem] md:px-5`}
                activeClassName="!text-[var(--almamundi-orange)] font-semibold"
              >
                {label}
              </ActiveInternalNavLink>
            </li>
          ))}
        </ul>
      </nav>

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
          <ActiveInternalNavLink
            href="/historias"
            className={FOOTER_LINK}
            activeClassName="!text-gray-900 font-semibold"
          >
            Historias
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/mapa"
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
            Aviso de privacidad
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/mis-datos-personales"
            className={FOOTER_LINK}
            activeClassName="!text-gray-900 font-semibold"
          >
            Mis datos personales
          </ActiveInternalNavLink>
          <ActiveInternalNavLink
            href="/vision"
            className={FOOTER_LINK}
            activeClassName="!text-gray-900 font-semibold"
          >
            La visión de AlmaMundi
          </ActiveInternalNavLink>
          <a
            href={GUIA_CONDUCTA_PDF_HREF}
            className={FOOTER_LINK}
            target="_blank"
            rel="noopener noreferrer"
            type="application/pdf"
            title="Guía de conducta AlmaMundi (PDF): respeto, cuidado y uso responsable del sitio"
          >
            Guía de conducta
          </a>
        </div>
      </div>
    </footer>
  );
}
