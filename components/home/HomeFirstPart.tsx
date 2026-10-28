'use client';

import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeFirstPartSiteHeader } from '@/components/home/HomeFirstPartSiteHeader';
import { HomeFormatCards } from '@/components/home/HomeFormatCards';

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
    ].join(', ') } } as const;

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
        className="home-intro-avenir relative z-[20] flex shrink-0 scroll-mt-[9.75rem] flex-col items-center px-6 pb-2 pt-[11.25rem] text-center sm:pt-[11.5rem] sm:pb-2 md:scroll-mt-[12.25rem] md:px-10 md:pb-3 md:pt-[13.75rem] lg:scroll-mt-[13.5rem] lg:px-10 lg:pb-0 lg:pt-16"
      >
        <div className="mx-auto w-full max-w-[min(100%,42rem)]">
          <div className="home-first-part-float relative">
            <h1
              className="mx-auto mb-2 max-w-[min(100%,42rem)] font-normal leading-[1.15] md:mb-3 lg:mb-10 text-[length:var(--fs-titular)]"
              style={{
                color: soft.textMain }}
            >
              {t.heroBeforeBold}{' '}
              <span className="font-bold">{t.heroBold}</span>
            </h1>
            <svg
              width="360"
              height="12"
              viewBox="0 0 360 12"
              className="home-intro-underline mx-auto mb-[10px] mt-[10px] block w-[min(100%,280px)] max-w-full lg:mt-0"
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
