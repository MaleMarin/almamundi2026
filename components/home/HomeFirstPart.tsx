'use client';

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
const CINTA_PILL = ['#FF4A1C', '#E5A100', '#D94F8C', '#4C8C3A', '#8E4FD6'] as const;

const soft = {
  textMain: '#4A5568',
} as const;

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
  /** Píldora bajo las tarjetas. En /contar queda el enlace de siempre. */
  cintaPill?: boolean;
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
  cintaPill = false,
}: HomeFirstPartProps) {
  const { t, locale } = useHomeLocale();

  return (
    <>
      <HomeFirstPartSiteHeader
        scope="home"
        onShowPurpose={onShowPurpose}
        onShowComoFunciona={onShowComoFunciona}
      />

      <div className="lg:mt-[13.5rem]">
      <section
        id="intro"
        className="home-intro-avenir relative z-[20] flex shrink-0 scroll-mt-[9.75rem] flex-col items-center px-6 pb-2 pt-[12.75rem] text-center sm:pb-2 md:scroll-mt-[12.25rem] md:px-10 md:pb-3 md:pt-[15.25rem] lg:min-h-0 lg:shrink-0 lg:scroll-mt-[13.5rem] lg:px-10 lg:pb-0 lg:pt-0"
      >
        <div aria-hidden className="home-hero-head-gap" />
        <div className="mx-auto w-full max-w-[min(100%,42rem)] shrink-0 lg:max-w-[1000px]">
          <div className="home-first-part-float relative">
            <h1
              className="mx-auto mb-2 max-w-[min(100%,42rem)] leading-[1.15] md:mb-3 lg:max-w-[1000px] text-[length:var(--fs-titular)]"
              style={{ color: soft.textMain, fontWeight: 400 }}
            >
              {t.heroScrollBefore}{' '}
              <span className="mt-1 block" style={{ fontWeight: 700 }}>{t.heroScrollBold}</span>
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
      {cintaPill ? (
        <p className="mx-auto mb-4 mt-2 flex justify-center px-6 md:mb-8">
          <Link
            href="/preguntas"
            className="cinta-pill focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF4A1C]"
            style={{ color: '#B8340F' }}
          >
            <span className="cinta-pill-minis" aria-hidden>
              {CINTA_PILL.map((color, index) => (
                <span
                  key={color}
                  className="cinta-satin cinta-pill-mini"
                  style={{ backgroundColor: color, animationDelay: `${index * 0.16}s`, height: 22 + (index % 3) * 6 }}
                />
              ))}
            </span>
            {HILOS_UI[locale].pill}
          </Link>
        </p>
      ) : (
      <p className="mx-auto mb-4 mt-2 max-w-[min(100%,40rem)] px-6 text-center md:mb-8">
        <Link
          href="/preguntas"
          className="inline-flex min-h-11 items-center text-center text-[length:var(--fs-pequeno)] font-medium text-[#4A5568] underline decoration-[#FF4A1C]/40 underline-offset-4 hover:text-[#FF4A1C] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF4A1C]"
        >
          {HILOS_UI[locale].entrada}
        </Link>
      </p>
      )}
    </>
  );
}
