'use client';

/**
 * Las 4 tarjetas de formato (home y /subir). Misma pieza: textos, neumorfismo y hover.
 * LOCK visual: no alterar tamaños, sombras ni animaciones sin petición explícita.
 */
import type { ReactNode } from 'react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { SITE_FONT_STACK } from '@/lib/typography';

const APP_FONT = SITE_FONT_STACK;

const soft = {
  textBody: '#718096',
  flat: {
    backgroundColor: '#E8EBF2',
    borderRadius: '40px',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: [
      '22px 22px 52px rgba(120, 135, 155, 0.58)',
      '-20px -20px 52px rgba(255, 255, 255, 1)',
      'inset 3px 3px 6px rgba(255, 255, 255, 0.92)',
      'inset -5px -5px 14px rgba(140, 155, 175, 0.34)',
    ].join(', '),
  },
} as const;

type HistoriasCardHoverKind = 'video' | 'audio' | 'text' | 'photo';

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
  fillViewport = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  buttonLabel: string;
  onClick: () => void;
  delay: string;
  hoverKind: HistoriasCardHoverKind;
  fillViewport?: boolean;
}) {
  return (
    <div
      className={
        fillViewport
          ? 'home-historias-card-float-wrap flex h-full min-h-0 w-full min-w-0 justify-center'
          : 'home-historias-card-float-wrap mx-auto flex h-full w-full min-w-0 max-w-[min(100%,26rem)] justify-center sm:max-w-[28rem] md:max-w-[30rem] lg:mx-0 lg:max-w-full'
      }
      style={{ animationDelay: delay }}
    >
      <div
        className={
          fillViewport
            ? 'home-neu-card home-historias-card-surface group relative flex h-full min-h-0 w-full min-w-0 flex-col items-stretch overflow-hidden rounded-[28px] p-3 transition-[transform,box-shadow] duration-500 sm:p-4 md:p-5'
            : 'home-neu-card home-historias-card-surface group relative flex min-h-0 aspect-square w-full min-w-0 max-w-full flex-col items-stretch overflow-hidden rounded-[28px] p-4 transition-[transform,box-shadow] duration-500 md:p-5'
        }
        style={{
          ...soft.flat,
          borderRadius: '28px',
          fontFamily: APP_FONT,
        }}
      >
        <HistoriasCardHoverDecor kind={hoverKind} />
        <div
          className={
            fillViewport
              ? 'relative z-[1] flex min-h-0 flex-1 flex-col justify-evenly gap-2 md:gap-3'
              : 'relative z-[1] flex min-h-0 flex-1 flex-col'
          }
        >
          <div className="shrink-0 min-w-0">
            <p className="text-base font-light leading-snug text-gray-600 md:text-lg lg:text-xl">
              {title}
            </p>
            <h2 className="mt-1 text-lg font-bold leading-snug tracking-tight text-gray-800 md:text-xl lg:text-2xl">
              {subtitle}
            </h2>
          </div>
          <div
            className={
              fillViewport
                ? 'flex min-h-0 shrink-0 flex-col gap-3 md:gap-4'
                : 'flex min-h-0 flex-1 flex-col justify-end gap-3 md:gap-4'
            }
          >
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

export type HomeFormatCardsProps = {
  onRecordVideo: () => void;
  onRecordAudio: () => void;
  onWriteStory: () => void;
  onRecordPhoto: () => void;
  /** En la home: `historias` (ancla). En /subir se omite. */
  sectionId?: string;
  /** /subir: llena el alto visible y reparte el espacio entre tarjetas. No usar en la home. */
  fillViewport?: boolean;
};

export function HomeFormatCards({
  onRecordVideo,
  onRecordAudio,
  onWriteStory,
  onRecordPhoto,
  sectionId,
  fillViewport = false,
}: HomeFormatCardsProps) {
  const { t } = useHomeLocale();

  return (
    <section
      id={sectionId}
      aria-label="Formatos para compartir tu historia"
      className={
        fillViewport
          ? 'relative z-[18] flex min-h-0 flex-1 flex-col px-4 py-2 sm:px-6 md:px-10 md:py-3 lg:px-12'
          : 'relative z-[18] mb-8 px-6 pb-10 pt-0 sm:pt-1 md:mb-12 md:px-10 md:pb-12 md:pt-2 lg:pt-3'
      }
    >
      <p
        className={
          fillViewport
            ? 'home-intro-avenir mx-auto mb-3 max-w-[min(100%,40rem)] shrink-0 px-1 text-center text-base font-light leading-snug tracking-wide md:mb-4 md:text-lg lg:mb-5 lg:text-xl'
            : 'home-intro-avenir mx-auto mb-8 max-w-[min(100%,40rem)] px-1 text-center text-base font-light leading-snug tracking-wide sm:mb-10 md:mb-12 md:text-lg md:leading-relaxed lg:mb-14 lg:text-xl'
        }
        style={{ color: soft.textBody }}
      >
        <span className="font-normal text-gray-700">{t.historiasLead2}</span>
      </p>
      <div
        className={
          fillViewport
            ? 'mx-auto grid h-full min-h-0 w-full max-w-[min(100%,1600px)] flex-1 grid-cols-2 grid-rows-2 items-stretch gap-4 sm:gap-5 md:gap-6 lg:grid-cols-4 lg:grid-rows-1 lg:gap-7 xl:gap-8'
            : 'mx-auto mt-12 grid w-full max-w-[min(100%,1560px)] grid-cols-1 gap-y-12 px-1 sm:mt-14 sm:px-0 md:mt-16 lg:grid-cols-4 lg:mt-20 lg:gap-x-7 lg:gap-y-0 xl:gap-x-9 2xl:gap-x-11'
        }
      >
        <SoftCard
          title={t.cardVideoTitle}
          subtitle={t.cardVideoSubtitle}
          buttonLabel={t.cardVideoCta}
          onClick={onRecordVideo}
          delay="0s"
          hoverKind="video"
          fillViewport={fillViewport}
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
          fillViewport={fillViewport}
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
          fillViewport={fillViewport}
        >
          {t.cardWriteBody}
        </SoftCard>
        <SoftCard
          title={t.cardPhotoTitle}
          subtitle={t.cardPhotoSubtitle}
          buttonLabel={t.cardPhotoCta}
          onClick={onRecordPhoto}
          delay="1.35s"
          hoverKind="photo"
          fillViewport={fillViewport}
        >
          {t.cardPhotoBody}
        </SoftCard>
      </div>
    </section>
  );
}
