'use client';

import type { ReactNode } from 'react';
import { DM_Sans } from 'next/font/google';
import { SITE_FONT_STACK } from '@/lib/typography';

/** Tipografía minimalista solo para el hero (frase principal + subtítulo). */
const homeHeroPhrase = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
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
      className="relative w-full max-w-[400px] min-h-[450px] flex-1 rounded-[40px] p-8 flex flex-col items-start transition-all duration-500 hover:-translate-y-2 group animate-float home-neu-card"
      style={{ ...soft.flat, animationDelay: delay, fontFamily: APP_FONT }}
    >
      <div className="mb-5 shrink-0">
        <h3 className="text-xl md:text-2xl font-light text-gray-500 leading-tight">{title}</h3>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-700 leading-tight mt-1">{subtitle}</h2>
      </div>
      <div className="flex-1 min-h-[80px] w-full" />
      <div className="w-full mt-auto">
        <p className="text-gray-500 leading-relaxed text-base md:text-lg mb-6">{children}</p>
        <button
          onClick={onClick}
          className="btn-almamundi home-neu-btn w-full flex justify-center px-8 py-4 md:py-5 rounded-full text-sm font-black tracking-[0.2em] text-orange-500 uppercase transition-all active:scale-95"
          style={soft.button}
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
  onShowInspiration: () => void;
  onRecordVideo: () => void;
  onRecordAudio: () => void;
  onWriteStory: () => void;
  onUploadPhoto: () => void;
  /** Historias: ancla #historias. Mapa: sección del mapa en la home `/#mapa`. */
  basePath?: string;
};

export function HomeFirstPart({
  onShowPurpose,
  onShowInspiration,
  onRecordVideo,
  onRecordAudio,
  onWriteStory,
  onUploadPhoto,
  basePath = ''
}: HomeFirstPartProps) {
  const historiasHref = basePath ? `${basePath}#historias` : '#historias';
  const baseNorm = basePath.replace(/\/$/, '');
  const mapaHref = basePath ? (baseNorm ? `${baseNorm}#mapa` : '/#mapa') : '/#mapa';

  return (
    <>
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .home-neu-card {
          transition: box-shadow 0.35s ease, transform 0.5s ease;
        }
        .home-neu-card:hover {
          box-shadow:
            18px 18px 42px rgba(120, 135, 155, 0.42),
            -18px -18px 46px rgba(255, 255, 255, 1),
            inset 2px 2px 5px rgba(255, 255, 255, 0.85),
            inset -4px -4px 10px rgba(163, 177, 198, 0.18) !important;
        }
        .home-neu-btn {
          transition: box-shadow 0.25s ease, transform 0.2s ease;
        }
        .home-neu-btn:hover {
          box-shadow:
            13px 13px 30px rgba(120, 135, 155, 0.4),
            -13px -13px 30px rgba(255, 255, 255, 1),
            inset 2px 2px 4px rgba(255, 255, 255, 0.75),
            inset -2px -2px 7px rgba(163, 177, 198, 0.15) !important;
        }
        .home-neu-btn:active {
          box-shadow:
            inset 6px 6px 14px rgba(163, 177, 198, 0.45),
            inset -4px -4px 12px rgba(255, 255, 255, 0.85) !important;
        }
      `}</style>

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 md:px-14 h-32 md:h-40 lg:h-44 bg-[#E0E5EC]/70 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center shrink-0">
          <img
            src="/logo.png"
            alt="AlmaMundi"
            className="h-28 md:h-36 lg:h-40 xl:h-44 w-auto object-contain object-left select-none filter drop-shadow-md"
          />
        </div>
        <nav className="hidden md:flex gap-4 lg:gap-6 text-base font-bold text-gray-600 items-center">
          <button onClick={onShowPurpose} className="btn-almamundi home-neu-btn px-8 py-3.5 md:px-10 md:py-4 active:scale-95" style={soft.button} type="button">
            Propósito
          </button>
          <button onClick={onShowInspiration} className="home-neu-btn px-8 py-3.5 md:px-10 md:py-4 active:scale-95 hover:text-gray-700 flex items-center gap-2" style={soft.button} type="button">
            Inspiración
          </button>
          <a href={historiasHref} className="btn-almamundi home-neu-btn px-8 py-3.5 md:px-10 md:py-4 active:scale-95" style={soft.button}>
            Historias
          </a>
          <a href={mapaHref} className="btn-almamundi home-neu-btn px-8 py-3.5 md:px-10 md:py-4 active:scale-95" style={soft.button}>
            Mapa
          </a>
        </nav>
      </header>

      {/* INTRO — DM Sans: sans geométrica minimalista (solo esta franja) */}
      <section
        id="intro"
        className={`${homeHeroPhrase.className} pt-48 sm:pt-52 md:pt-60 lg:pt-72 pb-8 md:pb-12 px-6 md:px-10 relative z-10 flex flex-col items-center text-center`}
      >
        <div className="max-w-5xl lg:max-w-6xl animate-float">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.12] mb-5 md:mb-6" style={{ color: soft.textMain }}>
            AlmaMundi es el lugar donde tus historias no se pierden en el scroll, sino que{' '}
            <span className="font-medium">despiertan otras historias.</span>
          </h1>
          <div
            className="w-28 md:w-32 h-1.5 md:h-2 rounded-full mx-auto mb-5 md:mb-6"
            style={{ backgroundColor: 'var(--almamundi-orange, #ff4500)', boxShadow: '0 0 12px rgba(255, 69, 0, 0.45)' }}
            aria-hidden
          />
          <p className="pt-3 md:pt-4 text-lg md:text-xl lg:text-2xl font-light tracking-wide max-w-4xl mx-auto leading-[1.65]" style={{ color: soft.textBody }}>
            Aquí, cada relato importa. <span className="font-normal">Cada historia es extraordinaria.</span>
          </p>
        </div>
      </section>

      {/* CARDS — un poco más arriba que antes; más hueco entre tarjetas */}
      <section id="historias" className="w-full px-4 sm:px-8 md:px-12 lg:px-16 pt-8 md:pt-10 lg:pt-12 pb-16 md:pb-20 mb-12 md:mb-16 flex flex-col md:flex-row flex-wrap gap-y-10 md:gap-y-12 gap-x-8 md:gap-x-10 lg:gap-x-14 justify-center items-stretch relative z-10">
        <SoftCard title="Tu historia," subtitle="en primer plano" buttonLabel="GRABA TU VIDEO" onClick={onRecordVideo} delay="0s">
          A veces, una mirada lo dice todo. Anímate a <strong>grabar ese momento que te marcó</strong>, una experiencia que viviste o que alguien más te contó. <em className="text-gray-500 not-italic">(Video de hasta 5 minutos.)</em>
        </SoftCard>
        <SoftCard title="Dale voz" subtitle="a tu recuerdo" buttonLabel="GRABA TU AUDIO" onClick={onRecordAudio} delay="0.2s">
          Hay historias que se sienten mejor cuando solo se escuchan. <strong>Graba tu relato en audio</strong> y deja que tu voz haga el resto. <em className="text-gray-500 not-italic">(Audio de hasta 5 minutos.)</em>
        </SoftCard>
        <SoftCard title="Ponle palabras" subtitle="a tu historia" buttonLabel="ESCRIBE TU HISTORIA" onClick={onWriteStory} delay="0.4s">
          Si lo tuyo es escribir, este es tu lugar. Tómate un respiro y <strong>cuenta tu historia a tu ritmo</strong>, palabra por palabra.
        </SoftCard>
        <SoftCard title="Tu mirada," subtitle="en una fotografía" buttonLabel="SUBE UNA FOTO" onClick={onUploadPhoto} delay="0.6s">
          A veces, una imagen guarda lo que las palabras no alcanzan.
        </SoftCard>
      </section>
    </>
  );
}
