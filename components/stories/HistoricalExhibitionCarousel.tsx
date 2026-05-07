'use client';

/**
 * Carrusel 3D con Swiper (effect: coverflow), glassmorphism y desenfoque en laterales.
 * Panel inferior de autor sincronizado con la diapositiva activa.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { EffectCoverflow, Keyboard } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Images,
  Play,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/effect-coverflow';

import type { HistoricalExhibitionStory } from '@/lib/historias/historical-exhibition-demo';

import { EthicalShareFlow, EthicalShareTriggerButton } from './EthicalShareFlow';
import { ResonanceMailbox } from './ResonanceMailbox';
import { DemoStoryDisclosure } from '@/components/stories/DemoStoryDisclosure';

export type ExhibitionContentMode = 'video' | 'audio' | 'texto' | 'foto';

export type HistoricalExhibitionCarouselProps = {
  historias: HistoricalExhibitionStory[];
  tituloExposicion?: string;
  backgroundImageUrl?: string;
  className?: string;
  /** Dentro de layout con nav/footer */
  embedded?: boolean;
  /** Qué tipo de historia se abre en modal (misma página) */
  contentMode?: ExhibitionContentMode;
  onSlideChange?: (index: number) => void;
  /** Abrir video / audio / lector / álbum en la misma página */
  onOpenContent?: (index: number) => void;
  /** @deprecated usar onOpenContent */
  onOpenVideo?: (index: number) => void;
  disableKeyboardNav?: boolean;
  /**
   * `light-gallery`: sala clara con gradiente cenital y vidrio (p. ej. /historias/videos).
   * `immersive`: museo oscuro con foto de sala. Ambos usan perspective 1500px + coverflow 3D.
   */
  spatialVariant?: 'immersive' | 'light-gallery';
  /** Reemplaza el padding-top del bloque del carrusel (Tailwind), p. ej. `pt-10 sm:pt-14` para subir las tarjetas. */
  expoPaddingTopClassName?: string;
  /** Ancho máximo del bloque expo (Tailwind). Por defecto `max-w-[1400px]`. */
  expoMaxWidthClassName?: string;
  /**
   * Si es false, no se muestra el botón ni el flujo de compartir en el chrome del carrusel
   * (útil cuando la página monta su propio compartir encima del carrusel).
   */
  shareInGalleryChrome?: boolean;
  /**
   * Si es false, no se muestra el buzón de resonancia en la barra superior del carrusel
   * (p. ej. cuando el layout lo coloca junto a la carta en los filtros).
   */
  showMailboxInGalleryChrome?: boolean;
};

/** Ligeramente mayor que 15 cm a 96dpi; sin pasarse de ancho móvil */
const SLIDE_PX = 620;

/** Galería minimalista (techos altos): plano Z lejano; el carrusel va delante con paralaje. */
const HALL_DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1518996993268-4e0ccecd3e35?auto=format&fit=crop&w=2400&q=80';

function segmentForMode(mode: ExhibitionContentMode): string {
  if (mode === 'audio') return 'audio';
  if (mode === 'texto') return 'texto';
  if (mode === 'foto') return 'foto';
  return 'video';
}

function canOpenPrimary(
  h: HistoricalExhibitionStory,
  mode: ExhibitionContentMode
): boolean {
  if (mode === 'video') return Boolean(h.videoUrl);
  if (mode === 'audio') return Boolean(h.audioUrl);
  return true;
}

function primaryOpenLabel(mode: ExhibitionContentMode): string {
  if (mode === 'video') return 'Ver historia';
  if (mode === 'audio') return 'Escuchar historia';
  if (mode === 'texto') return 'Leer historia';
  return 'Ver fotografías';
}

/** Máx. inclinación por tarjeta (solo rotación local; sin mover el carrusel entero). */
const CARD_TILT_MAX_DEG = 12;

/** Hooks siempre en el mismo orden: subcomponente separado (no condicional). */
function ExpoCardTiltInteractive({ children }: { children: ReactNode }) {
  const onMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const ry = Math.max(-CARD_TILT_MAX_DEG, Math.min(CARD_TILT_MAX_DEG, px * 2 * CARD_TILT_MAX_DEG));
    const rx = Math.max(-CARD_TILT_MAX_DEG, Math.min(CARD_TILT_MAX_DEG, -py * 2 * CARD_TILT_MAX_DEG));
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, []);

  const onLeave = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }, []);

  return (
    <div
      className="h-full w-full"
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.2s ease-out',
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}

/**
 * Tilt por tarjeta: el mouse es relativo al rect de esta slide; solo rotateX/Y (sin translate global).
 */
function ExpoCardTiltShell({
  children,
  disableTilt = false,
}: {
  children: ReactNode;
  /** Listados /historias/*: tarjeta estable (sin inclinación por mouse). */
  disableTilt?: boolean;
}) {
  if (disableTilt) {
    return <div className="h-full w-full">{children}</div>;
  }
  return <ExpoCardTiltInteractive>{children}</ExpoCardTiltInteractive>;
}

export function HistoricalExhibitionCarousel({
  historias,
  tituloExposicion = 'Exposición histórica',
  backgroundImageUrl,
  className = '',
  embedded = false,
  contentMode = 'video',
  onSlideChange,
  onOpenContent,
  onOpenVideo,
  disableKeyboardNav = false,
  spatialVariant = 'immersive',
  expoPaddingTopClassName,
  expoMaxWidthClassName,
  shareInGalleryChrome = true,
  showMailboxInGalleryChrome = true,
}: HistoricalExhibitionCarouselProps) {
  const openHandler = onOpenContent ?? onOpenVideo;
  const isLightHall = spatialVariant === 'light-gallery';
  /** Listados /historias/* (layout comparte filtros y carrusel sin chrome de compartir en la expo). */
  const historiasListEmbedded = embedded && isLightHall && !shareInGalleryChrome;
  const swiperRef = useRef<SwiperType | null>(null);
  const n = historias.length;
  const initialSlide = useMemo(
    () => (n === 0 ? 0 : Math.min(Math.floor(n / 2), n - 1)),
    [n]
  );
  const [activeIndex, setActiveIndex] = useState(
    () => (historias.length === 0 ? 0 : Math.min(Math.floor(historias.length / 2), historias.length - 1))
  );
  const [ethicalShareOpen, setEthicalShareOpen] = useState(false);

  const active = historias[activeIndex] ?? null;

  /** Listas /historias/* (embebidas, sala clara): flechas siempre visibles; con 1 sola tarjeta quedan deshabilitadas. */
  const showExpoNavArrows = (embedded && isLightHall) || n > 1;
  const expoNavArrowsDisabled = n <= 1;

  useEffect(() => {
    queueMicrotask(() => {
      if (n === 0) {
        setActiveIndex(0);
        return;
      }
      setActiveIndex((i) => Math.min(i, n - 1));
    });
  }, [n]);

  useEffect(() => {
    onSlideChange?.(activeIndex);
  }, [activeIndex, onSlideChange]);

  const metaLine = useMemo(() => {
    if (!active) return '';
    return [active.fecha, active.lugar].filter(Boolean).join(' · ');
  }, [active]);

  const shareUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    if (active?.id)
      return `${origin}/historias/${active.id}/${segmentForMode(contentMode)}`;
    return window.location.href;
  }, [active, contentMode]);

  const shellClass = embedded
    ? isLightHall
      ? `relative isolate w-full overflow-hidden rounded-2xl text-gray-900${historiasListEmbedded ? ' flex min-h-0 flex-1 flex-col' : ''}`
      : 'relative isolate w-full overflow-hidden rounded-2xl text-white'
    : isLightHall
      ? 'relative isolate min-h-screen w-full overflow-hidden text-gray-900'
      : 'relative isolate min-h-screen w-full overflow-hidden text-white';

  const hallImageSrc = backgroundImageUrl ?? HALL_DEFAULT_IMAGE;

  if (n === 0) {
    return (
      <div
        className={`flex min-h-[40vh] items-center justify-center px-6 text-center text-base ${embedded && isLightHall ? 'text-gray-600' : 'text-white/70'} ${className}`}
        role="status"
      >
        No hay historias para mostrar en este formato.
      </div>
    );
  }

  return (
    <div className={`${shellClass} ${className}`}>
      {/*
        Capa 3 — The Hall (z-1): inmersivo = foto de sala; light-gallery = gradiente cenital + viñeta (paredes).
      */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        aria-hidden
      >
        <div className="absolute -inset-[12%]">
          {isLightHall ? (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at top, #f0f0f5 0%, #d9d9e3 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  boxShadow:
                    'inset 0 0 160px rgba(0,0,0,0.14), inset 0 0 72px rgba(0,0,0,0.09), inset 0 -100px 120px rgba(0,0,0,0.06)',
                }}
              />
            </>
          ) : (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${hallImageSrc})` }}
              />
              <div
                className="absolute inset-0 backdrop-blur-[7px]"
                style={{
                  background:
                    'radial-gradient(circle at top center, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.5) 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: [
                    'radial-gradient(ellipse 72% 58% at 50% 4%, rgba(255, 252, 248, 0.18) 0%, transparent 52%)',
                    'linear-gradient(180deg, rgba(12, 14, 22, 0.35) 0%, rgba(6, 7, 14, 0.88) 100%)',
                  ].join(', '),
                }}
              />
            </>
          )}
        </div>
      </div>

      <style>{`
        .historical-expo-swiper.swiper {
          overflow: visible;
        }
        .historical-expo-swiper .swiper-slide {
          transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), filter 0.45s ease;
          overflow: visible;
          transform-style: preserve-3d;
        }
        .historical-expo-swiper .swiper-slide:not(.swiper-slide-active) {
          opacity: 0.7;
          filter: blur(4px);
        }
        .historical-expo-swiper .swiper-slide-active {
          opacity: 1;
          filter: none;
        }
        .historical-expo-swiper .swiper-slide .hec-card-inner {
          transition: transform 0.38s ease, background-color 0.38s ease;
          transform-style: preserve-3d;
        }
        .historical-expo-swiper .swiper-slide:not(.swiper-slide-active) .hec-card-inner {
          transform: scale(0.92);
          background-color: rgba(0, 0, 0, 0.28);
        }
        /* Sala clara: menos contraste lateral; centro protagonista */
        .historical-expo-swiper--light-gallery .swiper-slide:not(.swiper-slide-active) {
          opacity: 0.72;
          filter: saturate(0.92);
        }
        .historical-expo-swiper--light-gallery .swiper-slide:not(.swiper-slide-active) .hec-card-inner {
          transform: none;
          background-color: rgba(255, 255, 255, 0.18) !important;
          border-color: rgba(255, 255, 255, 0.38) !important;
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08) !important;
        }
        .historical-expo-swiper--light-gallery .swiper-slide-active .hec-card-inner {
          transform: none;
        }
        /** Listados /historias/* — escenario: centro completo; laterales como eco suave */
        .historical-expo-swiper--stage-gallery.historical-expo-swiper .swiper-slide {
          height: auto;
        }
        .historical-expo-swiper--stage-gallery .swiper-slide:not(.swiper-slide-active) {
          opacity: 0.5;
          filter: blur(5px) saturate(0.9);
          pointer-events: auto;
        }
        .historical-expo-swiper--stage-gallery .swiper-slide:not(.swiper-slide-active) .hec-stage-card-shell {
          transform: scale(0.88);
        }
        .historical-expo-swiper--stage-gallery .swiper-slide-active {
          opacity: 1 !important;
          filter: none !important;
          z-index: 4;
        }
        .historical-expo-swiper--stage-gallery .swiper-slide-active .hec-stage-card-shell {
          transform: scale(1);
          box-shadow: 0 32px 64px rgba(15,23,42,0.12), inset 2px 2px 0 rgba(255,255,255,0.94) !important;
        }
      `}</style>

      {/*
        Capa 2 — The Expo (z-10): carrusel y flechas; ficha narrador en listados dentro de la tarjeta central.
      */}
      <div
        className={`relative z-10 mx-auto flex w-full ${expoMaxWidthClassName ?? 'max-w-[1400px]'} flex-col items-center px-2 pb-4 sm:px-6 ${expoPaddingTopClassName ?? 'pt-20 sm:pt-24'}${historiasListEmbedded ? ' flex-1 justify-center pb-3 sm:px-2' : ''}`}
      >
        <div
          className={`relative w-full ${
            historiasListEmbedded
              ? 'flex flex-col items-center justify-center gap-0 py-3 sm:py-4'
              : ''
          }`}
          style={{
            perspective: '1500px',
            perspectiveOrigin: 'center center',
          }}
        >
          <div
            className={`relative w-full ${
              historiasListEmbedded
                ? 'flex shrink-0 items-center justify-center'
                : 'flex min-h-0 max-h-full flex-1 items-center justify-center'
            }`}
            style={
              embedded && isLightHall && !historiasListEmbedded
                ? { minHeight: 'min(92vw, 620px)' }
                : historiasListEmbedded
                  ? { minHeight: 'min(640px, max(470px, calc(100dvh - 17.5rem)))' }
                  : undefined
            }
          >
            {showExpoNavArrows ? (
              <>
                <button
                  type="button"
                  disabled={expoNavArrowsDisabled}
                  onClick={() => swiperRef.current?.slidePrev()}
                  className={
                    isLightHall
                      ? historiasListEmbedded
                        ? 'pointer-events-auto absolute left-0.5 top-1/2 z-[60] flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-400/38 bg-white/76 p-1.5 text-gray-700/90 shadow-[0_8px_24px_rgba(15,23,42,0.07)] backdrop-blur-lg transition hover:bg-white/92 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 sm:left-1 md:left-3'
                        : 'pointer-events-auto absolute left-1.5 top-1/2 z-[60] flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-400/42 bg-white/92 p-2 text-gray-800 shadow-[0_6px_22px_rgba(15,23,42,0.08)] backdrop-blur-md transition hover:bg-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/92 disabled:active:scale-100 sm:left-2.5 md:left-4'
                      : 'pointer-events-auto absolute left-0 top-1/2 z-[60] flex min-h-[52px] min-w-[52px] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/55 bg-black/45 p-3 text-white shadow-[0_4px_28px_rgba(0,0,0,0.5)] backdrop-blur-md transition hover:border-white/80 hover:bg-black/60 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-black/45 sm:left-1 md:left-2'
                  }
                  aria-label="Historia anterior"
                >
                  <ChevronLeft
                    className={
                      isLightHall && historiasListEmbedded
                        ? 'h-[1.1rem] w-[1.1rem] shrink-0 text-gray-600'
                        : isLightHall
                          ? 'h-[1.35rem] w-[1.35rem] shrink-0 text-gray-700'
                          : 'h-8 w-8 shrink-0'
                    }
                    strokeWidth={historiasListEmbedded ? 2.5 : 2.75}
                  />
                </button>
                <button
                  type="button"
                  disabled={expoNavArrowsDisabled}
                  onClick={() => swiperRef.current?.slideNext()}
                  className={
                    isLightHall
                      ? historiasListEmbedded
                        ? 'pointer-events-auto absolute right-0.5 top-1/2 z-[60] flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-400/38 bg-white/76 p-1.5 text-gray-700/90 shadow-[0_8px_24px_rgba(15,23,42,0.07)] backdrop-blur-lg transition hover:bg-white/92 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 sm:right-1 md:right-3'
                        : 'pointer-events-auto absolute right-1.5 top-1/2 z-[60] flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-400/42 bg-white/92 p-2 text-gray-800 shadow-[0_6px_22px_rgba(15,23,42,0.08)] backdrop-blur-md transition hover:bg-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/92 disabled:active:scale-100 sm:right-2.5 md:right-4'
                      : 'pointer-events-auto absolute right-0 top-1/2 z-[60] flex min-h-[56px] min-w-[56px] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-black/50 p-3 text-white shadow-[0_6px_32px_rgba(0,0,0,0.55)] backdrop-blur-md ring-2 ring-white/15 transition hover:border-white hover:bg-black/65 hover:ring-white/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-black/50 sm:right-1 md:right-2'
                  }
                  aria-label="Próxima historia"
                >
                  <ChevronRight
                    className={
                      isLightHall && historiasListEmbedded
                        ? 'h-[1.1rem] w-[1.1rem] shrink-0 text-gray-600'
                        : isLightHall
                          ? 'h-[1.35rem] w-[1.35rem] shrink-0 text-gray-700'
                          : 'h-9 w-9 shrink-0'
                    }
                    strokeWidth={historiasListEmbedded ? 2.5 : 2.75}
                  />
                </button>
              </>
            ) : null}
            <Swiper
          className={`historical-expo-swiper w-full${isLightHall ? ' historical-expo-swiper--light-gallery' : ''}${historiasListEmbedded ? ' historical-expo-swiper--stage-gallery' : ''}`}
          modules={[EffectCoverflow, Keyboard]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          initialSlide={initialSlide}
          slideToClickedSlide
          observer={historiasListEmbedded}
          observeParents={historiasListEmbedded}
          watchSlidesProgress
          keyboard={{ enabled: !disableKeyboardNav }}
          coverflowEffect={
            historiasListEmbedded
              ? { rotate: 8, stretch: -36, depth: 72, modifier: 1.12, slideShadows: false }
              : { rotate: 45, stretch: 0, depth: 300, modifier: 1, slideShadows: true }
          }
          onSwiper={(s) => {
            swiperRef.current = s;
            if (typeof window === 'undefined') return;
            const hash = window.location.hash.slice(1);
            if (!hash) return;
            const idx = historias.findIndex((h) => h.id === hash);
            if (idx >= 0) s.slideTo(idx, 0);
          }}
          onSlideChange={(s) => setActiveIndex(s.activeIndex)}
        >
          {historias.map((h, slideIdx) => {
            const isActiveSlide = slideIdx === activeIndex;
            const canOpenThis = Boolean(openHandler && canOpenPrimary(h, contentMode));
            const embeddedStageChrome = Boolean(historiasListEmbedded && isLightHall);

            if (embeddedStageChrome) {
              return (
                <SwiperSlide
                  key={h.id}
                  className="!h-auto pb-8 pt-1"
                  style={{
                    width: 'clamp(288px, 79vw, 428px)',
                    height: 'auto',
                  }}
                >
                  <ExpoCardTiltShell disableTilt>
                    <div
                      className="hec-stage-card-shell relative flex w-full flex-col overflow-hidden rounded-[22px] p-4 text-left sm:p-[1.15rem]"
                      style={{
                        backdropFilter: 'blur(20px) saturate(170%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
                        border: '1px solid rgba(255, 255, 255, 0.58)',
                        background: 'linear-gradient(168deg, rgba(255,255,255,0.58) 0%, rgba(235,239,246,0.42) 100%)',
                        boxShadow: '0 28px 58px rgba(15,23,42,0.1), inset 1px 1px 0 rgba(255,255,255,0.92)',
                      }}
                    >
                      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[14px] bg-gray-200/45 shadow-[inset_3px_3px_8px_rgba(163,177,198,0.35)]">
                        {/* eslint-disable-next-line @next/next/no-img-element -- URLs externas (picsum, etc.) */}
                        <img
                          src={h.imagen_principal}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        {isActiveSlide && openHandler && canOpenThis ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openHandler(slideIdx);
                            }}
                            className="pointer-events-auto absolute bottom-2.5 right-2.5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/52 bg-black/43 text-white shadow-lg backdrop-blur-md transition hover:bg-black/54"
                            aria-label={primaryOpenLabel(contentMode)}
                          >
                            {contentMode === 'video' ? (
                              <Play className="ml-0.5 h-5 w-5" fill="currentColor" strokeWidth={0} />
                            ) : contentMode === 'audio' ? (
                              <Headphones className="h-5 w-5" strokeWidth={2} />
                            ) : contentMode === 'texto' ? (
                              <BookOpen className="h-5 w-5" strokeWidth={2} />
                            ) : (
                              <Images className="h-5 w-5" strokeWidth={2} />
                            )}
                          </button>
                        ) : null}
                      </div>

                      {h.isDemoStory ? (
                        <div className="mt-2.5 shrink-0 rounded-xl border border-orange-400/35 bg-orange-400/8 px-1 py-0.5 sm:px-2">
                          <DemoStoryDisclosure
                            variant="card"
                            story={{
                              id: h.id,
                              isDemo: true,
                              isRealStory: false,
                              demoNotice: h.demoNotice,
                            }}
                          />
                        </div>
                      ) : null}

                      <div className="relative z-10 mt-3 shrink-0 space-y-2 sm:mt-4">
                        <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-tight text-gray-900 sm:text-[1.175rem]">
                          {h.titulo}
                        </h3>
                        <p className="line-clamp-4 text-[0.895rem] leading-relaxed text-gray-700 sm:line-clamp-5">
                          “{h.cita}”
                        </p>
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-gray-600">
                          {[h.fecha, h.lugar].filter(Boolean).join(' · ')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {h.tags.slice(0, 6).map((t) => (
                            <span
                              key={`${h.id}-${t}`}
                              className="rounded-full border border-orange-400/28 bg-[#ebeff6]/92 px-2 py-[0.1875rem] text-[10px] font-semibold uppercase tracking-[0.1em] text-orange-900/92"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className="relative z-10 mt-3 flex min-w-0 shrink-0 items-center gap-2.5 rounded-[14px] border border-gray-400/38 px-3 py-2.5"
                        style={{
                          backgroundColor: '#ebeef4',
                          boxShadow:
                            'inset 6px 6px 12px rgba(163,177,198,0.38), inset -5px -5px 12px rgba(255,255,255,0.88)',
                        }}
                      >
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/76 bg-gray-200/92 shadow-[2px_2px_6px_rgba(163,177,198,0.45)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={h.foto_perfil} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 text-left leading-tight">
                          <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-gray-500">
                            Narrador
                          </p>
                          <p className="truncate text-sm font-semibold text-gray-900">{h.nombre}</p>
                        </div>
                      </div>

                      {openHandler && isActiveSlide ? (
                        <button
                          type="button"
                          disabled={!canOpenThis}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!canOpenThis) return;
                            openHandler(slideIdx);
                          }}
                          className={`relative z-10 mt-4 w-full rounded-full px-4 py-[0.7rem] text-center text-xs font-bold uppercase tracking-[0.17em] transition sm:text-[0.8rem] ${
                            canOpenThis
                              ? 'border border-orange-500/41 bg-[linear-gradient(165deg,#ff7138_0%,#ff4500_52%,#ea4000_100%)] text-white shadow-[0_18px_40px_rgba(255,69,0,0.22)] hover:brightness-[1.03] active:scale-[0.99]'
                              : 'cursor-not-allowed border border-gray-400/45 bg-[#dfe4ea]/95 text-gray-500 opacity-95'
                          }`}
                        >
                          {canOpenThis ? primaryOpenLabel(contentMode) : 'Contenido no disponible en este formato'}
                        </button>
                      ) : null}
                    </div>
                  </ExpoCardTiltShell>
                </SwiperSlide>
              );
            }

            return (
              <SwiperSlide
                key={h.id}
                style={{
                  width: `min(92vw, ${SLIDE_PX}px)`,
                  height: `min(92vw, ${SLIDE_PX}px)`,
                }}
              >
                <ExpoCardTiltShell disableTilt={historiasListEmbedded}>
                  <div
                    className={
                      isLightHall
                        ? 'hec-card-inner flex h-full w-full flex-col overflow-hidden rounded-2xl p-6 text-left sm:p-8'
                        : 'hec-card-inner flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 text-left text-white backdrop-blur-md sm:p-8'
                    }
                    style={
                      isLightHall
                        ? {
                            backdropFilter: 'blur(18px) saturate(165%)',
                            WebkitBackdropFilter: 'blur(18px) saturate(165%)',
                            border: '1px solid rgba(255, 255, 255, 0.52)',
                            boxShadow:
                              '0 28px 64px rgba(15,23,42,0.09), inset 1px 1px 0 rgba(255,255,255,0.85)',
                            background: 'linear-gradient(165deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.24) 100%)',
                          }
                        : {
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                          }
                    }
                  >
                    <div
                      className={
                        isLightHall
                          ? 'relative min-h-0 flex-1 overflow-hidden rounded-xl bg-gray-900/10'
                          : 'relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black/20'
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- URLs externas (picsum, etc.) */}
                      <img src={h.imagen_principal} alt="" className="h-full w-full object-cover" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/58 via-black/14 to-transparent" />
                      {slideIdx === activeIndex && openHandler && canOpenPrimary(h, contentMode) ? (
                        <div className="pointer-events-auto absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-1/2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openHandler(slideIdx);
                            }}
                            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/45 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/60"
                            aria-label={
                              contentMode === 'video'
                                ? 'Ver video'
                                : contentMode === 'audio'
                                  ? 'Escuchar audio'
                                  : contentMode === 'texto'
                                    ? 'Leer historia'
                                    : 'Ver álbum de fotos'
                            }
                          >
                            {contentMode === 'video' ? (
                              <Play className="ml-0.5 h-7 w-7" fill="currentColor" strokeWidth={0} />
                            ) : contentMode === 'audio' ? (
                              <Headphones className="h-7 w-7" strokeWidth={2} />
                            ) : contentMode === 'texto' ? (
                              <BookOpen className="h-7 w-7" strokeWidth={2} />
                            ) : (
                              <Images className="h-7 w-7" strokeWidth={2} />
                            )}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {h.isDemoStory ? (
                      <div className="mt-3 shrink-0">
                        <DemoStoryDisclosure
                          variant="card"
                          story={{
                            id: h.id,
                            isDemo: true,
                            isRealStory: false,
                            demoNotice: h.demoNotice,
                          }}
                        />
                      </div>
                    ) : null}
                    <div className="mt-4 shrink-0 space-y-2">
                      <h3
                        className={
                          isLightHall
                            ? 'text-[1.05rem] font-semibold leading-snug tracking-tight text-gray-900 sm:text-xl'
                            : 'text-lg font-semibold leading-tight tracking-tight sm:text-xl'
                        }
                      >
                        {h.titulo}
                      </h3>
                      <p
                        className={
                          isLightHall
                            ? 'line-clamp-3 text-[0.9rem] leading-relaxed text-gray-700 sm:text-sm'
                            : 'line-clamp-3 text-sm leading-relaxed text-white/90'
                        }
                      >
                        “{h.cita}”
                      </p>
                      <p className={isLightHall ? 'text-xs text-gray-600' : 'text-xs text-white/60'}>
                        {h.fecha} · {h.lugar}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {h.tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className={
                              isLightHall
                                ? 'rounded-full border border-gray-400/35 bg-white/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-700'
                                : 'rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/75'
                            }
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </ExpoCardTiltShell>
              </SwiperSlide>
            );
          })}
        </Swiper>
          </div>

        </div>

        {!historiasListEmbedded && active ? (
          <div
            className={`pointer-events-none z-20 mt-2 flex w-full justify-center px-2 sm:mt-3 ${isLightHall ? 'max-w-[min(92vw,720px)]' : 'max-w-[min(92vw,620px)]'}`}
          >
            <div
              className={
                isLightHall
                  ? 'pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-gray-300/50 bg-white/70 py-2 pl-2 pr-5 shadow-[0_12px_40px_rgba(0,0,0,0.1)] backdrop-blur-md'
                  : 'pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-white/20 bg-white/10 py-2 pl-2 pr-5 shadow-lg backdrop-blur-md'
              }
            >
              <div
                className={
                  isLightHall
                    ? 'relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-300/60 bg-gray-200/80'
                    : 'relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/25 bg-black/30'
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.foto_perfil}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 text-left">
                <p
                  className={
                    isLightHall
                      ? 'truncate font-medium text-gray-900'
                      : 'truncate font-medium text-white'
                  }
                >
                  {active.nombre}
                </p>
                <p
                  className={
                    isLightHall
                      ? 'truncate text-xs text-gray-600'
                      : 'truncate text-xs text-white/70'
                  }
                >
                  {metaLine}
                </p>
                {active.isDemoStory ? (
                  <div className="pointer-events-auto mt-2 max-w-sm">
                    <DemoStoryDisclosure
                      variant="panel"
                      story={{
                        id: active.id,
                        isDemo: true,
                        isRealStory: false,
                        demoNotice: active.demoNotice,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

      </div>

      {/*
        Capa 1 — UI overlays: barra superior (buzón + compartir); z alto para quedar por encima del coverflow 3D.
      */}
      <div className="pointer-events-none absolute inset-0 z-[500] flex flex-col">
        {active && (showMailboxInGalleryChrome || shareInGalleryChrome) ? (
          <header className="pointer-events-auto flex shrink-0 items-center justify-end gap-3 px-4 pt-6 pb-2 sm:px-8">
            <div
              className={
                isLightHall
                  ? 'flex shrink-0 items-center gap-1 rounded-full border border-gray-300/55 bg-white/80 p-1 shadow-sm backdrop-blur-md'
                  : 'flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-md'
              }
            >
              {showMailboxInGalleryChrome ? (
                <ResonanceMailbox
                  storyId={active.id}
                  recipientName={active.nombre}
                  triggerLayout="inline"
                  triggerTone={isLightHall ? 'light' : 'dark'}
                />
              ) : null}
              {shareInGalleryChrome ? (
                <EthicalShareTriggerButton
                  onClick={() => setEthicalShareOpen(true)}
                  className={
                    isLightHall ? 'text-gray-800 hover:bg-gray-200/60' : 'text-white/90 hover:bg-white/10'
                  }
                />
              ) : null}
            </div>
          </header>
        ) : null}
        <div className="min-h-0 flex-1" aria-hidden />
      </div>

      {shareInGalleryChrome && active ? (
        <EthicalShareFlow
          key={active.id}
          open={ethicalShareOpen}
          onClose={() => setEthicalShareOpen(false)}
          authorName={active.nombre}
          storyTitle={active.titulo}
          quote={active.cita}
          imageUrl={active.imagen_principal}
          shareUrl={shareUrl()}
          exhibitionLabel={tituloExposicion}
          themeTag={active.tags[0] ?? 'resiliencia'}
        />
      ) : null}
    </div>
  );
}
