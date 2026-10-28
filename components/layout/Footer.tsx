'use client';

import { useHomeLocaleOptional, uiMessages } from '@/components/i18n/LocaleProvider';
import { storiesLinkLabel } from '@/lib/i18n/home-messages';
import type { AlmaLocale } from '@/lib/i18n/locale';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import {
  SITE_FOOTER_GUIA_CONDUCTA_HREF,
  SITE_FOOTER_LEGAL_LINKS,
  SITE_HEADER_STORIES_LINKS,
} from '@/components/layout/siteNavLinkStyles';
import { MAPA_HOME_HREF, primeMapAmbientFromNavGesture } from '@/lib/mapa-home-nav';
import { PREGUNTA_UI } from '@/lib/pregunta-semana';
import { SITE_FONT_STACK } from '@/lib/typography';

const FOOTER_LINK =
  'almamundi-footer-link font-normal leading-snug tracking-normal transition-colors';
const FOOTER_GROUP_LINK = `${FOOTER_LINK} text-[15px]`;
const FOOTER_LEGAL_LINK = `${FOOTER_LINK} text-xs`;

export type FooterProps = {
  embedded?: boolean;
  initialLocale?: AlmaLocale;
};

type FooterPillItem =
  | { id: string; kind: 'hard'; href: string; label: string; onNavigate?: () => void }
  | { id: string; kind: 'internal'; href: string; label: string };

export function Footer({ embedded = false, initialLocale = 'es' }: FooterProps = {}) {
  const localeCtx = useHomeLocaleOptional();
  const t = localeCtx?.t ?? uiMessages(initialLocale);
  const locale = localeCtx?.locale ?? initialLocale;

  const exploreLinks: FooterPillItem[] = [
    ...SITE_HEADER_STORIES_LINKS.map(({ href }) => ({
      id: href,
      kind: 'internal' as const,
      href,
      label: storiesLinkLabel(t, href),
    })),
    {
      id: 'mapa',
      kind: 'hard',
      href: MAPA_HOME_HREF,
      label: t.navMap,
      onNavigate: () => primeMapAmbientFromNavGesture(),
    },
    { id: 'pregunta', kind: 'internal', href: '/pregunta', label: PREGUNTA_UI.tab[locale] },
  ];

  const aboutLinks: FooterPillItem[] = [
    { id: 'proposito', kind: 'hard', href: '/#proposito', label: t.navPurpose },
    { id: 'como-funciona', kind: 'hard', href: '/#como-funciona', label: t.navHow },
  ];

  function renderTextLink(item: FooterPillItem) {
    if (item.kind === 'hard') {
      return (
        <HomeHardLink href={item.href} className={FOOTER_GROUP_LINK} onClick={item.onNavigate}>
          {item.label}
        </HomeHardLink>
      );
    }
    return (
      <ActiveInternalNavLink
        href={item.href}
        className={FOOTER_GROUP_LINK}
        activeClassName="!text-[var(--almamundi-orange)]"
      >
        {item.label}
      </ActiveInternalNavLink>
    );
  }

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
            <span className="almamundi-footer-title" aria-hidden>
              ALMAMUNDI
            </span>
          </HomeHardLink>
        </div>
        <p
          className="almamundi-footer-tagline mx-auto max-w-[640px] px-3 text-[15px] font-medium leading-relaxed"
          style={{ textWrap: 'balance' }}
        >
          {t.heroBeforeBold} {t.heroBold}
        </p>
        <HomeHardLink
          href="/#historias"
          className="btn-am-principal mt-8 inline-flex min-h-11 items-center justify-center px-6 py-3"
        >
          {t.navTellStory}
        </HomeHardLink>
      </div>

      <nav
        className="mt-12 flex w-full max-w-3xl flex-col items-center gap-10 md:mt-14 md:flex-row md:items-start md:justify-center md:gap-24"
        aria-label={t.ariaMainNav}
      >
        {[
          { title: t.footerExplore, links: exploreLinks },
          { title: t.footerAbout, links: aboutLinks },
        ].map((group) => (
          <div key={group.title} className="flex flex-col items-center text-center">
            <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#718096]">
              {group.title}
            </p>
            <ul className="m-0 flex list-none flex-col items-center gap-2 p-0">
              {group.links.map((item) => (
                <li key={item.id}>{renderTextLink(item)}</li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* 3. Bloque institucional */}
      <div className="mt-16 w-full max-w-6xl border-t border-black/[0.06] pt-10 md:mt-24 md:pt-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex w-full justify-center lg:w-auto lg:justify-start">
            <div className="flex flex-col items-start">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                {t.footerInitiativeOf}
              </p>
              <img
                src="/logo-precisar.png?v=3"
                alt="Precisar"
                className="h-11 w-auto md:h-14"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 lg:items-end">
            <nav
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-7 md:justify-end"
              aria-label={t.footerLegalAria}
            >
              {SITE_FOOTER_LEGAL_LINKS.map(({ href }) => (
                <ActiveInternalNavLink
                  key={href}
                  href={href}
                  className={FOOTER_LEGAL_LINK}
                  activeClassName="!text-gray-900 font-semibold"
                >
                  {href === '/privacidad'
                    ? t.footerPrivacy
                    : href === '/terminos'
                      ? t.footerTerms
                      : t.footerMyData}
                </ActiveInternalNavLink>
              ))}
              <a
                href={SITE_FOOTER_GUIA_CONDUCTA_HREF}
                className={FOOTER_LEGAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                type="application/pdf"
                title={t.footerConductGuideTitle}
              >
                {t.footerConductGuide}
              </a>
              <ActiveInternalNavLink
                href="/contacto"
                className={FOOTER_LEGAL_LINK}
                activeClassName="!text-gray-900 font-semibold"
              >
                {t.footerContact}
              </ActiveInternalNavLink>
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
