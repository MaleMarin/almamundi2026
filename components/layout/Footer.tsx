'use client';

import { useHomeLocaleOptional } from '@/components/i18n/LocaleProvider';
import { HOME_MESSAGES } from '@/lib/i18n/home-messages';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import {
  SITE_FOOTER_GUIA_CONDUCTA_HREF,
  SITE_FOOTER_LEGAL_LINKS,
  SITE_HEADER_STORIES_LINKS,
  SITE_NAV_LINK_CLASS,
} from '@/components/layout/siteNavLinkStyles';
import { MAPA_HOME_HREF, primeMapAmbientFromNavGesture } from '@/lib/mapa-home-nav';
import { SITE_FONT_STACK } from '@/lib/typography';

/** Frase de cierre editorial bajo la marca. */
const FOOTER_CLOSING_LINE =
  'Historias que no se pierden, sino que despiertan otras historias.';

const FOOTER_CONTACT_HREF = 'mailto:hola@almamundi.org';

const FOOTER_LINK =
  'almamundi-footer-link text-xs font-semibold leading-snug tracking-normal transition-colors';

const FOOTER_PILL =
  `${SITE_NAV_LINK_CLASS} ${FOOTER_LINK} w-full min-w-0 justify-center px-3 py-2.5 sm:px-4`;

export type FooterProps = {
  embedded?: boolean;
  initialLocale?: AlmaLocale;
};

type FooterPillItem =
  | { id: string; kind: 'hard'; href: string; label: string; onNavigate?: () => void }
  | { id: string; kind: 'internal'; href: string; label: string };

export function Footer({ embedded = false, initialLocale = 'es' }: FooterProps = {}) {
  const localeCtx = useHomeLocaleOptional();
  const t = localeCtx?.t ?? HOME_MESSAGES[initialLocale];

  const footerPills: FooterPillItem[] = [
    { id: 'proposito', kind: 'hard', href: '/#proposito', label: t.navPurpose },
    { id: 'como-funciona', kind: 'hard', href: '/#como-funciona', label: t.navHow },
    ...SITE_HEADER_STORIES_LINKS.map(({ href, label }) => ({
      id: href,
      kind: 'internal' as const,
      href,
      label,
    })),
    {
      id: 'mapa',
      kind: 'hard',
      href: MAPA_HOME_HREF,
      label: t.navMap,
      onNavigate: () => primeMapAmbientFromNavGesture(),
    },
  ];

  return (
    <footer
      {...(!embedded ? { 'data-site-footer': 'global' as const } : {})}
      className="almamundi-footer relative z-20 flex w-full flex-col items-center bg-[#E0E5EC] px-6 pb-24 pt-28 sm:px-8 md:px-12 md:pb-32 md:pt-44"
      style={{ fontFamily: SITE_FONT_STACK }}
    >
      {/* 1. Marca gigante + frase de cierre */}
      <div className="flex w-full max-w-6xl flex-col items-center text-center">
        <div className="almamundi-footer-brand mb-6 w-full md:mb-8">
          <HomeHardLink
            href="/"
            className="inline-block max-w-full select-none leading-none outline-offset-[6px] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400/55"
            aria-label="AlmaMundi — inicio"
          >
            <span
              className="almamundi-footer-title text-7xl sm:text-8xl md:text-[170px] lg:text-[240px]"
              aria-hidden
            >
              ALMAMUNDI
            </span>
          </HomeHardLink>
        </div>
        <p className="almamundi-footer-tagline mx-auto max-w-lg px-3 text-[13px] font-medium leading-relaxed tracking-[0.03em] md:text-sm">
          {FOOTER_CLOSING_LINE}
        </p>
      </div>

      {/* 2. Pills: grilla 2×4 centrada (Mapa en la última celda, no suelto) */}
      <nav
        className="mt-14 w-full max-w-4xl px-2 md:mt-20"
        aria-label={t.ariaMainNav}
      >
        <ul className="almamundi-footer-pill-grid m-0 list-none p-0">
          {footerPills.map((pill) => (
            <li key={pill.id} className="min-w-0">
              {pill.kind === 'hard' ? (
                <HomeHardLink
                  href={pill.href}
                  className={FOOTER_PILL}
                  onClick={pill.onNavigate}
                >
                  <span className="block text-center">{pill.label}</span>
                </HomeHardLink>
              ) : (
                <ActiveInternalNavLink
                  href={pill.href}
                  className={FOOTER_PILL}
                  activeClassName="!text-[var(--almamundi-orange)] font-semibold"
                >
                  <span className="block text-center">{pill.label}</span>
                </ActiveInternalNavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* 3. Bloque institucional */}
      <div className="mt-16 w-full max-w-6xl border-t border-black/[0.06] pt-10 md:mt-24 md:pt-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col items-center lg:items-start">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Una iniciativa de
            </p>
            <img
              src="/logo-precisar.png"
              alt="Precisar"
              className="h-12 w-auto object-contain md:h-[3.25rem]"
            />
          </div>

          <div className="flex flex-col items-center gap-5 lg:items-end">
            <nav
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-7 md:justify-end"
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
              <a href={FOOTER_CONTACT_HREF} className={FOOTER_LINK}>
                Contacto
              </a>
            </nav>
            <p className="text-[11px] font-medium tracking-wide text-gray-500">
              © 2026 AlmaMundi
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
