'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeLanguageSwitcher } from '@/components/home/HomeLanguageSwitcher';
import { PillNavButton } from '@/components/home/PillNavButton';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { MAP_HOME_HEADER_NAV_CLASS, MAP_HOME_NEU_BUTTON_CLASS, MAP_HOME_NEU_BUTTON_STYLE } from '@/lib/map-home-neu-button';
import { DM_Sans } from 'next/font/google';
import { SITE_FONT_STACK } from '@/lib/typography';

/** Tipografía minimalista solo para el hero (frase principal + subtítulo). */
const homeHeroPhrase = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '800'],
  display: 'swap',
});

/**
 * Primera parte de la home (header + intro + tarjetas).
 * LOCK diseño: tamaños card ~400×450px, neumorfismo E0E5EC — no sustituir por otras plantillas (p. ej. política).
 */

const APP_FONT = SITE_FONT_STACK;

/** Neumorfismo con más volumen: sombras más largas + highlight blanco fuerte + bisel suave. */
const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E8EBF2',
    borderRadius: '40px',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: [
      '14px 14px 34px rgba(136, 150, 170, 0.48)',
      '-14px -14px 38px rgba(255, 255, 255, 0.98)',
      'inset 2px 2px 4px rgba(255, 255, 255, 0.75)',
      'inset -3px -3px 8px rgba(163, 177, 198, 0.22)',
    ].join(', '),
  },
  button: {
    backgroundColor: '#E9ECF3',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: APP_FONT,
    transition: 'transform 0.2s ease, box-shadow 0.25s ease, color 0.2s ease',
    boxShadow: [
      '11px 11px 26px rgba(136, 150, 170, 0.45)',
      '-11px -11px 26px rgba(255, 255, 255, 0.96)',
      'inset 1px 1px 3px rgba(255, 255, 255, 0.65)',
      'inset -2px -2px 6px rgba(163, 177, 198, 0.18)',
    ].join(', '),
  },
} as const;

function SoftCard({
  title,
  subtitle,
  children,
  buttonLabel,
  onClick,
  delay
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  buttonLabel: string;
  onClick: () => void;
  delay: string;
}) {
  return (
    <div
      role="article"
      className="home-first-part-float home-neu-card group relative flex min-h-[450px] w-full max-w-[400px] flex-1 flex-col items-start rounded-[40px] p-8 transition-all duration-500 hover:-translate-y-2"
      style={{ ...soft.flat, animationDelay: delay, fontFamily: APP_FONT }}
    >
      <div className="mb-5 shrink-0">
        <p className="text-xl md:text-2xl font-light text-gray-500 leading-tight m-0">{title}</p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-700 leading-tight mt-1">{subtitle}</h2>
      </div>
      <div className="flex-1 min-h-[80px] w-full" />
      <div className="w-full mt-auto">
        <p className="text-gray-500 leading-relaxed text-base md:text-lg mb-6">{children}</p>
        <button
          onClick={onClick}
          className="w-full flex cursor-pointer justify-center uppercase transition-opacity hover:opacity-[0.85] active:scale-[0.98]"
          style={{
            background: '#FF4A1C',
            color: 'white',
            border: 'none',
            borderRadius: '100px',
            padding: '10px 16px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: APP_FONT,
            transition: 'opacity 0.2s',
          }}
          type="button"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export type HomeFirstPartProps = {
  onShowPurpose: () => void;
  /** Explicación del sitio y enlace a política de privacidad (modal). */
  onShowComoFunciona: () => void;
  onRecordVideo: () => void;
  onRecordAudio: () => void;
  onWriteStory: () => void;
  onUploadPhoto: () => void;
  /** Historias: ancla #historias. Mapa: sección del mapa en la home `/#mapa`. */
  basePath?: string;
};

export function HomeFirstPart({
  onShowPurpose,
  onShowComoFunciona,
  onRecordVideo,
  onRecordAudio,
  onWriteStory,
  onUploadPhoto,
  basePath = ''
}: HomeFirstPartProps) {
  const { t } = useHomeLocale();
  const baseNorm = basePath.replace(/\/$/, '');
  const mapaHref = basePath ? (baseNorm ? `${baseNorm}#mapa` : '/#mapa') : '/#mapa';

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

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between gap-3 px-6 md:px-14 h-32 md:h-40 lg:h-44 bg-[#E0E5EC]/70 backdrop-blur-lg border-b border-white/20">
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
            className="md:hidden flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-gray-600 transition-shadow active:scale-[0.98]"
            style={soft.button}
            aria-expanded={mobileNavOpen}
            aria-controls="home-header-mobile-nav"
            aria-label={mobileNavOpen ? t.ariaCloseMenu : t.ariaOpenMenu}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <X size={22} strokeWidth={2} aria-hidden /> : <Menu size={22} strokeWidth={2} aria-hidden />}
          </button>
          <nav className={MAP_HOME_HEADER_NAV_CLASS} aria-label={t.ariaMainNav}>
            <PillNavButton onClick={onShowPurpose}>{t.navPurpose}</PillNavButton>
            <PillNavButton onClick={onShowComoFunciona}>{t.navHow}</PillNavButton>
            <HistoriasAccordion
              variant="header"
              triggerLabel={t.navStories}
              buttonStyle={MAP_HOME_NEU_BUTTON_STYLE}
              headerButtonClassName={MAP_HOME_NEU_BUTTON_CLASS}
              className="w-full min-w-0"
            />
            <PillNavButton href={mapaHref}>{t.navMap}</PillNavButton>
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
              id="home-header-mobile-nav"
              className="absolute left-0 right-0 top-full z-[102] flex flex-col gap-3 border-b border-white/25 bg-[#E0E5EC]/96 px-4 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-lg md:hidden"
              role="navigation"
              aria-label={t.ariaMainNav}
            >
              <PillNavButton
                onClick={() => {
                  onShowPurpose();
                  closeMobileNav();
                }}
              >
                {t.navPurpose}
              </PillNavButton>
              <PillNavButton
                onClick={() => {
                  onShowComoFunciona();
                  closeMobileNav();
                }}
              >
                {t.navHow}
              </PillNavButton>
              <HistoriasAccordion
                variant="header"
                triggerLabel={t.navStories}
                buttonStyle={MAP_HOME_NEU_BUTTON_STYLE}
                headerButtonClassName={`${MAP_HOME_NEU_BUTTON_CLASS} w-full max-w-none`}
                className="w-full"
                onItemNavigate={closeMobileNav}
              />
              <PillNavButton href={mapaHref} onAfterClick={closeMobileNav}>
                {t.navMap}
              </PillNavButton>
              <div className="flex justify-center pt-1 md:hidden">
                <HomeLanguageSwitcher />
              </div>
            </div>
          </>
        ) : null}
      </header>

      {/* INTRO — DM Sans: sans geométrica minimalista (solo esta franja) */}
      <section
        id="intro"
        className={`${homeHeroPhrase.className} relative z-10 flex flex-col items-center pt-52 text-center sm:pt-56 md:pt-64 md:pb-14 lg:pt-80 pb-10 px-6 md:px-10`}
      >
        <div className="w-full max-w-5xl lg:max-w-6xl">
          <div className="home-first-part-float relative">
            <h1
              className="mb-5 font-light leading-[1.12] md:mb-6"
              style={{
                color: soft.textMain,
                fontSize: '50px',
                letterSpacing: '-0.02em',
              }}
            >
              {t.heroBeforeBold}{' '}
              <span className="font-extrabold">{t.heroBold}</span>
            </h1>
            <svg
              width="360"
              height="12"
              viewBox="0 0 360 12"
              className="mx-auto block"
              style={{ margin: '14px auto 22px' }}
              aria-hidden="true"
            >
              <path
                pathLength={1}
                d="M4 8 Q90 12 180 8 Q270 4 356 8"
                stroke="#FF4A1C"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={1}
                strokeDashoffset={1}
                style={{
                  animation: 'drawUnderline 2.75s linear forwards 0.4s',
                }}
              />
            </svg>
            <p
              className="mx-auto max-w-4xl pt-6 font-light leading-[1.65] md:pt-8 text-xl tracking-wide md:text-2xl lg:pt-9 lg:text-3xl"
              style={{ color: soft.textBody }}
            >
              {t.heroSubBefore}{' '}
              <span className="font-normal">{t.heroSubBold}</span>
            </p>
          </div>
        </div>
      </section>

      {/* CARDS — más aire bajo el hero y mayor separación entre tarjetas */}
      <section
        id="historias"
        aria-label="Formatos para compartir tu historia"
        className="w-full px-4 sm:px-8 md:px-12 lg:px-16 pt-16 md:pt-24 lg:pt-28 pb-16 md:pb-20 mb-12 md:mb-16 flex flex-col md:flex-row flex-wrap gap-y-12 md:gap-y-14 gap-x-10 md:gap-x-12 lg:gap-x-16 justify-center items-stretch relative z-10"
      >
        <SoftCard
          title={t.cardVideoTitle}
          subtitle={t.cardVideoSubtitle}
          buttonLabel={t.cardVideoCta}
          onClick={onRecordVideo}
          delay="0s"
        >
          {t.cardVideoBefore}
          <strong>{t.cardVideoStrong}</strong>
          {t.cardVideoAfter}
        </SoftCard>
        <SoftCard
          title={t.cardAudioTitle}
          subtitle={t.cardAudioSubtitle}
          buttonLabel={t.cardAudioCta}
          onClick={onRecordAudio}
          delay="0.2s"
        >
          {t.cardAudioBefore}
          <strong>{t.cardAudioStrong}</strong>
          {t.cardAudioAfter}
        </SoftCard>
        <SoftCard
          title={t.cardWriteTitle}
          subtitle={t.cardWriteSubtitle}
          buttonLabel={t.cardWriteCta}
          onClick={onWriteStory}
          delay="0.4s"
        >
          {t.cardWriteBefore}
          <strong>{t.cardWriteStrong}</strong>
          {t.cardWriteAfter}
        </SoftCard>
        <SoftCard
          title={t.cardPhotoTitle}
          subtitle={t.cardPhotoSubtitle}
          buttonLabel={t.cardPhotoCta}
          onClick={onUploadPhoto}
          delay="0.6s"
        >
          {t.cardPhotoBody}
        </SoftCard>
      </section>
    </>
  );
}
