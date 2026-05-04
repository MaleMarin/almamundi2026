'use client';

/**
 * Barra fija en /historias/*: logo + enlaces de palabra (sin desplegable).
 * Navegación mínima: propósito, cómo funciona, Historias → /historias, Mapa → /mapa.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { SITE_NAV_LINK_ACTIVE, SITE_NAV_LINK_CLASS } from '@/components/layout/siteNavLinkStyles';
import { MAP_HOME_NEU_BUTTON_STYLE } from '@/lib/map-home-neu-button';

const HEADER_SHELL =
  'fixed top-0 left-0 z-[100] flex min-h-[4.75rem] w-full items-center justify-between gap-3 border-b border-white/20 bg-[#E0E5EC]/70 px-3 py-2 backdrop-blur-lg md:min-h-[5.25rem] md:gap-3 md:px-8 md:py-2 lg:min-h-[5.5rem] lg:px-10';

const LOGO_IMG_CLASS =
  'h-16 w-auto max-h-[4.5rem] max-w-[min(320px,82vw)] object-contain object-left select-none filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.12)] sm:h-[4.25rem] sm:max-h-[4.75rem] sm:max-w-[min(360px,72vw)] md:h-[4.5rem] md:max-w-[min(400px,46vw)] lg:h-20 lg:max-h-[5.25rem] lg:max-w-[min(440px,36vw)]';

const NAV_WRAP =
  'hidden min-w-0 flex-nowrap items-center justify-end gap-x-2 md:flex md:gap-x-2.5 lg:gap-x-3';

export function HistoriasInteriorSiteHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileNav();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen, closeMobileNav]);

  const navLinks = (
    <>
      <ActiveInternalNavLink
        href="/#proposito"
        className={SITE_NAV_LINK_CLASS}
        activeClassName={SITE_NAV_LINK_ACTIVE}
        onClick={closeMobileNav}
      >
        Nuestro propósito
      </ActiveInternalNavLink>
      <ActiveInternalNavLink
        href="/#como-funciona"
        className={SITE_NAV_LINK_CLASS}
        activeClassName={SITE_NAV_LINK_ACTIVE}
        onClick={closeMobileNav}
      >
        ¿Cómo funciona?
      </ActiveInternalNavLink>
      <Link
        href="/historias"
        className={SITE_NAV_LINK_CLASS}
        onClick={closeMobileNav}
      >
        Historias
      </Link>
      <Link
        href="/mapa"
        className={SITE_NAV_LINK_CLASS}
        onClick={closeMobileNav}
      >
        Mapa
      </Link>
    </>
  );

  return (
    <header className={HEADER_SHELL} role="banner">
      <div className="flex min-w-0 shrink-0 items-center self-stretch py-0.5">
        <HomeHardLink
          href="/"
          className="flex min-w-0 items-center justify-start"
          aria-label="AlmaMundi — inicio"
        >
          <img src="/logo.png" alt="AlmaMundi" className={LOGO_IMG_CLASS} />
        </HomeHardLink>
      </div>

      <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 md:gap-2.5">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition-shadow active:scale-[0.98] md:hidden"
          style={MAP_HOME_NEU_BUTTON_STYLE}
          aria-expanded={mobileNavOpen}
          aria-controls="historias-interior-mobile-nav"
          aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          {mobileNavOpen ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
        </button>

        <nav className={NAV_WRAP} aria-label="Navegación principal">
          {navLinks}
        </nav>
      </div>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed bottom-0 left-0 right-0 z-[98] bg-black/25 md:hidden"
            style={{ top: 'clamp(4.5rem, 14vw, 6rem)' }}
            aria-label="Cerrar menú"
            onClick={closeMobileNav}
          />
          <div
            id="historias-interior-mobile-nav"
            className="absolute left-0 right-0 top-full z-[102] border-b border-white/30 bg-[#E0E5EC]/96 px-4 py-2.5 shadow-sm backdrop-blur-md md:hidden"
            role="navigation"
            aria-label="Navegación principal"
          >
            <div className="mx-auto flex max-w-md flex-col gap-y-1">{navLinks}</div>
          </div>
        </>
      ) : null}
    </header>
  );
}
