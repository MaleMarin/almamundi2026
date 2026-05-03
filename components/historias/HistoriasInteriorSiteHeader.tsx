'use client';

/**
 * Barra superior de rutas /historias/* alineada estéticamente con el header de la home
 * (`HomeFirstPart`: fondo #E0E5EC translúcido, blur, logo PNG, píldoras `PillNavButton` compact).
 */
import { useCallback, useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { PillNavButton } from '@/components/home/PillNavButton';
import {
  MAP_HOME_NEU_BUTTON_CLASS_COMPACT,
  MAP_HOME_NEU_BUTTON_STYLE,
} from '@/lib/map-home-neu-button';
import { isInternalNavActive } from '@/lib/internal-nav-active';

const HEADER_SHELL =
  'fixed top-0 left-0 z-[100] flex min-h-[4.5rem] w-full items-center justify-between gap-2 border-b border-white/20 bg-[#E0E5EC]/70 px-4 py-2 backdrop-blur-lg md:min-h-[4.75rem] md:gap-3 md:px-10 md:py-2.5 lg:px-12';

const LOGO_IMG_CLASS =
  'h-12 w-auto max-w-[min(260px,62vw)] object-contain object-left select-none filter drop-shadow-md md:h-14 lg:h-16 md:max-w-[min(320px,48vw)]';

export type HistoriasInteriorFormatTab = 'videos' | 'audios' | 'escrito' | 'fotos';

export type HistoriasInteriorSiteHeaderProps = {
  /**
   * En `/historias/[id]` el pathname no indica el formato; se pasa el tab inferido del relato.
   * En listas (`/historias/videos`, …) puede omitirse y se deduce del pathname.
   */
  formatTabOverride?: HistoriasInteriorFormatTab | null;
  /** Incluir píldora «Mi colección» (solo página mi-colección). */
  showMiColeccionPill?: boolean;
};

function resolveFormatTabFromPathname(pathname: string): HistoriasInteriorFormatTab | null {
  if (pathname === '/historias' || pathname.startsWith('/historias/videos')) return 'videos';
  if (pathname.startsWith('/historias/audios')) return 'audios';
  if (pathname.startsWith('/historias/escrito')) return 'escrito';
  if (pathname.startsWith('/historias/fotos')) return 'fotos';
  return null;
}

export function HistoriasInteriorSiteHeader({
  formatTabOverride,
  showMiColeccionPill = false,
}: HistoriasInteriorSiteHeaderProps) {
  const pathname = usePathname() ?? '';
  const [hash, setHash] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    const sync = () => setHash(typeof window !== 'undefined' ? window.location.hash : '');
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileNav();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen, closeMobileNav]);

  const formatTab = formatTabOverride !== undefined ? formatTabOverride : resolveFormatTabFromPathname(pathname);

  const purposeActive = isInternalNavActive('/#proposito', pathname, hash);
  const comoActive = isInternalNavActive('/#como-funciona', pathname, hash);
  const mapaActive = isInternalNavActive('/#mapa', pathname, hash);
  const miColeccionActive = pathname.startsWith('/historias/mi-coleccion');

  const pillLinkClass = MAP_HOME_NEU_BUTTON_CLASS_COMPACT;

  const navPills = (
    <>
      <HomeHardLink
        href="/#proposito"
        className={pillLinkClass}
        style={MAP_HOME_NEU_BUTTON_STYLE}
        data-active={purposeActive ? 'true' : undefined}
        onClick={closeMobileNav}
      >
        Nuestro propósito
      </HomeHardLink>
      <HomeHardLink
        href="/#como-funciona"
        className={pillLinkClass}
        style={MAP_HOME_NEU_BUTTON_STYLE}
        data-active={comoActive ? 'true' : undefined}
        onClick={closeMobileNav}
      >
        ¿Cómo funciona?
      </HomeHardLink>
      <HistoriasAccordion
        variant="header"
        triggerLabel="Historias"
        buttonStyle={MAP_HOME_NEU_BUTTON_STYLE}
        headerButtonClassName={MAP_HOME_NEU_BUTTON_CLASS_COMPACT}
        className="min-w-0"
        onItemNavigate={closeMobileNav}
      />
      {showMiColeccionPill ? (
        <PillNavButton
          compact
          href="/historias/mi-coleccion"
          active={miColeccionActive}
          onAfterClick={closeMobileNav}
        >
          Mi colección
        </PillNavButton>
      ) : null}
      <PillNavButton compact href="/historias/videos" active={formatTab === 'videos'} onAfterClick={closeMobileNav}>
        Videos
      </PillNavButton>
      <PillNavButton compact href="/historias/audios" active={formatTab === 'audios'} onAfterClick={closeMobileNav}>
        Audios
      </PillNavButton>
      <PillNavButton compact href="/historias/escrito" active={formatTab === 'escrito'} onAfterClick={closeMobileNav}>
        Escritos
      </PillNavButton>
      <PillNavButton compact href="/historias/fotos" active={formatTab === 'fotos'} onAfterClick={closeMobileNav}>
        Fotografías
      </PillNavButton>
      <HomeHardLink
        href="/#mapa"
        className={pillLinkClass}
        style={MAP_HOME_NEU_BUTTON_STYLE}
        data-active={mapaActive ? 'true' : undefined}
        onClick={closeMobileNav}
      >
        Mapa
      </HomeHardLink>
    </>
  );

  return (
    <header className={HEADER_SHELL} role="banner">
      <div className="flex min-w-0 shrink-0 items-center">
        <HomeHardLink href="/" className="flex min-w-0 items-center" aria-label="AlmaMundi — inicio">
          <img src="/logo.png" alt="AlmaMundi" className={LOGO_IMG_CLASS} />
        </HomeHardLink>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 md:gap-3">
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

        <nav
          className="hidden min-w-0 max-w-[min(56rem,calc(100vw-9rem))] flex-wrap items-center justify-end gap-1.5 md:flex lg:gap-2"
          aria-label="Navegación principal"
        >
          {navPills}
        </nav>
      </div>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed bottom-0 left-0 right-0 z-[98] bg-black/25 md:hidden"
            style={{ top: 'clamp(4.5rem, 22vw, 6rem)' }}
            aria-label="Cerrar menú"
            onClick={closeMobileNav}
          />
          <div
            id="historias-interior-mobile-nav"
            className="absolute left-0 right-0 top-full z-[102] flex max-h-[min(72vh,calc(100dvh-5.5rem))] flex-col gap-1.5 overflow-y-auto border-b border-white/25 bg-[#E0E5EC]/96 px-3 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.1)] backdrop-blur-lg md:hidden"
            role="navigation"
            aria-label="Navegación principal"
          >
            {navPills}
          </div>
        </>
      ) : null}
    </header>
  );
}
