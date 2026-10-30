'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeFirstPartSiteHeader } from '@/components/home/HomeFirstPartSiteHeader';
import { HomeFormatCards } from '@/components/home/HomeFormatCards';
import type { ContarPregunta } from '@/lib/contar-routes';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';

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

const GREET_TYPED_KEY = 'almamundi-hero-share-typed';

function greetPauseAt(text: string): number {
  if (text.startsWith('Hola,')) return 'Hola,'.length;
  if (text.startsWith('Olá,')) return 'Olá,'.length;
  if (text.startsWith('Hi,')) return 'Hi,'.length;
  return 0;
}

function greetAlreadyComplete(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  try {
    return sessionStorage.getItem(GREET_TYPED_KEY) === '1';
  } catch {
    return true;
  }
}

function HeroGreeting() {
  const { t } = useHomeLocale();
  const full = t.heroShareToday;
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useLayoutEffect(() => {
    if (!greetAlreadyComplete()) return;
    setCount(full.length);
    setDone(true);
  }, [full]);

  useEffect(() => {
    if (greetAlreadyComplete()) return;

    setCount(0);
    setDone(false);
    const pauseAt = greetPauseAt(full);
    let i = 0;
    let timer = 0;
    const tick = () => {
      i += 1;
      setCount(i);
      if (i >= full.length) {
        setDone(true);
        try {
          sessionStorage.setItem(GREET_TYPED_KEY, '1');
        } catch {
          /* la frase ya quedó completa */
        }
        return;
      }
      timer = window.setTimeout(tick, i === pauseAt ? 600 : 45);
    };
    timer = window.setTimeout(tick, 45);
    return () => window.clearTimeout(timer);
  }, [full]);

  return (
    <p
      className="relative mb-3 w-full text-center text-[15px] leading-snug"
      style={{ color: soft.textBody, fontWeight: 500 }}
      aria-label={full}
    >
      <span className="invisible block" aria-hidden="true">
        {full}
      </span>
      <span className="absolute inset-x-0 top-0 block" aria-hidden="true">
        {full.slice(0, count)}
        {done ? null : <span className="hero-greet-caret" />}
      </span>
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
  /** Si la persona llegó desde un hilo, las tarjetas conservan `?pregunta=`. */
  pregunta?: ContarPregunta | null;
};

export function HomeFirstPart({
  onShowPurpose,
  onShowComoFunciona,
  onRecordVideo,
  onRecordAudio,
  onWriteStory,
  onRecordPhoto,
  onMediaEducation: _onMediaEducation,
  basePath: _basePath = '',
  pregunta = null,
}: HomeFirstPartProps) {
  const { t, locale } = useHomeLocale();

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
              <span className="home-hero-hand">{t.heroHandScript}</span>
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
        pregunta={pregunta}
      />
      </div>
      <p className="mx-auto mb-4 mt-2 max-w-[min(100%,40rem)] px-6 text-center md:mb-8">
        <Link
          href="/preguntas"
          className="inline-flex min-h-11 items-center text-center text-[length:var(--fs-pequeno)] font-medium text-[#4A5568] underline decoration-[#FF4A1C]/40 underline-offset-4 hover:text-[#FF4A1C] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF4A1C]"
        >
          {HILOS_UI[locale].entrada}
        </Link>
      </p>
    </>
  );
}
