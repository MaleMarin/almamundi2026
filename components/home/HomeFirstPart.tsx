'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PillNavButton } from '@/components/home/PillNavButton';
import { MAP_HOME_HEADER_NAV_CLASS } from '@/lib/map-home-neu-button';
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
  const historiasHref = basePath ? `${basePath}#historias` : '#historias';
  const baseNorm = basePath.replace(/\/$/, '');
  const mapaHref = basePath ? (baseNorm ? `${baseNorm}#mapa` : '/#mapa') : '/#mapa';

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const particles: { x: number; y: number; r: number; vy: number; vx: number; o: number }[] = [];

    function init() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      particles.length = 0;
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.3 + 0.3,
          vy: -(Math.random() * 0.22 + 0.07),
          vx: (Math.random() - 0.5) * 0.1,
          o: Math.random() * 0.1 + 0.035,
        });
      }
    }

    function drawBokeh(W: number, H: number) {
      const spots = [
        { x: W * 0.28, y: H * 0.35, r: 90, c: [255, 175, 90] as [number, number, number], a: 0.055 },
        { x: W * 0.3, y: H * 0.7, r: 65, c: [255, 155, 70] as [number, number, number], a: 0.04 },
        { x: W * 0.72, y: H * 0.4, r: 75, c: [130, 185, 235] as [number, number, number], a: 0.04 },
        { x: W * 0.12, y: H * 0.55, r: 55, c: [255, 205, 130] as [number, number, number], a: 0.035 },
        { x: W * 0.88, y: H * 0.65, r: 60, c: [170, 210, 245] as [number, number, number], a: 0.035 },
        { x: W * 0.5, y: H * 0.2, r: 45, c: [220, 190, 160] as [number, number, number], a: 0.025 },
      ];
      spots.forEach((s) => {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        g.addColorStop(0, `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${s.a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });
    }

    function loop() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      drawBokeh(W, H);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120,130,155,${p.o})`;
        ctx.fill();
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < -3) {
          p.y = H + 3;
          p.x = Math.random() * W;
        }
        if (p.x < -3) p.x = W + 3;
        if (p.x > W + 3) p.x = -3;
      });
      animId = requestAnimationFrame(loop);
    }

    init();
    loop();

    const onResize = () => init();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

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
      `}</style>

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between gap-3 px-6 md:px-14 h-32 md:h-40 lg:h-44 bg-[#E0E5EC]/70 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center shrink-0 min-w-0">
          <img
            src="/logo.png"
            alt="AlmaMundi"
            className="h-28 md:h-36 lg:h-40 xl:h-44 w-auto object-contain object-left select-none filter drop-shadow-md"
          />
        </div>
        <div className="flex items-center justify-end shrink-0">
          <button
            type="button"
            className="md:hidden flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-gray-600 transition-shadow active:scale-[0.98]"
            style={soft.button}
            aria-expanded={mobileNavOpen}
            aria-controls="home-header-mobile-nav"
            aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <X size={22} strokeWidth={2} aria-hidden /> : <Menu size={22} strokeWidth={2} aria-hidden />}
          </button>
          <nav className={MAP_HOME_HEADER_NAV_CLASS} aria-label="Navegación principal">
            <PillNavButton onClick={onShowPurpose}>Propósito</PillNavButton>
            <PillNavButton onClick={onShowComoFunciona}>¿Cómo funciona?</PillNavButton>
            <PillNavButton href={historiasHref}>Historias</PillNavButton>
            <PillNavButton href={mapaHref}>Mapa</PillNavButton>
          </nav>
        </div>

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed left-0 right-0 bottom-0 z-[98] bg-black/25 md:hidden"
              style={{ top: '8rem' }}
              aria-label="Cerrar menú"
              onClick={closeMobileNav}
            />
            <div
              id="home-header-mobile-nav"
              className="absolute left-0 right-0 top-full z-[102] flex flex-col gap-3 border-b border-white/25 bg-[#E0E5EC]/96 px-4 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-lg md:hidden"
              role="navigation"
              aria-label="Navegación principal"
            >
              <PillNavButton
                onClick={() => {
                  onShowPurpose();
                  closeMobileNav();
                }}
              >
                Propósito
              </PillNavButton>
              <PillNavButton
                onClick={() => {
                  onShowComoFunciona();
                  closeMobileNav();
                }}
              >
                ¿Cómo funciona?
              </PillNavButton>
              <PillNavButton href={historiasHref} onAfterClick={closeMobileNav}>
                Historias
              </PillNavButton>
              <PillNavButton href={mapaHref} onAfterClick={closeMobileNav}>
                Mapa
              </PillNavButton>
            </div>
          </>
        ) : null}
      </header>

      {/* INTRO — DM Sans: sans geométrica minimalista (solo esta franja) */}
      <section
        id="intro"
        className={`${homeHeroPhrase.className} relative z-10 flex flex-col items-center overflow-hidden pt-48 text-center sm:pt-52 md:pt-60 md:pb-14 lg:pt-72 pb-10 px-6 md:px-10`}
      >
        <div className="relative w-full max-w-5xl overflow-hidden lg:max-w-6xl">
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          />
          <div className="animate-float relative z-[1]">
            <h1
              className="mb-5 font-light leading-[1.12] md:mb-6"
              style={{
                color: soft.textMain,
                fontSize: '50px',
                letterSpacing: '-0.02em',
              }}
            >
              AlmaMundi es el lugar donde tus historias no se pierden en el scroll, sino que{' '}
              <span className="font-extrabold">despiertan otras historias.</span>
            </h1>
            <svg
              width="360"
              height="12"
              viewBox="0 0 360 12"
              className="mx-auto block"
              style={{ margin: '14px auto 22px' }}
              aria-hidden
            >
              <path
                d="M4 8 Q90 12 180 8 Q270 4 356 8"
                stroke="#FF4A1C"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={360}
                strokeDashoffset={360}
                style={{
                  animation: 'drawUnderline 1.3s cubic-bezier(0.4,0,0.2,1) forwards 0.2s',
                }}
              />
            </svg>
            <p
              className="mx-auto max-w-4xl pt-3 font-light leading-[1.65] md:pt-4 text-xl tracking-wide md:text-2xl lg:text-3xl"
              style={{ color: soft.textBody }}
            >
              Aquí, cada relato importa. <span className="font-normal">Cada historia es extraordinaria.</span>
            </p>
          </div>
        </div>
      </section>

      {/* CARDS — más aire bajo el hero y mayor separación entre tarjetas */}
      <section id="historias" className="w-full px-4 sm:px-8 md:px-12 lg:px-16 pt-14 md:pt-20 lg:pt-24 pb-16 md:pb-20 mb-12 md:mb-16 flex flex-col md:flex-row flex-wrap gap-y-12 md:gap-y-14 gap-x-10 md:gap-x-12 lg:gap-x-16 justify-center items-stretch relative z-10">
        <SoftCard title="Tu historia," subtitle="en primer plano" buttonLabel="GRABA TU VIDEO" onClick={onRecordVideo} delay="0s">
          A veces, una mirada lo dice todo. Anímate a <strong>grabar ese momento que te marcó</strong>, una experiencia que viviste o que alguien más te contó.
        </SoftCard>
        <SoftCard title="Dale voz" subtitle="a tu recuerdo" buttonLabel="GRABA TU AUDIO" onClick={onRecordAudio} delay="0.2s">
          Hay historias que se sienten mejor cuando solo se escuchan. <strong>Graba tu relato en audio</strong> y deja que tu voz haga el resto.
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
