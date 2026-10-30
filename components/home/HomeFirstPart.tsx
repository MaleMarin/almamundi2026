'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeFirstPartSiteHeader } from '@/components/home/HomeFirstPartSiteHeader';
import { HomeFormatCards } from '@/components/home/HomeFormatCards';
import { interpolate } from '@/lib/i18n/locale';
import { visitorGreetingPlace } from '@/components/mapa/WorldClock';

/**
 * Primera parte de la home (header + intro + tarjetas).
 * LOCK diseño: tarjetas neumórficas E0E5EC; SoftCard tamaño marzo 2026 (max-w 400px, min-h 450px).
 */

/** Neumorfismo con más volumen: sombras más largas + highlight blanco fuerte + bisel suave. */
const soft = {
  bg: 'var(--home-bg)',
  textMain: '#4A5568',
  textBody: '#616C7C',
  flat: {
    backgroundColor: '#FBFAF8',
    borderRadius: '40px',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: [
      '22px 22px 52px rgba(120, 135, 155, 0.58)',
      '-20px -20px 52px rgba(255, 255, 255, 1)',
      'inset 3px 3px 6px rgba(255, 255, 255, 0.92)',
      'inset -5px -5px 14px rgba(140, 155, 175, 0.34)',
    ].join(', ') } } as const;

type DayPart = 'morning' | 'afternoon' | 'night';

function dayPart(hour: number): DayPart {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 20) return 'afternoon';
  return 'night';
}

/** Solo en local, para revisar las tres franjas: ?hora=8 | 14 | 21 */
function reviewHour(): number | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') return null;
  const raw = new URLSearchParams(window.location.search).get('hora');
  if (raw == null) return null;
  const hour = Number(raw);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  return hour;
}

function HeroGreeting() {
  const { t } = useHomeLocale();
  const [line, setLine] = useState<{ text: string; night: boolean } | null>(null);

  useEffect(() => {
    const hour = reviewHour() ?? new Date().getHours();
    const part = dayPart(hour);
    const place = visitorGreetingPlace();
    const template = place
      ? part === 'morning'
        ? t.heroGreetMorningPlace
        : part === 'afternoon'
          ? t.heroGreetAfternoonPlace
          : t.heroGreetNightPlace
      : part === 'morning'
        ? t.heroGreetMorning
        : part === 'afternoon'
          ? t.heroGreetAfternoon
          : t.heroGreetNight;
    setLine({
      text: place ? interpolate(template, { lugar: place, place }) : template,
      night: part === 'night',
    });
  }, [t]);

  if (!line) {
    return <p className="mb-3 min-h-[22px]" aria-hidden />;
  }

  const Icon = line.night ? Moon : Sun;
  return (
    <p
      className="mb-3 flex w-full items-start justify-center gap-2 text-[15px] leading-snug"
      style={{ color: soft.textBody, fontWeight: 500 }}
    >
      <Icon aria-hidden className="mt-[3px] shrink-0" size={16} color="#FF4A1C" strokeWidth={2} />
      <span className="max-w-[calc(100%-1.5rem)]">{line.text}</span>
    </p>
  );
}

export type HomeFirstPartProps = {
  onShowPurpose: () => void;
  /** Explicación del sitio y enlace a política de privacidad (modal). */
  onShowComoFunciona: () => void;
  onRecordVideo: () => void;
  onRecordAudio: () => void;
  onWriteStory: () => void;
  onRecordPhoto: () => void;
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
  onRecordPhoto,
  onMediaEducation: _onMediaEducation,
  basePath: _basePath = ''
}: HomeFirstPartProps) {
  const { t } = useHomeLocale();

  return (
    <>
      <HomeFirstPartSiteHeader
        scope="home"
        onShowPurpose={onShowPurpose}
        onShowComoFunciona={onShowComoFunciona}
      />

      <div className="lg:mt-[13.5rem] lg:flex lg:h-[calc(100svh-13.5rem)] lg:min-h-0 lg:flex-col">
      <section
        id="intro"
        className="home-intro-avenir relative z-[20] flex shrink-0 scroll-mt-[9.75rem] flex-col items-center px-6 pb-2 pt-[12.75rem] text-center sm:pb-2 md:scroll-mt-[12.25rem] md:px-10 md:pb-3 md:pt-[15.25rem] lg:min-h-0 lg:shrink-0 lg:scroll-mt-[13.5rem] lg:px-10 lg:pb-0 lg:pt-0"
      >
        <div aria-hidden className="home-hero-head-gap" />
        <div className="mx-auto w-full max-w-[min(100%,42rem)] shrink-0 lg:max-w-[1000px]">
          <div className="home-first-part-float relative">
            <HeroGreeting />
            <h1
              className="mx-auto mb-2 max-w-[min(100%,42rem)] leading-[1.15] md:mb-3 lg:mb-10 lg:max-w-[1000px] text-[length:var(--fs-titular)]"
              style={{ color: soft.textMain, fontWeight: 400 }}
            >
              {t.heroBeforeBold}{' '}
              <span style={{ fontWeight: 700 }}>{t.heroBold}</span>
            </h1>
            <div className="home-hero-sign lg:mb-0">
              <svg
                width="360"
                height="12"
                viewBox="0 0 360 12"
                className="home-intro-underline block max-w-full"
                aria-hidden="true"
              >
                <path
                  pathLength={1}
                  d="M4 8 Q90 12 180 8 Q270 4 356 8"
                  stroke="#FF4A1C"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <span className="home-hero-hand">{t.heroHand}</span>
            </div>
          </div>
        </div>
      </section>

      <HomeFormatCards
        sectionId="historias"
        onRecordVideo={onRecordVideo}
        onRecordAudio={onRecordAudio}
        onWriteStory={onWriteStory}
        onRecordPhoto={onRecordPhoto}
      />
      </div>
    </>
  );
}
