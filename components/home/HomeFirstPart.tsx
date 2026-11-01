'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { HomeFirstPartSiteHeader } from '@/components/home/HomeFirstPartSiteHeader';
import { HomeFormatCards } from '@/components/home/HomeFormatCards';
import type { ContarPregunta } from '@/lib/contar-routes';
import { CapituloHome } from '@/components/home/CapituloHome';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';

/**
 * Primera parte de la home (header + intro + tarjetas).
 * LOCK diseño: tarjetas neumórficas E0E5EC; SoftCard tamaño marzo 2026 (max-w 400px, min-h 450px).
 */

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
        className="home-intro-avenir relative z-[20] flex shrink-0 scroll-mt-[9.75rem] flex-col items-center pb-0 pt-[calc(9.75rem+clamp(32px,5vw,64px))] text-center md:scroll-mt-[12.25rem] md:pt-[calc(12.25rem+clamp(32px,5vw,64px))] lg:min-h-0 lg:shrink-0 lg:scroll-mt-[13.5rem] lg:pt-0"
      >
        <div aria-hidden className="home-hero-head-gap" />
        <CapituloHome
          nivel="h1"
          ceja={t.cejaCuenta}
          titulo={t.heroBeforeBold}
          tituloFuerte={`${t.heroBold},`}
          cita={`${t.heroHandScript}.`}
          bajada={t.bajadaCuenta}
          bajadaFuerte={`${t.historiasLead2b}.`}
        />
      </section>

      <HomeFormatCards
        sectionId="historias"
        sinEtiqueta
        onRecordVideo={onRecordVideo}
        onRecordAudio={onRecordAudio}
        onWriteStory={onWriteStory}
        onRecordPhoto={onRecordPhoto}
        pregunta={pregunta}
      />
      </div>
      {cintaPill ? null : (
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
