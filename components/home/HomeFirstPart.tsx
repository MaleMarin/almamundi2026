'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeLanguageSwitcher } from '@/components/home/HomeLanguageSwitcher';
import { PillNavButton } from '@/components/home/PillNavButton';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import {
  MAP_HOME_HEADER_NAV_HOME_CLASS,
  MAP_HOME_NEU_BUTTON_CLASS_COMPACT,
  MAP_HOME_NEU_BUTTON_STYLE,
} from '@/lib/map-home-neu-button';
import { SITE_FONT_STACK } from '@/lib/typography';

/**
 * Primera parte de la home (header + intro + tarjetas).
 * LOCK diseño: tarjetas neumórficas E0E5EC; SoftCard tamaño marzo 2026 (max-w 400px, min-h 450px).
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

type HistoriasCardHoverKind = 'video' | 'audio' | 'text' | 'photo';

/** Capa decorativa al hover: visor, onda, escritura o marco álbum (pointer-events none). */
function HistoriasCardHoverDecor({ kind }: { kind: HistoriasCardHoverKind }) {
  const wrap =
    'pointer-events-none absolute inset-[5%] z-0 overflow-hidden rounded-[22px] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100';

  if (kind === 'video') {
    return (
      <div className={wrap} aria-hidden>
        <svg
          className="h-full w-full text-[#FF4A1C] drop-shadow-[0_0_12px_rgba(255,74,28,0.35)]"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M6 24V6H24"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.78}
          />
          <path
            d="M76 6H94V24"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.78}
          />
          <path
            d="M6 76V94H24"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.78}
          />
          <path
            d="M94 76V94H76"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.78}
          />
          <rect
            x="13"
            y="13"
            width="74"
            height="74"
            rx="3"
            stroke="currentColor"
            strokeWidth="0.55"
            opacity={0.35}
          />
        </svg>
      </div>
    );
  }

  if (kind === 'audio') {
    const heightsPx = [20, 34, 44, 28, 36];
    return (
      <div className={`${wrap} flex items-end justify-center gap-1.5 pb-[14%]`} aria-hidden>
        {heightsPx.map((h, i) => (
          <span
            key={i}
            className="home-historias-card-audio-bar w-[8px] rounded-full bg-[#FF4A1C]/70 shadow-[0_0_14px_rgba(255,74,28,0.45)]"
            style={{
              height: h,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (kind === 'text') {
    return (
      <div className={`${wrap} flex flex-col items-center justify-center gap-4 pt-[6%]`} aria-hidden>
        <div className="relative h-11 w-[82%] max-w-[240px] rounded-md border-2 border-[#FF4A1C]/35 bg-white/[0.12] shadow-[inset_0_2px_8px_rgba(255,255,255,0.45),0_4px_16px_rgba(74,85,104,0.12)]">
          <span className="home-historias-card-type-cursor absolute bottom-3 left-3.5 inline-block h-4 w-[3px] rounded-sm bg-[#FF4A1C] shadow-[0_0_10px_rgba(255,74,28,0.65)]" />
          <span
            className="home-historias-card-type-line absolute bottom-3 left-3.5 h-[2px] rounded-full bg-gray-600/45"
            style={{ width: '48%' }}
          />
        </div>
        <div className="flex w-[76%] max-w-[220px] flex-col gap-2">
          <span className="home-historias-card-float-line h-2 w-[94%] rounded-full bg-gray-600/28 shadow-sm" />
          <span className="home-historias-card-float-line home-historias-card-float-line--delay h-2 w-[72%] rounded-full bg-gray-600/22 shadow-sm" />
        </div>
      </div>
    );
  }

  /* photo */
  return (
    <div className={wrap} aria-hidden>
      <div className="absolute inset-[5%] rounded-xl border-2 border-white/75 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35),0_12px_36px_rgba(0,0,0,0.12)]" />
      <div className="home-historias-card-photo-shine absolute inset-[5%] rounded-xl" />
    </div>
  );
}

function SoftCard({
  title,
  subtitle,
  children,
  buttonLabel,
  onClick,
  delay,
  hoverKind,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  buttonLabel: string;
  onClick: () => void;
  delay: string;
  hoverKind: HistoriasCardHoverKind;
}) {
  return (
    <div
      className="home-historias-card-float-wrap mx-auto flex h-full w-full min-w-0 max-w-[min(100%,26rem)] justify-center sm:max-w-[28rem] md:max-w-[30rem] lg:mx-0 lg:max-w-full"
      style={{ animationDelay: delay }}
    >
      <div
        className="home-neu-card home-historias-card-surface group relative flex min-h-0 aspect-square w-full min-w-0 max-w-full flex-col items-stretch overflow-hidden rounded-[28px] p-4 transition-[transform,box-shadow] duration-500 md:p-5"
        style={{
          ...soft.flat,
          borderRadius: '28px',
          fontFamily: APP_FONT,
        }}
      >
        <HistoriasCardHoverDecor kind={hoverKind} />
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 min-w-0">
            <p className="text-base font-light leading-snug text-gray-600 md:text-lg lg:text-xl">
              {title}
            </p>
            <h2 className="mt-1 text-lg font-bold leading-snug tracking-tight text-gray-800 md:text-xl lg:text-2xl">
              {subtitle}
            </h2>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 md:gap-4">
            <p className="shrink-0 overflow-y-auto pr-0.5 text-sm font-normal leading-[1.6] text-gray-600 md:text-base md:leading-[1.62] lg:text-[1.05rem]">
              {children}
            </p>
            <button
              type="button"
              onClick={onClick}
              className="flex w-full shrink-0 cursor-pointer items-center justify-center px-3 py-2.5 text-center text-[12px] font-semibold normal-case tracking-wide transition-opacity hover:opacity-[0.92] active:scale-[0.98] md:px-4 md:py-3 md:text-sm"
              style={{
                background: '#FF4A1C',
                color: 'white',
                border: 'none',
                borderRadius: '100px',
                fontFamily: APP_FONT,
              }}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
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
  /** Reservado por la API de la home; la cuarta card usa /subir/foto. */
  onMediaEducation: () => void;
  /** Historias: ancla #historias. Mapa: sección del mapa en la home `/#mapa`. */
  basePath?: string;
};

export function HomeFirstPart({
  onShowPurpose,
  onShowComoFunciona,
  onRecordVideo,
  onRecordAudio,
  onWriteStory,
  onMediaEducation: _onMediaEducation,
  basePath = ''
}: HomeFirstPartProps) {
  const router = useRouter();
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
            className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition-shadow active:scale-[0.98]"
            style={soft.button}
            aria-expanded={mobileNavOpen}
            aria-controls="home-header-mobile-nav"
            aria-label={mobileNavOpen ? t.ariaCloseMenu : t.ariaOpenMenu}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
          </button>
          <nav className={MAP_HOME_HEADER_NAV_HOME_CLASS} aria-label={t.ariaMainNav}>
            <PillNavButton compact onClick={onShowPurpose}>
              {t.navPurpose}
            </PillNavButton>
            <PillNavButton compact onClick={onShowComoFunciona}>
              {t.navHow}
            </PillNavButton>
            <HistoriasAccordion
              variant="header"
              triggerLabel={t.navStories}
              buttonStyle={MAP_HOME_NEU_BUTTON_STYLE}
              headerButtonClassName={MAP_HOME_NEU_BUTTON_CLASS_COMPACT}
              className="w-full min-w-0"
            />
            <PillNavButton compact href={mapaHref}>
              {t.navMap}
            </PillNavButton>
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
                compact
                onClick={() => {
                  onShowPurpose();
                  closeMobileNav();
                }}
              >
                {t.navPurpose}
              </PillNavButton>
              <PillNavButton
                compact
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
                headerButtonClassName={`${MAP_HOME_NEU_BUTTON_CLASS_COMPACT} w-full max-w-none`}
                className="w-full"
                onItemNavigate={closeMobileNav}
              />
              <PillNavButton compact href={mapaHref} onAfterClick={closeMobileNav}>
                {t.navMap}
              </PillNavButton>
              <div className="flex justify-center pt-1 md:hidden">
                <HomeLanguageSwitcher />
              </div>
            </div>
          </>
        ) : null}
      </header>

      {/* INTRO — Avenir (misma pila que «Mapa de AlmaMundi», globals.css .home-intro-avenir) */}
      <section
        id="intro"
        className="home-intro-avenir relative z-[20] flex scroll-mt-32 flex-col items-center px-6 pb-4 pt-44 text-center sm:pt-48 sm:pb-5 md:scroll-mt-40 md:px-10 md:pb-6 md:pt-52 lg:scroll-mt-44 lg:pt-60 lg:pb-6"
      >
        <div className="mx-auto w-full max-w-[min(100%,42rem)]">
          <div className="home-first-part-float relative">
            <h1
              className="mx-auto mb-4 max-w-[min(100%,42rem)] font-light leading-[1.15] md:mb-5 text-[clamp(1.375rem,1.2vw+1.05rem,2.5rem)]"
              style={{
                color: soft.textMain,
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
              className="mx-auto block w-[min(100%,280px)] max-w-full"
              style={{ margin: '10px auto 10px' }}
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
          </div>
        </div>
      </section>

      {/* CARDS — siempre 4 en una fila desde lg; debajo de lg, columna única (móvil). */}
      <section
        id="historias"
        aria-label="Formatos para compartir tu historia"
        className="relative z-[18] mb-8 px-6 pb-10 pt-8 sm:pt-10 md:mb-12 md:px-10 md:pb-12 md:pt-14 lg:pt-16"
      >
        <p
          className="home-intro-avenir mx-auto mb-6 max-w-[min(100%,40rem)] px-1 text-center text-base font-light leading-snug tracking-wide sm:mb-8 md:mb-10 md:text-lg md:leading-relaxed lg:text-xl"
          style={{ color: soft.textBody }}
        >
          {t.historiasLead1}{' '}
          <span className="font-normal text-gray-700">{t.historiasLead2}</span>
        </p>
        <div className="mx-auto grid w-full max-w-[min(100%,1560px)] grid-cols-1 gap-y-12 px-1 sm:px-0 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-0 xl:gap-x-9 2xl:gap-x-11">
        <SoftCard
          title={t.cardVideoTitle}
          subtitle={t.cardVideoSubtitle}
          buttonLabel={t.cardVideoCta}
          onClick={onRecordVideo}
          delay="0s"
          hoverKind="video"
        >
          {t.cardVideoBody}
        </SoftCard>
        <SoftCard
          title={t.cardAudioTitle}
          subtitle={t.cardAudioSubtitle}
          buttonLabel={t.cardAudioCta}
          onClick={onRecordAudio}
          delay="0.45s"
          hoverKind="audio"
        >
          {t.cardAudioBody}
        </SoftCard>
        <SoftCard
          title={t.cardWriteTitle}
          subtitle={t.cardWriteSubtitle}
          buttonLabel={t.cardWriteCta}
          onClick={onWriteStory}
          delay="0.9s"
          hoverKind="text"
        >
          {t.cardWriteBody}
        </SoftCard>
        <SoftCard
          title={t.cardPhotoTitle}
          subtitle={t.cardPhotoSubtitle}
          buttonLabel={t.cardPhotoCta}
          onClick={() => router.push('/subir/foto')}
          delay="1.35s"
          hoverKind="photo"
        >
          {t.cardPhotoBody}
        </SoftCard>
        </div>
      </section>
    </>
  );
}
