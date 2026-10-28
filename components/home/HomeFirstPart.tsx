'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeFirstPartSiteHeader } from '@/components/home/HomeFirstPartSiteHeader';
import { HomeFormatCards } from '@/components/home/HomeFormatCards';
import { contarIndexHref } from '@/lib/contar-routes';
import { PREGUNTA_UI, preguntasDeLaSemana } from '@/lib/pregunta-semana';

/**
 * Primera parte de la home (header + intro + tarjetas).
 * LOCK diseño: tarjetas neumórficas E0E5EC; SoftCard tamaño marzo 2026 (max-w 400px, min-h 450px).
 */

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
      '22px 22px 52px rgba(120, 135, 155, 0.58)',
      '-20px -20px 52px rgba(255, 255, 255, 1)',
      'inset 3px 3px 6px rgba(255, 255, 255, 0.92)',
      'inset -5px -5px 14px rgba(140, 155, 175, 0.34)',
    ].join(', '),
  },
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
  const { t, locale } = useHomeLocale();
  const preguntaVigente = preguntasDeLaSemana().vigente;

  return (
    <>
      <HomeFirstPartSiteHeader
        scope="home"
        onShowPurpose={onShowPurpose}
        onShowComoFunciona={onShowComoFunciona}
      />

      {/* INTRO — Avenir (misma pila que «Mapa de AlmaMundi», globals.css .home-intro-avenir) */}
      <section
        id="intro"
        className="home-intro-avenir relative z-[20] flex scroll-mt-[9.75rem] flex-col items-center px-6 pb-4 pt-[11.25rem] text-center sm:pt-[11.5rem] sm:pb-5 md:scroll-mt-[12.25rem] md:px-10 md:pb-6 md:pt-[13.75rem] lg:scroll-mt-[13.5rem] lg:pt-[15.25rem] lg:pb-6"
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
        <div className="mx-auto mt-6 w-full max-w-[min(100%,46rem)]">
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-[1.75rem] px-4 py-3 text-center sm:flex-row sm:px-5 sm:py-3.5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.42)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <p className="m-0 max-w-full text-[0.95rem] leading-snug sm:max-w-[36rem] sm:text-base" style={{ color: soft.textMain }}>
              <span className="font-semibold">{PREGUNTA_UI.semana[locale]}</span>{' '}
              {preguntaVigente.tu[locale]}
            </p>
            <Link
              href={contarIndexHref({ id: preguntaVigente.id, mode: 'tu' })}
              className="btn-am-principal inline-flex min-h-11 w-full shrink-0 items-center justify-center px-5 py-2.5 text-sm font-semibold sm:w-auto"
            >
              {PREGUNTA_UI.responder[locale]}
            </Link>
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
    </>
  );
}
