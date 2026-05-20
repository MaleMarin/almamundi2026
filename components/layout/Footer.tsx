'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import {
  SITE_HEADER_STORIES_LINKS,
  SITE_NAV_LINK_CLASS,
} from '@/components/layout/siteNavLinkStyles';
import { MAPA_HOME_LINK_HREF } from '@/lib/mapa-home-nav';
import { SITE_FONT_STACK } from '@/lib/typography';

/**
 * Footer unificado AlmaMundi (E0E5EC, sans moderna).
 * Se monta una sola vez en `app/layout.tsx` para todas las rutas.
 */
/** Paridad con nav del header: `SITE_NAV_LINK_CLASS` en enlaces principales. */
const FOOTER_LINK =
  'almamundi-footer-link text-xs font-semibold leading-none tracking-normal transition-colors';

/** PDF estático en `public/` (nombre con espacios; URL codificada para compatibilidad). */
const GUIA_CONDUCTA_PDF_HREF = '/Guia%20de%20conducta%20AlmaMundi.pdf';

export type FooterProps = {
  /**
   * true = mismo diseño pero sin `data-site-footer` (p. ej. portal cinematográfico;
   * el layout sigue ocultando solo el footer global vía CSS).
   */
  embedded?: boolean;
};

export function Footer({ embedded = false }: FooterProps = {}) {
  const { t } = useHomeLocale();

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
        className="mb-16 md:mb-20 w-full max-w-4xl px-2"
        aria-label={t.ariaMainNav}
      >
        <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5">
          <li>
            <ActiveInternalNavLink
              href="/#proposito"
              className={`${SITE_NAV_LINK_CLASS} ${FOOTER_LINK} min-w-0 justify-center px-4 py-2.5`}
              activeClassName="!text-[var(--almamundi-orange)] font-semibold"
            >
              {t.navPurpose}
            </ActiveInternalNavLink>
          </li>
          <li>
            <ActiveInternalNavLink
              href="/#como-funciona"
              className={`${SITE_NAV_LINK_CLASS} ${FOOTER_LINK} min-w-0 justify-center px-4 py-2.5`}
              activeClassName="!text-[var(--almamundi-orange)] font-semibold"
            >
              {t.navHow}
            </ActiveInternalNavLink>
          </li>
          {SITE_HEADER_STORIES_LINKS.map(({ href, label }) => (
            <li key={href}>
              <ActiveInternalNavLink
                href={href}
                className={`${SITE_NAV_LINK_CLASS} ${FOOTER_LINK} min-w-0 justify-center px-4 py-2.5`}
                activeClassName="!text-[var(--almamundi-orange)] font-semibold"
              >
                {label}
              </ActiveInternalNavLink>
            </li>
          ))}
          <li>
            <ActiveInternalNavLink
              href={MAPA_HOME_LINK_HREF}
              className={`${SITE_NAV_LINK_CLASS} ${FOOTER_LINK} min-w-0 justify-center px-4 py-2.5`}
              activeClassName="!text-[var(--almamundi-orange)] font-semibold"
            >
              {t.navMap}
            </ActiveInternalNavLink>
          </li>
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
