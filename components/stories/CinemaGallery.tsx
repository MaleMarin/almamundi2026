'use client';

/**
 * CinemaGallery — AlmaMundi
 * Experiencia cinemática para explorar historias en video.
 * Reemplaza StoriesCurvedCarousel con una propuesta de festival de cine.
 *
 * Layout:
 *  - Fondo: thumbnail de la historia activa, muy desenfocado, oscuro, atmosférico
 *  - Centro: título grande, autor, botón ▶ monumental
 *  - Abajo: filmstrip horizontal de miniaturas navegables
 *  - Teclado: ← → para navegar, Enter/Space para reproducir, Esc para cerrar player
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import VideoPlayer from '@/components/historia/VideoPlayer';
import type { StoryPoint } from '@/lib/map-data/stories';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatPlace(s: StoryPoint): string {
  return [s.city, s.country].filter(Boolean).join(' · ') || s.label || '';
}
function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#8b6914" opacity="0.3"/>
    <text x="50" y="64" font-family="serif" font-size="46" font-weight="300"
          fill="#c9a96e" text-anchor="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export type CinemaGalleryProps = {
  stories: StoryPoint[];
  onSelectStory?: (story: StoryPoint) => void;
};

type ActiveVideo = {
  id: string;
  titulo: string;
  subtitulo?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duracion: number;
  fecha: string;
  autor: { nombre: string; avatar: string; ubicacion?: string; bio?: string };
  tags?: string[];
  citaDestacada?: string;
};

// ─── Component ───────────────────────────────────────────────────────────────
export function CinemaGallery({ stories, onSelectStory }: CinemaGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [filmHover, setFilmHover] = useState<number | null>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const story = stories[activeIdx] ?? null;

  // ── Navigate ────────────────────────────────────────────────────────────
  const goTo = useCallback((idx: number) => {
    if (transitioning || idx === activeIdx) return;
    setPrevIdx(activeIdx);
    setTransitioning(true);
    setActiveIdx(idx);
    setTimeout(() => { setPrevIdx(null); setTransitioning(false); }, 700);
    if (filmRef.current) {
      const item = filmRef.current.children[idx] as HTMLElement;
      if (item) item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [transitioning, activeIdx]);

  const goPrev = useCallback(() => goTo(Math.max(0, activeIdx - 1)), [goTo, activeIdx]);
  const goNext = useCallback(() => goTo(Math.min(stories.length - 1, activeIdx + 1)), [goTo, activeIdx, stories.length]);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (activeVideo) return;
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'ArrowRight') goNext();
      if ((e.key === 'Enter' || e.key === ' ') && story?.videoUrl) {
        e.preventDefault();
        openCinema(story);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, story, activeVideo]);

  // ── Open cinema (mapeo desde StoryPoint; sin campos inexistentes) ────────
  const openCinema = (s: StoryPoint) => {
    setActiveVideo({
      id: s.id,
      titulo: s.title ?? s.label ?? 'Historia',
      subtitulo: formatPlace(s) || undefined,
      videoUrl: s.videoUrl ?? '',
      thumbnailUrl: s.imageUrl ?? s.videoUrl ?? '',
      duracion: 0,
      fecha: s.publishedAt ?? '',
      autor: {
        nombre: s.authorName ?? 'Anónimo',
        avatar: defaultAvatar(s.authorName ?? ''),
        ubicacion: formatPlace(s) || undefined,
        bio: s.description,
      },
      tags: s.topic ? [s.topic] : [],
      citaDestacada: undefined,
    });
  };

  if (!stories.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#c9a96e', fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}>
        No hay historias en video por ahora.
      </div>
    );
  }

  const bg = story?.imageUrl ?? '';
  const authorName = story?.authorName ?? '';
  const authorAvatar = defaultAvatar(authorName);

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,600&family=Jost:wght@200;300;400&display=swap');

        .cg-root * { box-sizing: border-box; }

        /* BG crossfade */
        .cg-bg { transition: opacity 0.7s ease; }
        .cg-bg-enter { opacity: 0; animation: bgFadeIn 0.7s ease forwards; }
        @keyframes bgFadeIn { from{opacity:0} to{opacity:1} }

        /* Hero content */
        @keyframes heroIn {
          from { opacity:0; transform: translateY(24px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .cg-hero-content { animation: heroIn 0.65s cubic-bezier(0.22,1,0.36,1) both; }

        /* Play button pulse */
        @keyframes ringPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(201,169,110,0.35); }
          50%      { box-shadow: 0 0 0 18px rgba(201,169,110,0); }
        }
        .cg-play-btn:not(:hover) { animation: ringPulse 2.8s ease infinite; }
        .cg-play-btn { transition: transform 0.2s, background 0.2s; }
        .cg-play-btn:hover { transform: scale(1.1) !important; background: rgba(201,169,110,0.25) !important; }

        /* Filmstrip */
        .cg-film::-webkit-scrollbar { height: 0; }
        .cg-film-item { transition: transform 0.25s, opacity 0.25s, outline 0.15s; }
        .cg-film-item:hover { transform: translateY(-6px) scale(1.05) !important; opacity: 1 !important; }

        /* Nav arrows */
        .cg-nav { transition: opacity 0.2s, transform 0.2s; }
        .cg-nav:hover { opacity: 1 !important; transform: translateX(0) scale(1.08) !important; }

        /* Count ticker */
        @keyframes tickIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .cg-count { animation: tickIn 0.3s ease both; }

        /* Grain */
        .cg-grain::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:3;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  ROOT                                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        className="cg-root cg-grain"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          overflow: 'hidden',
          background: '#090807',
          fontFamily: "'Jost', sans-serif",
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        {/* ── Atmospheric background ── */}
        {bg && (
          <div
            key={activeIdx}
            className="cg-bg cg-bg-enter"
            style={{
              position: 'absolute', inset: '-8%',
              backgroundImage: `url(${bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(55px) brightness(0.18) saturate(0.6)',
              transform: 'scale(1.15)',
              zIndex: 0,
            }}
          />
        )}

        {/* ── Radial vignette ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 30%, rgba(9,8,7,0.75) 100%)',
        }} />

        {/* ── Top gradient ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '140px',
          background: 'linear-gradient(to bottom, rgba(9,8,7,0.9), transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* ── Bottom gradient ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '260px',
          background: 'linear-gradient(to top, rgba(9,8,7,0.97) 0%, rgba(9,8,7,0.6) 60%, transparent 100%)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  HERO CENTER                                                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 4,
          paddingBottom: '120px',
          paddingTop: '60px',
        }}>

          {/* Counter */}
          <p
            key={`count-${activeIdx}`}
            className="cg-count"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 200,
              fontSize: '0.65rem',
              letterSpacing: '0.5em',
              color: 'rgba(201,169,110,0.55)',
              textTransform: 'uppercase',
              marginBottom: '2rem',
            }}
          >
            {String(activeIdx + 1).padStart(2,'0')} — {String(stories.length).padStart(2,'0')}
          </p>

          {/* Author */}
          {story && (
            <div
              key={`author-${activeIdx}`}
              className="cg-hero-content"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem',
                marginBottom: '1.8rem',
                animationDelay: '0.05s',
              }}
            >
              <img
                src={authorAvatar}
                alt={authorName}
                style={{
                  width: '34px', height: '34px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid rgba(201,169,110,0.3)',
                }}
              />
              <div>
                <p style={{
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 300,
                  fontSize: '0.82rem',
                  color: 'rgba(245,240,232,0.85)',
                  letterSpacing: '0.12em',
                }}>
                  {authorName}
                </p>
                {formatPlace(story) && (
                  <p style={{
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 200,
                    fontSize: '0.68rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(201,169,110,0.55)',
                  }}>
                    {formatPlace(story)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          {story && (
            <h1
              key={`title-${activeIdx}`}
              className="cg-hero-content"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontStyle: 'italic',
                fontSize: 'clamp(2rem, 5.5vw, 4.2rem)',
                color: '#f5f0e8',
                textAlign: 'center',
                letterSpacing: '0.03em',
                lineHeight: 1.15,
                maxWidth: '72vw',
                marginBottom: '0.8rem',
                animationDelay: '0.12s',
              }}
            >
              {story.title ?? story.label}
            </h1>
          )}

          {/* Date */}
          {story?.publishedAt && (
            <p
              key={`date-${activeIdx}`}
              className="cg-hero-content"
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 200,
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                color: 'rgba(245,240,232,0.3)',
                marginBottom: '3rem',
                animationDelay: '0.18s',
              }}
            >
              {formatDate(story.publishedAt)}
            </p>
          )}

          {/* ── PLAY BUTTON ── */}
          {story?.videoUrl ? (
            <button
              key={`play-${activeIdx}`}
              className="cg-hero-content cg-play-btn"
              onClick={() => { onSelectStory?.(story); openCinema(story); }}
              aria-label="Ver historia en cine"
              style={{
                width: '88px', height: '88px',
                borderRadius: '50%',
                background: 'rgba(201,169,110,0.12)',
                border: '1.5px solid rgba(201,169,110,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                animationDelay: '0.25s',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#c9a96e">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </button>
          ) : (
            <a
              href={`/historias/${story?.id}`}
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#c9a96e',
                border: '1px solid rgba(201,169,110,0.3)',
                padding: '0.7rem 2rem',
                textDecoration: 'none',
                borderRadius: '2px',
                transition: 'background 0.2s',
              }}
            >
              Leer historia
            </a>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  FILMSTRIP                                                       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{
          position: 'relative', zIndex: 5,
          paddingBottom: '2.5rem',
          paddingTop: '0.5rem',
        }}>
          {/* Nav: prev */}
          <button
            className="cg-nav"
            onClick={goPrev}
            disabled={activeIdx === 0}
            aria-label="Anterior"
            style={{
              position: 'absolute', left: '1.5rem', top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(201,169,110,0.2)',
              borderRadius: '50%',
              width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: activeIdx === 0 ? 'default' : 'pointer',
              opacity: activeIdx === 0 ? 0.2 : 0.7,
              color: '#c9a96e',
              zIndex: 2,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>

          {/* Filmstrip scroll */}
          <div
            ref={filmRef}
            className="cg-film"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              padding: '12px 40px',
              scrollSnapType: 'x mandatory',
              alignItems: 'center',
            }}
          >
            {stories.map((s, i) => {
              const isActive = i === activeIdx;
              const thumb = s.imageUrl ?? '';
              return (
                <button
                  key={s.id}
                  className="cg-film-item"
                  onClick={() => goTo(i)}
                  onMouseEnter={() => setFilmHover(i)}
                  onMouseLeave={() => setFilmHover(null)}
                  aria-label={s.title ?? s.label}
                  style={{
                    flexShrink: 0,
                    width: isActive ? '160px' : '120px',
                    height: isActive ? '90px' : '68px',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: isActive
                      ? '2px solid rgba(201,169,110,0.8)'
                      : '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    opacity: isActive ? 1 : filmHover === i ? 0.85 : 0.4,
                    background: '#1a1612',
                    scrollSnapAlign: 'center',
                    padding: 0,
                    position: 'relative',
                  }}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        filter: isActive ? 'none' : 'grayscale(40%)',
                        transition: 'filter 0.3s',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #1a1612, #2a2016)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(201,169,110,0.4)">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  )}
                  {isActive && (
                    <div style={{
                      position: 'absolute', bottom: '4px', left: '50%',
                      transform: 'translateX(-50%)',
                      width: '4px', height: '4px',
                      borderRadius: '50%',
                      background: '#c9a96e',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Nav: next */}
          <button
            className="cg-nav"
            onClick={goNext}
            disabled={activeIdx === stories.length - 1}
            aria-label="Siguiente"
            style={{
              position: 'absolute', right: '1.5rem', top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(201,169,110,0.2)',
              borderRadius: '50%',
              width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: activeIdx === stories.length - 1 ? 'default' : 'pointer',
              opacity: activeIdx === stories.length - 1 ? 0.2 : 0.7,
              color: '#c9a96e',
              zIndex: 2,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        {/* ── Keyboard hint ── */}
        <div style={{
          position: 'absolute', bottom: '1rem', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          display: 'flex', gap: '0.8rem', alignItems: 'center',
        }}>
          {['←', '→', 'Enter'].map(k => (
            <span key={k} style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 200,
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              color: 'rgba(245,240,232,0.2)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '0.15rem 0.45rem',
              borderRadius: '2px',
            }}>{k}</span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  CINEMA OVERLAY                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {mounted && activeVideo && ReactDOM.createPortal(
        <VideoPlayer
          historia={activeVideo}
          onClose={() => setActiveVideo(null)}
        />,
        document.body
      )}
    </>
  );
}
