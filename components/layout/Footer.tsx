'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import {
  SITE_FOOTER_GUIA_CONDUCTA_HREF,
  SITE_FOOTER_HOME_HASH_LINKS,
  SITE_FOOTER_LEGAL_LINKS,
  SITE_HEADER_STORIES_LINKS,
  SITE_NAV_LINK_CLASS,
} from '@/components/layout/siteNavLinkStyles';
import { MAPA_HOME_LINK_HREF, primeMapAmbientFromNavGesture } from '@/lib/mapa-home-nav';
import { SITE_FONT_STACK } from '@/lib/typography';

/**
 * Footer unificado AlmaMundi (E0E5EC, sans moderna).
 * Se monta una sola vez en `app/layout.tsx` para todas las rutas.
 */
const FOOTER_LINK =
  'almamundi-footer-link text-xs font-semibold leading-none tracking-normal transition-colors';

const FOOTER_PILL =
  `${SITE_NAV_LINK_CLASS} ${FOOTER_LINK} min-w-0 justify-center px-4 py-2.5`;

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
        <HomeHardLink
          href="/"
          className="block text-center leading-none outline-offset-[6px] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400/55"
          aria-label="AlmaMundi — inicio"
        >
          <span
            className="almamundi-footer-title text-8xl sm:text-9xl md:text-[170px] lg:text-[240px] block"
            aria-hidden
          >
            ALMAMUNDI
          </span>
        </HomeHardLink>
      </div>

      <nav
        className="mb-16 md:mb-20 w-full max-w-4xl px-2"
        aria-label={t.ariaMainNav}
      >
        <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5">
          {SITE_FOOTER_HOME_HASH_LINKS.map(({ href, labelKey }) => (
            <li key={href}>
              <HomeHardLink href={href} className={FOOTER_PILL}>
                {t[labelKey]}
              </HomeHardLink>
            </li>
          ))}
          {SITE_HEADER_STORIES_LINKS.map(({ href, label }) => (
            <li key={href}>
              <ActiveInternalNavLink
                href={href}
                className={FOOTER_PILL}
                activeClassName="!text-[var(--almamundi-orange)] font-semibold"
              >
                {label}
              </ActiveInternalNavLink>
            </li>
          ))}
          <li>
            <HomeHardLink
              href={MAPA_HOME_LINK_HREF}
              className={FOOTER_PILL}
              onClick={() => primeMapAmbientFromNavGesture()}
            >
              {t.navMap}
            </HomeHardLink>
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

        <nav
          className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-10"
          aria-label="Información legal y datos personales"
        >
          {SITE_FOOTER_LEGAL_LINKS.map(({ href, label }) => (
            <ActiveInternalNavLink
              key={href}
              href={href}
              className={FOOTER_LINK}
              activeClassName="!text-gray-900 font-semibold"
            >
              {label}
            </ActiveInternalNavLink>
          ))}
          <a
            href={SITE_FOOTER_GUIA_CONDUCTA_HREF}
            className={FOOTER_LINK}
            target="_blank"
            rel="noopener noreferrer"
            type="application/pdf"
            title="Guía de conducta AlmaMundi (PDF): respeto, cuidado y uso responsable del sitio"
          >
            Guía de conducta
          </a>
        </nav>
      </div>
    </footer>
  );
}
