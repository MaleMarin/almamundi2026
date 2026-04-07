'use client';

/**
 * Vista tipo "computación espacial": carrusel 3D con glassmorphism, barra superior,
 * cápsula de autor y acciones laterales. Datos alineados al JSON sugerido (historias[]).
 *
 * No usa Swiper: el efecto coverflow se aproxima con perspective + rotateY + scale + blur.
 */
import { motion, useReducedMotion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Link2,
  Play,
  Share2,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatPublishedAtEsStable } from '@/lib/historias/format-published-es-stable';
import type { StoryPoint } from '@/lib/map-data/stories';

export type HistoriaSpatial = {
  /** Id AlmaMundi (enlaces compartir / perfil) */
  storyId?: string;
  nombre: string;
  titulo: string;
  cita: string;
  /** URL absoluta o ruta bajo /public */
  imagen_principal: string;
  foto_perfil: string;
  /** Ej. técnica, año — o usa fecha + lugar por separado */
  detalles?: string;
  fecha?: string;
  lugar?: string;
};

const PLACEHOLDER_THUMB =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#2a2a32" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#8b8b9a">Sin imagen</text></svg>'
  );

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c23600" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#ff4500" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function formatPlaceStory(s: StoryPoint): string {
  return [s.city, s.country].filter(Boolean).join(', ') || s.label || '';
}

function formatPublishedAt(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const s = formatPublishedAtEsStable(iso);
  return s === '—' ? undefined : s;
}

/** Convierte un punto del mapa / API al formato de tarjeta espacial (listados de video). */
export function storyPointToHistoriaSpatial(s: StoryPoint): HistoriaSpatial {
  const raw =
    s.imageUrl ??
    s.thumbnailUrl ??
    (s as Record<string, unknown>).image ??
    (s as Record<string, unknown>).thumbnail ??
    (s as Record<string, unknown>).coverImage ??
    (s as Record<string, unknown>).videoThumbnail;
  const imagen =
    typeof raw === 'string' && raw.trim() ? raw.trim() : PLACEHOLDER_THUMB;
  const name = s.authorName ?? s.author?.name ?? '—';
  const rawAvatar = s.author?.avatar ?? s.authorAvatar ?? '';
  const foto =
    typeof rawAvatar === 'string' && rawAvatar.trim()
      ? rawAvatar.trim()
      : defaultAvatar(name);
  const lugar = formatPlaceStory(s);
  const cita =
    (s.quote ?? s.excerpt ?? s.description ?? '').trim() || '—';
  return {
    storyId: s.id,
    nombre: name,
    titulo: s.title ?? s.label ?? 'Historia',
    cita,
    imagen_principal: imagen,
    foto_perfil: foto,
    detalles: s.topic ?? s.subtitle ?? undefined,
    fecha: formatPublishedAt(s.publishedAt),
    lugar: lugar || undefined,
  };
}

export type SpatialGlassExpoProps = {
  historias: HistoriaSpatial[];
  /** Título mostrado en la barra superior (nombre de la exposición / “URL” conceptual) */
  tituloExposicion?: string;
  /** Imagen de fondo (galería difuminada). Si omites, hay un degradado neutro. */
  backgroundImageUrl?: string;
  className?: string;
  /** Dentro de una página con nav/footer: altura acotada y sin barra inferior fija a viewport */
  embedded?: boolean;
  /** Notifica índice activo (compartir, favoritos, abrir video) */
  onSlideChange?: (index: number) => void;
  /** Tarjeta central: reproducir (p. ej. abrir reproductor de video) */
  onOpenHistoria?: (index: number) => void;
  /** Favorito controlado (Mi colección) */
  favoriteActive?: boolean;
  onToggleFavorite?: () => void;
  /** P. ej. true mientras el reproductor de video está abierto */
  disableKeyboardNav?: boolean;
  onPerfil?: (h: HistoriaSpatial, index: number) => void;
};

function shortestOffset(i: number, active: number, n: number): number {
  if (n <= 0) return 0;
  let d = i - active;
  const half = n / 2;
  if (d > half) d -= n;
  if (d < -half) d += n;
  return d;
}

function isExternalSrc(src: string): boolean {
  return /^https?:\/\//i.test(src.trim());
}

export function SpatialGlassExpo({
  historias,
  tituloExposicion = 'Exposición',
  backgroundImageUrl,
  className = '',
  embedded = false,
  onSlideChange,
  onOpenHistoria,
  favoriteActive,
  onToggleFavorite,
  disableKeyboardNav = false,
  onPerfil,
}: SpatialGlassExpoProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [favOn, setFavOn] = useState(false);
  const dragRef = useRef<{ x: number } | null>(null);
  const favControlled = typeof onToggleFavorite === 'function';
  const showFavFilled = favControlled ? Boolean(favoriteActive) : favOn;

  const n = historias.length;
  const active = historias[activeIndex] ?? null;

  const metaLine = useMemo(() => {
    if (!active) return '';
    const parts = [active.fecha, active.lugar, active.detalles].filter(Boolean);
    return parts.join(' · ');
  }, [active]);

  const go = useCallback(
    (delta: number) => {
      if (n === 0) return;
      setActiveIndex((i) => (i + delta + n) % n);
    },
    [n]
  );

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

  useEffect(() => {
    if (disableKeyboardNav) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [go, disableKeyboardNav]);

  const storyShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const id = active?.storyId;
    if (id) return `${origin}/historias/${id}/video`;
    return window.location.href;
  }, [active]);

  const handleShare = useCallback(async () => {
    const url = storyShareUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: active?.titulo ?? tituloExposicion,
          text: active?.cita,
          url,
        });
        return;
      }
    } catch {
      /* usuario canceló o no disponible */
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* noop */
    }
  }, [active, tituloExposicion, storyShareUrl]);

  const handleLink = useCallback(async () => {
    const url = storyShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* noop */
    }
  }, [storyShareUrl]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start || n < 2) return;
    const dx = e.clientX - start.x;
    const threshold = 48;
    if (dx > threshold) go(-1);
    else if (dx < -threshold) go(1);
  };

  if (n === 0) {
    return (
      <div
        className={`flex min-h-[50vh] items-center justify-center text-white/70 ${className}`}
        role="status"
      >
        No hay historias para mostrar.
      </div>
    );
  }

  const bgStyle = backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(15, 15, 20, 0.75), rgba(15, 15, 22, 0.85)), url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'radial-gradient(ellipse 120% 80% at 50% 20%, #2a2a35 0%, #0f0f14 55%, #08080c 100%)',
      };

  const rootShell =
    embedded
      ? 'relative isolate min-h-[min(78vh,760px)] w-full overflow-hidden rounded-2xl text-white'
      : 'relative isolate min-h-screen w-full overflow-hidden text-white';

  return (
    <div className={`${rootShell} ${className}`} style={bgStyle}>
      {backgroundImageUrl ? (
        <div
          className="pointer-events-none absolute inset-0 backdrop-blur-sm"
          aria-hidden
        />
      ) : null}

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 pt-6 pb-2 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide text-white/90 backdrop-blur-md sm:text-sm">
            {tituloExposicion}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="rounded-full p-2 text-white/90 transition hover:bg-white/10"
            aria-label="Compartir"
          >
            <Share2 className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* Lateral actions */}
      <aside className="pointer-events-none absolute left-3 top-1/2 z-20 -translate-y-1/2 sm:left-6">
        <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-md">
          <button
            type="button"
            onClick={() => void handleLink()}
            className="rounded-xl p-2.5 text-white/90 transition hover:bg-white/10"
            aria-label="Copiar enlace"
          >
            <Link2 className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (favControlled) onToggleFavorite?.();
              else setFavOn((v) => !v);
            }}
            className={`rounded-xl p-2.5 transition hover:bg-white/10 ${
              showFavFilled ? 'text-rose-400' : 'text-white/90'
            }`}
            aria-pressed={showFavFilled}
            aria-label="Favorito"
          >
            <Heart
              className="h-5 w-5"
              strokeWidth={1.75}
              fill={showFavFilled ? 'currentColor' : 'none'}
            />
          </button>
          <button
            type="button"
            onClick={() => active && onPerfil?.(active, activeIndex)}
            className="rounded-xl p-2.5 text-white/90 transition hover:bg-white/10"
            aria-label="Perfil"
          >
            <UserRound className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      {/* Carousel */}
      <div
        className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center px-4 pb-40 pt-8 sm:px-8 sm:pt-12"
        style={{ perspective: '1200px' }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <div className="relative flex h-[min(58vh,520px)] w-full items-center justify-center [transform-style:preserve-3d]">
          {n > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="pointer-events-auto absolute left-0 top-1/2 z-30 flex min-h-[52px] min-w-[52px] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/55 bg-black/45 p-3 text-white shadow-[0_4px_28px_rgba(0,0,0,0.5)] backdrop-blur-md transition hover:border-white/80 hover:bg-black/60 active:scale-[0.97] sm:left-1 md:left-2"
                aria-label="Historia anterior"
              >
                <ChevronLeft className="h-8 w-8 shrink-0" strokeWidth={2.75} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="pointer-events-auto absolute right-0 top-1/2 z-30 flex min-h-[56px] min-w-[56px] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-black/50 p-3 text-white shadow-[0_6px_32px_rgba(0,0,0,0.55)] backdrop-blur-md ring-2 ring-white/15 transition hover:border-white hover:bg-black/65 hover:ring-white/25 active:scale-[0.97] sm:right-1 md:right-2"
                aria-label="Próxima historia"
              >
                <ChevronRight className="h-9 w-9 shrink-0" strokeWidth={2.75} />
              </button>
            </>
          ) : null}
          {historias.map((h, i) => {
            const offset = shortestOffset(i, activeIndex, n);
            const isCenter = offset === 0;
            const abs = Math.abs(offset);
            const translateX = offset * (n <= 3 ? 200 : 160);
            const rotateY = offset * -42;
            const scale = isCenter ? 1 : Math.max(0.78, 0.9 - abs * 0.06);
            const blurPx = isCenter ? 0 : Math.min(6 + abs * 2, 12);
            const zIndex = 10 - abs;

            return (
              <motion.article
                key={`${h.nombre}-${i}`}
                className="absolute w-[min(92vw,380px)] cursor-grab active:cursor-grabbing"
                style={{ zIndex }}
                initial={false}
                animate={
                  reduceMotion
                    ? {
                        x: translateX,
                        opacity: isCenter ? 1 : 0.45,
                        scale,
                        rotateY,
                        filter: `blur(${blurPx}px)`,
                      }
                    : {
                        x: translateX,
                        opacity: isCenter ? 1 : 0.55 - abs * 0.12,
                        scale,
                        rotateY,
                        filter: `blur(${blurPx}px)`,
                      }
                }
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              >
                <div
                  className={`overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md ${
                    isCenter ? 'ring-1 ring-white/25' : ''
                  }`}
                >
                  <div className="relative aspect-[4/5] w-full bg-black/20">
                    {isExternalSrc(h.imagen_principal) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs externas sin dominio fijo en next.config
                      <img
                        src={h.imagen_principal}
                        alt={isCenter ? h.titulo : ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={h.imagen_principal.startsWith('/') ? h.imagen_principal : `/${h.imagen_principal}`}
                        alt={isCenter ? h.titulo : ''}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 92vw, 380px"
                        priority={isCenter}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    {isCenter && onOpenHistoria ? (
                      <div className="absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenHistoria(activeIndex);
                          }}
                          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/25"
                          aria-label="Ver video"
                        >
                          <Play className="ml-0.5 h-6 w-6" fill="currentColor" strokeWidth={0} />
                        </button>
                      </div>
                    ) : null}
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                      <p className="font-semibold tracking-tight text-white drop-shadow-md sm:text-lg">
                        {h.titulo}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/90">
                        “{h.cita}”
                      </p>
                      <p className="mt-3 text-xs text-white/65">
                        {[h.fecha, h.lugar].filter(Boolean).join(' · ') ||
                          h.detalles ||
                          '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* Author capsule */}
      {active ? (
        <div
          className={`pointer-events-none left-0 right-0 z-20 flex justify-center px-4 ${
            embedded
              ? 'absolute bottom-6'
              : 'fixed bottom-8 sm:bottom-10'
          }`}
        >
          <motion.div
            layout
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-white/20 bg-white/10 py-2 pl-2 pr-5 shadow-lg backdrop-blur-md"
            key={active.nombre}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/25 bg-black/30">
              {isExternalSrc(active.foto_perfil) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={active.foto_perfil}
                  alt={`Foto de ${active.nombre}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={
                    active.foto_perfil.startsWith('/')
                      ? active.foto_perfil
                      : `/${active.foto_perfil}`
                  }
                  alt={`Foto de ${active.nombre}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate font-medium text-white">{active.nombre}</p>
              <p className="truncate text-xs text-white/70">{metaLine || '—'}</p>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
