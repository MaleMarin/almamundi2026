'use client';

/**
 * Masthead único de la marca: copiado textualmente desde `HomeFirstPart` y reutilizado en
 * `/historias/*`. Mismas clases, logo sin envoltorio de enlace, mismo menú neumático y mismo panel móvil.
 *
 * Solo difiere lo imprescindible:
 * - `scope: 'historias-interior'` → Propósito / Cómo funciona = `HomeHardLink` (`/#…`, recarga fuerte).
 * - `overImmersiveMedia` → barra opaca como la home + `z-[11000]` sobre reproductores; “Historias” → `/historias`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { HomeLanguageSwitcher } from '@/components/home/HomeLanguageSwitcher';
import {
  SITE_NAV_LINK_CLASS,
  SITE_NAV_STORIES_ITEM_CLASS,
} from '@/components/layout/siteNavLinkStyles';
import { SITE_FONT_STACK } from '@/lib/typography';

/** Misma franja que la home sobre fondo claro `#E0E5EC`. */
const HOME_HEADER_SHELL =
  'fixed top-0 left-0 w-full flex items-center justify-between gap-3 px-6 md:px-14 h-32 md:h-40 lg:h-44 bg-[#E0E5EC]/70 backdrop-blur-lg border-b border-white/20 font-sans';

/**
 * Reproductores en portal (audio z-9999, texto z-1000…): masthead debe quedar por encima
 * pero por debajo de `DemoStoryDisclosure` (z-12000 en video).
 */
const HEADER_Z_LAYER_IMMERSIVE = 'z-[11000]';

/**
 * Sin transparencia sobre vídeo/imagen: mismo color percibido que en la home, sin «manchar» el fondo.
 */
const HOME_HEADER_SHELL_OVER_MEDIA =
  'fixed top-0 left-0 w-full flex items-center justify-between gap-3 px-6 md:px-14 h-32 md:h-40 lg:h-44 border-b border-white/35 bg-[#E0E5EC] font-sans shadow-[0_10px_32px_rgba(0,0,0,0.16)]';

const softHeaderButton = {
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
} as const;

type Base = {
  scope: 'home';
  onShowPurpose: () => void;
  onShowComoFunciona: () => void;
};

type Historias = {
  scope: 'historias-interior';
  overImmersiveMedia?: boolean;
};

export type HomeFirstPartSiteHeaderProps = Base | Historias;

export function HomeFirstPartSiteHeader(props: HomeFirstPartSiteHeaderProps) {
  const { t } = useHomeLocale();
  const scope = props.scope;
  const overImmersiveMedia = scope === 'historias-interior' ? Boolean(props.overImmersiveMedia) : false;
  const zLayer =
    scope === 'historias-interior' && overImmersiveMedia
      ? HEADER_Z_LAYER_IMMERSIVE
      : 'z-[100]';
  const headerLayoutClass =
    scope === 'historias-interior' && overImmersiveMedia ? HOME_HEADER_SHELL_OVER_MEDIA : HOME_HEADER_SHELL;
  /** Prefijo de id: mismo patrón que en la home (`home-*`) para `scope === 'home'`. */
  const idPrefix = scope === 'home' ? 'home' : 'historias-site';
  const mobileNavId = `${idPrefix}-header-mobile-nav`;
  const desktopStoriesListId = `${idPrefix}-historias-desktop-list`;
  const mobileStoriesListId = `${idPrefix}-historias-mobile-list`;

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

  const desktopFirstTwoLinks = scope === 'home' ? (
    <>
      <button type="button" onClick={() => props.onShowPurpose()} className={SITE_NAV_LINK_CLASS}>
        {t.navPurpose}
      </button>
      <button type="button" onClick={() => props.onShowComoFunciona()} className={SITE_NAV_LINK_CLASS}>
        {t.navHow}
      </button>
    </>
  ) : (
    <>
      <HomeHardLink href="/#proposito" className={SITE_NAV_LINK_CLASS} onClick={closeMobileNav}>
        {t.navPurpose}
      </HomeHardLink>
      <HomeHardLink href="/#como-funciona" className={SITE_NAV_LINK_CLASS} onClick={closeMobileNav}>
        {t.navHow}
      </HomeHardLink>
    </>
  );

  const desktopHistoriasSegment =
    scope === 'historias-interior' && overImmersiveMedia ? (
      <Link href="/historias" className={SITE_NAV_LINK_CLASS} onClick={closeMobileNav}>
        {t.navStories}
      </Link>
    ) : (
      <div className="relative" ref={storiesDesktopRef}>
        <button
          type="button"
          onClick={() => setDesktopStoriesOpen((o) => !o)}
          className={SITE_NAV_LINK_CLASS}
          aria-expanded={desktopStoriesOpen}
          aria-controls={desktopStoriesListId}
        >
          {t.navStories}
        </button>
        {desktopStoriesOpen ? (
          <div id={desktopStoriesListId} className="absolute left-0 top-[calc(100%+0.35rem)] z-[110] min-w-[8rem]">
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
    );

  const mobilePurposeHow = scope === 'home' ? (
    <>
      <button
        type="button"
        className={`${SITE_NAV_LINK_CLASS} w-full justify-start text-left`}
        onClick={() => {
          props.onShowPurpose();
          closeMobileNav();
        }}
      >
        {t.navPurpose}
      </button>
      <button
        type="button"
        className={`${SITE_NAV_LINK_CLASS} w-full justify-start text-left`}
        onClick={() => {
          props.onShowComoFunciona();
          closeMobileNav();
        }}
      >
        {t.navHow}
      </button>
    </>
  ) : (
    <>
      <HomeHardLink href="/#proposito" className={`${SITE_NAV_LINK_CLASS} w-full justify-start text-left`} onClick={closeMobileNav}>
        {t.navPurpose}
      </HomeHardLink>
      <HomeHardLink href="/#como-funciona" className={`${SITE_NAV_LINK_CLASS} w-full justify-start text-left`} onClick={closeMobileNav}>
        {t.navHow}
      </HomeHardLink>
    </>
  );

  const mobileHistoriasSegment =
    scope === 'historias-interior' && overImmersiveMedia ? (
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
          aria-controls={mobileStoriesListId}
          onClick={() => setMobileStoriesOpen((o) => !o)}
        >
          {t.navStories}
        </button>
        {mobileStoriesOpen ? (
          <div id={mobileStoriesListId} className="pl-2">
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
    );

  const mobileNavSheetClass =
    scope === 'historias-interior' && overImmersiveMedia
      ? 'absolute left-0 right-0 top-full z-[102] flex flex-col gap-2 border-b border-white/30 bg-[#E0E5EC] px-4 py-3 shadow-md md:hidden'
      : 'absolute left-0 right-0 top-full z-[102] flex flex-col gap-2 border-b border-white/25 bg-[#E0E5EC]/96 px-4 py-3 shadow-sm backdrop-blur-lg md:hidden';

  return (
    <header className={`${headerLayoutClass} ${zLayer}`}>
      <div className="flex items-center shrink-0 min-w-0">
        <img
          src="/logo.png"
          alt="AlmaMundi"
          className="h-28 md:h-36 lg:h-40 xl:h-44 w-auto object-contain object-left select-none filter drop-shadow-md"
        />
      </div>
      <div className="flex items-center justify-end gap-2 shrink-0 md:gap-3">
        <button
          type="button"
          className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition-shadow active:scale-[0.98]"
          style={softHeaderButton}
          aria-expanded={mobileNavOpen}
          aria-controls={mobileNavId}
          aria-label={mobileNavOpen ? t.ariaCloseMenu : t.ariaOpenMenu}
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          {mobileNavOpen ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
        </button>
        <nav className="hidden flex-nowrap items-center gap-x-1.5 text-gray-600 md:ml-auto md:flex md:min-w-0 md:gap-x-2" aria-label={t.ariaMainNav}>
          {desktopFirstTwoLinks}
          {desktopHistoriasSegment}
          <Link href="/mapa" className={SITE_NAV_LINK_CLASS} onClick={closeMobileNav}>
            {t.navMap}
          </Link>
        </nav>
        <HomeLanguageSwitcher className="hidden md:flex" />
      </div>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed left-0 right-0 bottom-0 z-[98] bg-black/25 md:hidden"
            style={{ top: '8rem' }}
            aria-label={t.ariaCloseMenuBackdrop}
            onClick={closeMobileNav}
          />
          <div
            id={mobileNavId}
            className={mobileNavSheetClass}
            role="navigation"
            aria-label={t.ariaMainNav}
          >
            {mobilePurposeHow}
            {mobileHistoriasSegment}
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
