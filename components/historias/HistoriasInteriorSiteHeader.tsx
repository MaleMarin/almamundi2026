'use client';

/**
 * Barra fija en /historias/* — misma pieza visual que el `<header>` de `HomeFirstPart` (altura, fondo,
 * logo y pastillas `SITE_NAV_LINK_CLASS`). En vista inmersiva (reproductor en portal), “Historias” es
 * enlace a `/historias` sin submenú y el `z-index` sube para quedar sobre el vídeo.
 */
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeLanguageSwitcher } from '@/components/home/HomeLanguageSwitcher';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import {
  SITE_NAV_LINK_ACTIVE,
  SITE_NAV_LINK_CLASS,
  SITE_NAV_STORIES_ITEM_CLASS,
} from '@/components/layout/siteNavLinkStyles';
import { SITE_FONT_STACK } from '@/lib/typography';

/** Misma sombra/redondeo que el botón menú hamburguesa en `HomeFirstPart` (`soft.button`). */
const HOME_HEADER_MENU_BUTTON_STYLE: CSSProperties = {
  backgroundColor: '#E9ECF3',
  borderRadius: '9999px',
  border: '1px solid rgba(255,255,255,0.5)',
  cursor: 'pointer',
  fontFamily: SITE_FONT_STACK,
  transition: 'transform 0.2s ease, box-shadow 0.25s ease, color 0.2s ease',
  boxShadow: [
    '11px 11px 26px rgba(136, 150, 170, 0.45)',
    '-11px -11px 26px rgba(255, 255, 255, 0.96)',
    'inset 1px 1px 3px rgba(255, 255, 255, 0.65)',
    'inset -2px -2px 6px rgba(163, 177, 198, 0.18)',
  ].join(', '),
};

const HOME_HEADER_SHELL_BASE =
  'fixed top-0 left-0 w-full flex items-center justify-between gap-3 px-6 md:px-14 h-32 md:h-40 lg:h-44 bg-[#E0E5EC]/70 backdrop-blur-lg border-b border-white/20';

const LOGO_HOME_CLASS =
  'h-28 md:h-36 lg:h-40 xl:h-44 w-auto object-contain object-left select-none filter drop-shadow-md';

export type HistoriasInteriorSiteHeaderProps = {
  /** Reproductor/modal en portal: sin submenú Historias / z-index alto. */
  overImmersiveMedia?: boolean;
};

export function HistoriasInteriorSiteHeader({ overImmersiveMedia = false }: HistoriasInteriorSiteHeaderProps) {
  const { t } = useHomeLocale();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopStoriesOpen, setDesktopStoriesOpen] = useState(false);
  const [mobileStoriesOpen, setMobileStoriesOpen] = useState(false);
  const storiesDesktopRef = useRef<HTMLDivElement | null>(null);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileNav();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen, closeMobileNav]);

  useEffect(() => {
    if (!desktopStoriesOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!storiesDesktopRef.current?.contains(e.target as Node)) {
        setDesktopStoriesOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [desktopStoriesOpen]);

  useEffect(() => {
    if (!overImmersiveMedia) return;
    setDesktopStoriesOpen(false);
    setMobileStoriesOpen(false);
  }, [overImmersiveMedia]);

  const desktopStoriesPanelClass =
    'absolute left-0 top-[calc(100%+0.35rem)] z-[110] min-w-[8rem]';

  const headerShellClass = `${HOME_HEADER_SHELL_BASE} ${overImmersiveMedia ? 'z-[140]' : 'z-[100]'}`;

  const navLinksDesktop = (
    <>
      <ActiveInternalNavLink
        href="/#proposito"
        className={SITE_NAV_LINK_CLASS}
        activeClassName={SITE_NAV_LINK_ACTIVE}
        onClick={closeMobileNav}
      >
        {t.navPurpose}
      </ActiveInternalNavLink>
      <ActiveInternalNavLink
        href="/#como-funciona"
        className={SITE_NAV_LINK_CLASS}
        activeClassName={SITE_NAV_LINK_ACTIVE}
        onClick={closeMobileNav}
      >
        {t.navHow}
      </ActiveInternalNavLink>
      {overImmersiveMedia ? (
        <Link href="/historias" className={SITE_NAV_LINK_CLASS} onClick={closeMobileNav}>
          {t.navStories}
        </Link>
      ) : (
        <div className="relative" ref={storiesDesktopRef}>
          <button
            type="button"
            className={SITE_NAV_LINK_CLASS}
            aria-expanded={desktopStoriesOpen}
            aria-controls="historias-interior-desktop-historias-list"
            onClick={() => setDesktopStoriesOpen((o) => !o)}
          >
            {t.navStories}
          </button>
          {desktopStoriesOpen ? (
            <div
              id="historias-interior-desktop-historias-list"
              role="menu"
              className={desktopStoriesPanelClass}
            >
              <Link href="/historias/mi-coleccion" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={() => setDesktopStoriesOpen(false)}>
                Mi colección
              </Link>
              <Link href="/historias/videos" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={() => setDesktopStoriesOpen(false)}>
                Videos
              </Link>
              <Link href="/historias/audios" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={() => setDesktopStoriesOpen(false)}>
                Audios
              </Link>
              <Link href="/historias/escrito" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={() => setDesktopStoriesOpen(false)}>
                Escritos
              </Link>
              <Link href="/historias/fotos" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={() => setDesktopStoriesOpen(false)}>
                Fotografías
              </Link>
            </div>
          ) : null}
        </div>
      )}
      <Link href="/mapa" className={SITE_NAV_LINK_CLASS} onClick={closeMobileNav}>
        {t.navMap}
      </Link>
    </>
  );

  return (
    <header className={headerShellClass} role="banner">
      <div className="flex shrink-0 min-w-0 items-center">
        <Link href="/" className="flex min-w-0 items-center" aria-label="AlmaMundi — inicio">
          <img src="/logo.png" alt="AlmaMundi" className={LOGO_HOME_CLASS} />
        </Link>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 md:gap-3">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition-shadow active:scale-[0.98] md:hidden"
          style={HOME_HEADER_MENU_BUTTON_STYLE}
          aria-expanded={mobileNavOpen}
          aria-controls="historias-interior-mobile-nav"
          aria-label={mobileNavOpen ? t.ariaCloseMenu : t.ariaOpenMenu}
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          {mobileNavOpen ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
        </button>

        <nav
          className="hidden min-w-0 flex-nowrap items-center gap-x-1.5 text-gray-600 md:ml-auto md:flex md:gap-x-2"
          aria-label={t.ariaMainNav}
        >
          {navLinksDesktop}
        </nav>

        <HomeLanguageSwitcher className="hidden md:flex" />
      </div>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed bottom-0 left-0 right-0 z-[98] bg-black/25 md:hidden"
            style={{ top: '8rem' }}
            aria-label={t.ariaCloseMenuBackdrop}
            onClick={closeMobileNav}
          />
          <div
            id="historias-interior-mobile-nav"
            className="absolute left-0 right-0 top-full z-[102] flex flex-col gap-2 border-b border-white/25 bg-[#E0E5EC]/96 px-4 py-3 shadow-sm backdrop-blur-lg md:hidden"
            role="navigation"
            aria-label={t.ariaMainNav}
          >
            <ActiveInternalNavLink
              href="/#proposito"
              className={`${SITE_NAV_LINK_CLASS} w-full justify-start text-left`}
              activeClassName={SITE_NAV_LINK_ACTIVE}
              onClick={closeMobileNav}
            >
              {t.navPurpose}
            </ActiveInternalNavLink>
            <ActiveInternalNavLink
              href="/#como-funciona"
              className={`${SITE_NAV_LINK_CLASS} w-full justify-start text-left`}
              activeClassName={SITE_NAV_LINK_ACTIVE}
              onClick={closeMobileNav}
            >
              {t.navHow}
            </ActiveInternalNavLink>
            {overImmersiveMedia ? (
              <Link
                href="/historias"
                className={`${SITE_NAV_LINK_CLASS} w-full justify-start border-t border-white/20 pt-2 text-left`}
                onClick={closeMobileNav}
              >
                {t.navStories}
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className={`${SITE_NAV_LINK_CLASS} w-full justify-start border-t border-white/20 pt-2 text-left`}
                  aria-expanded={mobileStoriesOpen}
                  aria-controls="historias-interior-mobile-historias-list"
                  onClick={() => setMobileStoriesOpen((o) => !o)}
                >
                  {t.navStories}
                </button>
                {mobileStoriesOpen ? (
                  <div id="historias-interior-mobile-historias-list" className="pl-2">
                    <Link href="/historias/mi-coleccion" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={closeMobileNav}>
                      Mi colección
                    </Link>
                    <Link href="/historias/videos" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={closeMobileNav}>
                      Videos
                    </Link>
                    <Link href="/historias/audios" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={closeMobileNav}>
                      Audios
                    </Link>
                    <Link href="/historias/escrito" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={closeMobileNav}>
                      Escritos
                    </Link>
                    <Link href="/historias/fotos" className={SITE_NAV_STORIES_ITEM_CLASS} onClick={closeMobileNav}>
                      Fotografías
                    </Link>
                  </div>
                ) : null}
              </>
            )}
            <Link
              href="/mapa"
              className={`${SITE_NAV_LINK_CLASS} w-full justify-start text-left`}
              onClick={closeMobileNav}
            >
              {t.navMap}
            </Link>
            <div className="flex justify-center border-t border-white/20 pt-2 md:hidden">
              <HomeLanguageSwitcher />
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
