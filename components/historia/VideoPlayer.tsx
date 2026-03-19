'use client';

/**
 * El Cine Personal de AlmaMundi — 3 actos como una película real.
 * Acto 1: Intertítulo (pantalla negra, Cormorant Garamond itálica, línea dorada, autor, fade out).
 * Acto 2: Proyección (iris wipe, fondo desenfocado, viñeta, controles a 2.8s, barra dorada).
 * Acto 3: Fin (cita con acento dorado, tarjeta autor con pulso, Ver de nuevo / Más historias).
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Historia {
  id: string;
  titulo: string;
  subtitulo?: string;
  autor: {
    nombre: string;
    avatar: string;
    ubicacion?: string;
    bio?: string;
  };
  videoUrl: string;
  thumbnailUrl: string;
  duracion: number;
  fecha: string;
  tags?: string[];
  citaDestacada?: string;
}

interface VideoPlayerProps {
  historia: Historia;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(245,240,232,0.75)',
  transition: 'color 0.15s',
};

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
function MutedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
function FullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}
function MinimizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

export default function VideoPlayer({ historia }: VideoPlayerProps) {
  const [stage, setStage] = useState<'intertitle' | 'playing' | 'ended'>('intertitle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(historia.duracion);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [intertitlePhase, setIntertitlePhase] = useState<'in' | 'hold' | 'out'>('in');
  const [irisOpen, setIrisOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (stage !== 'intertitle') return;
    const t1 = setTimeout(() => setIntertitlePhase('hold'), 600);
    const t2 = setTimeout(() => setIntertitlePhase('out'), 3200);
    const t3 = setTimeout(() => {
      setIrisOpen(true);
      setTimeout(() => setStage('playing'), 800);
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [stage]);

  useEffect(() => {
    if (stage === 'playing' && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [stage]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    if (isPlaying) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 2800);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
  }, [isPlaying, resetControlsTimer]);

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };
  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    setStage('ended');
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play(); setIsPlaying(true); }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.volume = next ? 0 : volume;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

        :root {
          --cream:    #f5f0e8;
          --sepia:    #c9a96e;
          --sepia-dk: #8b6914;
          --ink:      #0d0b09;
          --ink-soft: #1a1612;
          --film:     #111009;
        }

        /* Iris Wipe */
        @keyframes irisExpand {
          from { clip-path: circle(0% at 50% 50%); }
          to   { clip-path: circle(150% at 50% 50%); }
        }
        .iris-expand {
          animation: irisExpand 0.85s cubic-bezier(0.77, 0, 0.18, 1) forwards;
        }

        /* Intertitle */
        @keyframes titleIn {
          from { opacity: 0; transform: translateY(18px); letter-spacing: 0.35em; }
          to   { opacity: 1; transform: translateY(0);    letter-spacing: 0.15em; }
        }
        @keyframes titleOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.06); }
        }
        .title-in  { animation: titleIn  0.9s cubic-bezier(0.22,1,0.36,1) forwards; }
        .title-out { animation: titleOut 0.7s ease-in forwards; }

        /* Controls */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .controls-enter { animation: fadeUp 0.3s ease forwards; }

        /* End card */
        @keyframes endReveal {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .end-reveal { animation: endReveal 0.8s cubic-bezier(0.22,1,0.36,1) forwards; }

        /* Seekbar */
        .cine-player input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        .cine-player input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--sepia);
          margin-top: -5px;
          transition: transform 0.15s;
        }
        .cine-player input[type='range']:hover::-webkit-slider-thumb {
          transform: scale(1.4);
        }
        .cine-player input[type='range']::-webkit-slider-runnable-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.15);
        }

        /* Grain overlay */
        .grain::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 50;
          mix-blend-mode: overlay;
        }

        /* Author pulse */
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(201,169,110,0.4); }
          50%      { box-shadow: 0 0 0 10px rgba(201,169,110,0); }
        }
        .avatar-pulse { animation: pulse 2.4s ease infinite; }
      `}</style>

      <div className="cine-player">
        {/* Acto 1 — Intertítulo */}
        {stage === 'intertitle' && (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'var(--film)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 100,
            }}
            className={`grain ${irisOpen ? 'iris-expand' : ''}`}
          >
            <div style={{
              width: intertitlePhase === 'hold' ? '280px' : '0px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--sepia), transparent)',
              transition: 'width 1.2s ease',
              marginBottom: '3rem',
            }} />

            <p style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 200,
              fontSize: '0.7rem',
              letterSpacing: '0.55em',
              color: 'var(--sepia)',
              textTransform: 'uppercase',
              opacity: intertitlePhase === 'hold' ? 1 : 0,
              transition: 'opacity 0.8s ease 0.3s',
              marginBottom: '2rem',
            }}>
              AlmaMundi · Historia personal
            </p>

            <h1
              className={intertitlePhase === 'out' ? 'title-out' : intertitlePhase === 'hold' ? 'title-in' : ''}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--cream)',
                textAlign: 'center',
                letterSpacing: '0.15em',
                lineHeight: 1.15,
                maxWidth: '72vw',
                opacity: intertitlePhase === 'in' ? 0 : 1,
                padding: '0 2rem',
              }}
            >
              {historia.titulo}
            </h1>

            {historia.subtitulo && (
              <p style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: '0.95rem',
                letterSpacing: '0.12em',
                color: 'rgba(245,240,232,0.45)',
                marginTop: '1.4rem',
                opacity: intertitlePhase === 'hold' ? 1 : 0,
                transition: 'opacity 0.8s ease 0.6s',
              }}>
                {historia.subtitulo}
              </p>
            )}

            <div style={{
              width: intertitlePhase === 'hold' ? '280px' : '0px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--sepia), transparent)',
              transition: 'width 1.2s ease',
              marginTop: '3rem',
            }} />

            <div style={{
              position: 'absolute', bottom: '3.5rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
              opacity: intertitlePhase === 'hold' ? 1 : 0,
              transition: 'opacity 0.8s ease 0.9s',
            }}>
              <img
                src={historia.autor.avatar}
                alt={historia.autor.nombre}
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  border: '1px solid rgba(201,169,110,0.4)',
                  objectFit: 'cover',
                }}
              />
              <span style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: '0.8rem',
                letterSpacing: '0.2em',
                color: 'rgba(245,240,232,0.5)',
                textTransform: 'uppercase',
              }}>
                {historia.autor.nombre}
              </span>
            </div>
          </div>
        )}

        {/* Acto 2 — Proyección */}
        {stage === 'playing' && (
          <div
            ref={containerRef}
            onMouseMove={resetControlsTimer}
            onClick={togglePlay}
            style={{
              position: 'fixed', inset: 0,
              background: 'var(--film)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: showControls ? 'default' : 'none',
              overflow: 'hidden',
            }}
            className="grain iris-expand"
          >
            <div style={{
              position: 'absolute', inset: '-5%',
              backgroundImage: `url(${historia.thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.2) saturate(0.5)',
              transform: 'scale(1.1)',
              zIndex: 0,
            }} />

            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
            }} />

            <video
              ref={videoRef}
              src={historia.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              style={{
                position: 'relative', zIndex: 2,
                width: '100%', height: '100%',
                objectFit: 'contain',
                maxHeight: '100vh',
              }}
              playsInline
            />

            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '2rem 2.5rem 4rem',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
              zIndex: 10,
              opacity: showControls ? 1 : 0,
              transition: 'opacity 0.5s ease',
              pointerEvents: 'none',
            }}>
              <p style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 200,
                fontSize: '0.65rem',
                letterSpacing: '0.5em',
                color: 'var(--sepia)',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}>
                AlmaMundi
              </p>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 400,
                fontStyle: 'italic',
                fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)',
                color: 'var(--cream)',
                letterSpacing: '0.05em',
              }}>
                {historia.titulo}
              </h2>
            </div>

            {!isPlaying && (
              <div style={{
                position: 'absolute', zIndex: 10,
                width: '80px', height: '80px',
                borderRadius: '50%',
                background: 'rgba(201,169,110,0.15)',
                border: '1px solid rgba(201,169,110,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--sepia)">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            )}

            <div
              onClick={(e) => e.stopPropagation()}
              className={showControls ? 'controls-enter' : ''}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '4rem 2.5rem 2rem',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                zIndex: 10,
                opacity: showControls ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            >
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <div style={{
                  position: 'absolute', top: '50%', left: 0,
                  width: `${progress}%`, height: '3px',
                  background: 'linear-gradient(90deg, var(--sepia-dk), var(--sepia))',
                  borderRadius: '2px',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }} />
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  step={0.1}
                  onChange={handleSeek}
                  style={{ width: '100%', position: 'relative', zIndex: 2 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <button type="button" onClick={togglePlay} style={btnStyle} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button type="button" onClick={toggleMute} style={btnStyle} aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}>
                    {isMuted ? <MutedIcon /> : <VolumeIcon />}
                  </button>
                  <input
                    type="range"
                    min={0} max={1} step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolume}
                    style={{ width: '72px' }}
                    aria-label="Volumen"
                  />
                  <span style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '0.78rem',
                    fontWeight: 300,
                    color: 'rgba(245,240,232,0.6)',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <img
                      src={historia.autor.avatar}
                      alt=""
                      style={{
                        width: '28px', height: '28px',
                        borderRadius: '50%',
                        border: '1px solid rgba(201,169,110,0.35)',
                        objectFit: 'cover',
                      }}
                    />
                    <span style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: '0.75rem',
                      fontWeight: 300,
                      color: 'rgba(245,240,232,0.55)',
                      letterSpacing: '0.12em',
                    }}>
                      {historia.autor.nombre}
                    </span>
                  </div>
                  <button type="button" onClick={toggleFullscreen} style={btnStyle} aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
                    {isFullscreen ? <MinimizeIcon /> : <FullscreenIcon />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acto 3 — Fin */}
        {stage === 'ended' && (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'var(--film)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}
            className="grain"
          >
            <div style={{
              position: 'absolute', inset: '-5%',
              backgroundImage: `url(${historia.thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(60px) brightness(0.1) saturate(0.3)',
              transform: 'scale(1.1)',
            }} />

            <div
              className="end-reveal"
              style={{
                position: 'relative', zIndex: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                maxWidth: '520px', width: '90%',
                padding: '3.5rem 3rem',
                background: 'rgba(245,240,232,0.04)',
                border: '1px solid rgba(201,169,110,0.15)',
                borderRadius: '4px',
                backdropFilter: 'blur(20px)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ width: '40px', height: '1px', background: 'rgba(201,169,110,0.4)' }} />
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  color: 'var(--sepia)',
                  letterSpacing: '0.3em',
                }}>Fin</span>
                <div style={{ width: '40px', height: '1px', background: 'rgba(201,169,110,0.4)' }} />
              </div>

              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontStyle: 'italic',
                fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
                color: 'var(--cream)',
                letterSpacing: '0.05em',
                lineHeight: 1.2,
                marginBottom: '1.8rem',
              }}>
                {historia.titulo}
              </h2>

              {historia.citaDestacada && (
                <blockquote style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: '1.05rem',
                  color: 'rgba(245,240,232,0.55)',
                  lineHeight: 1.7,
                  letterSpacing: '0.03em',
                  borderLeft: '2px solid rgba(201,169,110,0.3)',
                  paddingLeft: '1.2rem',
                  marginBottom: '2.5rem',
                  textAlign: 'left',
                }}>
                  &quot;{historia.citaDestacada}&quot;
                </blockquote>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', gap: '1.2rem',
                padding: '1.2rem 1.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(201,169,110,0.1)',
                borderRadius: '3px',
                width: '100%',
                marginBottom: '2.5rem',
              }}>
                <img
                  src={historia.autor.avatar}
                  alt=""
                  className="avatar-pulse"
                  style={{
                    width: '54px', height: '54px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(201,169,110,0.35)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ textAlign: 'left' }}>
                  <p style={{
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 400,
                    fontSize: '0.95rem',
                    color: 'var(--cream)',
                    letterSpacing: '0.05em',
                    marginBottom: '0.2rem',
                  }}>
                    {historia.autor.nombre}
                  </p>
                  {historia.autor.ubicacion && (
                    <p style={{
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 300,
                      fontSize: '0.75rem',
                      color: 'var(--sepia)',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    }}>
                      {historia.autor.ubicacion}
                    </p>
                  )}
                  {historia.autor.bio && (
                    <p style={{
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 300,
                      fontSize: '0.8rem',
                      color: 'rgba(245,240,232,0.4)',
                      marginTop: '0.4rem',
                      lineHeight: 1.5,
                    }}>
                      {historia.autor.bio}
                    </p>
                  )}
                </div>
              </div>

              {historia.tags && historia.tags.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                  justifyContent: 'center',
                  marginBottom: '2.5rem',
                }}>
                  {historia.tags.map((tag) => (
                    <span key={tag} style={{
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 300,
                      fontSize: '0.68rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'rgba(201,169,110,0.6)',
                      border: '1px solid rgba(201,169,110,0.2)',
                      padding: '0.25rem 0.8rem',
                      borderRadius: '2px',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => {
                    setStage('intertitle');
                    setIntertitlePhase('in');
                    setIrisOpen(false);
                    setCurrentTime(0);
                    if (videoRef.current) videoRef.current.currentTime = 0;
                  }}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    background: 'transparent',
                    border: '1px solid rgba(201,169,110,0.3)',
                    borderRadius: '3px',
                    color: 'var(--sepia)',
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 300,
                    fontSize: '0.78rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,169,110,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Ver de nuevo
                </button>
                <Link
                  href="/historias"
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    background: 'linear-gradient(135deg, var(--sepia-dk), var(--sepia))',
                    border: 'none',
                    borderRadius: '3px',
                    color: 'var(--film)',
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.78rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'block',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  Más historias
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
