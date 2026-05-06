'use client';

import { StoryEndScreen } from '@/components/historia/StoryEndScreen';
import { DemoStoryDisclosure } from '@/components/stories/DemoStoryDisclosure';
import type { DemoStoryFields } from '@/lib/demo-stories-public';
import { SITE_FONT_STACK } from '@/lib/typography';
import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

const FILM = '#0d0b09';
const CREAM = '#f5f0e8';
/** Acento naranja AlmaMundi (antes sepia). */
const SEPIA = '#ff4500';
const SEPIA_DK = '#c23600';
const BAR_COUNT = 16;

export interface HistoriaAudio {
  id: string;
  titulo: string;
  subtitulo?: string;
  audioUrl: string;
  thumbnailUrl: string;
  duracion: number;
  fecha: string;
  citaDestacada?: string;
  frases?: string[];
  autor: {
    nombre: string;
    avatar: string;
    ubicacion?: string;
    bio?: string;
  };
  tags?: string[];
  /** Texto accesible del audio (sinónimo API: `transcript`). */
  transcripcion?: string;
  transcript?: string;
  demoStory?: DemoStoryFields;
}

interface AudioPlayerProps {
  historia: HistoriaAudio;
  onClose?: () => void;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
const SkipBackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polygon points="19,20 9,12 19,4" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);
const SkipFwdIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polygon points="5,4 15,12 5,20" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);
const VolumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);
const MutedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

export default function AudioPlayer({ historia, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(historia.duracion || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    setTitleVisible(true);
  }, []);

  /** Fondo oscuro durante la escucha; al final, misma base neumórfica que el cierre compartido. */
  useEffect(() => {
    const prevO = document.body.style.overflow;
    const prevB = document.body.style.backgroundColor;
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = ended ? '#E0E5EC' : FILM;
    return () => {
      document.body.style.overflow = prevO;
      document.body.style.backgroundColor = prevB;
    };
  }, [ended]);

  useLayoutEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoadedMetadata = () => {
      const d = audio.duration;
      setDuration(Number.isFinite(d) && d > 0 ? d : historia.duracion || 0);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setEnded(true);
      setIsPlaying(false);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [historia.audioUrl, historia.duracion]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play().catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) { audioRef.current.currentTime = t; setCurrentTime(t); }
  };

  const skip = (delta: number) => {
    if (!audioRef.current) return;
    const t = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const restart = () => {
    setEnded(false);
    setCurrentTime(0);
    if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); setIsPlaying(true); }
  };

  const transcripcionText = historia.transcripcion ?? historia.transcript;
  const frases = historia.frases ?? [];
  const phraseThreshold = frases.length > 0 ? duration / frases.length : 0;
  const currentPhraseIndex = frases.length === 0 ? -1 : Math.min(Math.floor(currentTime / phraseThreshold), frases.length - 1);
  const currentPhrase = currentPhraseIndex >= 0 ? frases[currentPhraseIndex] : null;

  /* Barras decorativas: una sola aleatoriedad por montaje (useMemo estable). */
  /* eslint-disable react-hooks/purity -- Math.random solo para alturas animación visual, no afecta lógica */
  const barHeights = useMemo(() => Array.from({ length: BAR_COUNT }, () => 8 + Math.random() * 28), []);
  const barDurations = useMemo(() => Array.from({ length: BAR_COUNT }, () => 0.6 + Math.random() * 0.5), []);
  /* eslint-enable react-hooks/purity */

  const avatarSize = isMobile ? 120 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 160 : 200;
  const waveformWidth = isMobile ? 'calc(100% - 48px)' : '360px';
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const content = (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes haloPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,69,0,0.3); }
          50% { box-shadow: 0 0 0 20px rgba(255,69,0,0); }
        }
        @keyframes waveAnim {
          from { transform: scaleY(0.2); }
          to { transform: scaleY(1); }
        }
        .ap-halo-pulse { animation: haloPulse 2s ease-in-out infinite; }
        .ap-wave-bar { transform-origin: center bottom; }
        @keyframes phraseFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ap-phrase-in { animation: phraseFadeIn 0.6s ease forwards; }
        input[type="range"].ap-range {
          -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; width: 100%;
        }
        input[type="range"].ap-range::-webkit-slider-thumb {
          -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%;
          background: ${SEPIA}; margin-top: -4px;
        }
        input[type="range"].ap-range::-webkit-slider-runnable-track {
          height: 3px; border-radius: 2px; background: rgba(255,255,255,0.12);
        }
      `}</style>

      {!ended ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: FILM,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '3rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingBottom: '1rem',
            zIndex: 9999,
          }}
        >
          {historia.demoStory ? (
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                marginBottom: '1rem',
                flexShrink: 0,
              }}
            >
              <DemoStoryDisclosure story={historia.demoStory} variant="page" />
            </div>
          ) : null}
          {/* ZONA 1 — TOP: X + título */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,69,0,0.25)',
                color: 'rgba(245,240,232,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <h1
            style={{
              fontFamily: SITE_FONT_STACK,
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: CREAM,
              textAlign: 'center',
              maxWidth: '90%',
              marginBottom: '2rem',
              lineHeight: 1.3,
              opacity: titleVisible ? 1 : 0,
              transition: 'opacity 0.6s ease',
            }}
          >
            {historia.titulo}
          </h1>

          {/* ZONA 2 — CENTER: avatar + waveform + frases */}
          <div
            className={isPlaying ? 'ap-halo-pulse' : ''}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(255,69,0,0.4)',
              marginBottom: '1.5rem',
              flexShrink: 0,
            }}
          >
            <img
              src={historia.autor.avatar}
              alt={historia.autor.nombre}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <p style={{ fontFamily: SITE_FONT_STACK, fontWeight: 300, fontSize: '0.95rem', color: CREAM, marginBottom: '0.25rem' }}>
            {historia.autor.nombre}
          </p>
          {historia.autor.ubicacion && (
            <p style={{ fontFamily: SITE_FONT_STACK, fontWeight: 200, fontSize: '0.8rem', color: SEPIA, letterSpacing: '0.12em', marginBottom: '2rem' }}>
              {historia.autor.ubicacion}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '4px',
              height: '36px',
              width: waveformWidth,
              maxWidth: '100%',
              marginBottom: '1.5rem',
            }}
          >
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="ap-wave-bar"
                style={{
                  width: '3px',
                  height: `${h}px`,
                  background: SEPIA,
                  borderRadius: '2px',
                  // Longhand only: mezclar `animation` (shorthand) con `animationDelay` provoca el warning de React.
                  ...(isPlaying
                    ? {
                        animationName: 'waveAnim',
                        animationDuration: `${barDurations[i]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                        animationDelay: `${i * 0.06}s`,
                      }
                    : {
                        animationName: 'none',
                        animationDuration: '0s',
                        animationTimingFunction: 'ease',
                        animationIterationCount: 1,
                        animationDirection: 'normal',
                        animationDelay: '0s',
                      }),
                }}
              />
            ))}
          </div>

          {frases.length > 0 && currentPhrase && (
            <div style={{ minHeight: '4rem', maxWidth: '480px', textAlign: 'center', marginBottom: '1.5rem' }}>
              <p
                className="ap-phrase-in"
                style={{
                  fontFamily: SITE_FONT_STACK,
                  fontStyle: 'italic',
                  fontSize: '1.1rem',
                  color: 'rgba(245,240,232,0.7)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {currentPhrase}
              </p>
            </div>
          )}

          {/* ZONA 3 — BOTTOM: controles */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '2rem 2.5rem',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxWidth: '480px', marginBottom: '0.5rem' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: `${progress}%`,
                  height: '3px',
                  background: SEPIA,
                  borderRadius: '2px',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="range"
                className="ap-range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={seek}
              />
            </div>
            <p style={{ fontFamily: SITE_FONT_STACK, fontWeight: 300, fontSize: '0.8rem', color: 'rgba(245,240,232,0.6)', letterSpacing: '0.08em' }}>
              {formatTime(currentTime)} · · · {formatTime(duration)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button
                type="button"
                onClick={() => skip(-10)}
                aria-label="Atrás 10 s"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,69,0,0.35)',
                  background: 'rgba(255,255,255,0.06)',
                  color: CREAM,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipBackIcon />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: `2px solid ${SEPIA}`,
                  background: 'rgba(255,69,0,0.1)',
                  color: SEPIA,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button
                type="button"
                onClick={() => skip(10)}
                aria-label="Adelante 10 s"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,69,0,0.35)',
                  background: 'rgba(255,255,255,0.06)',
                  color: CREAM,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipFwdIcon />
              </button>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              style={{
                position: 'absolute',
                bottom: '2rem',
                right: '2.5rem',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid rgba(255,69,0,0.3)',
                background: 'transparent',
                color: CREAM,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isMuted ? <MutedIcon /> : <VolumeIcon />}
            </button>
            <audio
              ref={audioRef}
              src={historia.audioUrl}
              controls
              preload="metadata"
              aria-label={`Reproducir audio: ${historia.titulo}`}
              style={{
                width: '100%',
                maxWidth: '480px',
                marginTop: '8px',
              }}
            />
            {transcripcionText ? (
              <details style={{ marginTop: '24px', width: '100%', maxWidth: '480px' }}>
                <summary
                  style={{
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#FF4A1C',
                    listStyle: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span aria-hidden="true">▶</span>
                  Leer transcripción
                </summary>
                <div
                  role="region"
                  aria-label="Transcripción del audio"
                  style={{
                    marginTop: '16px',
                    fontSize: '15px',
                    lineHeight: '1.8',
                    color: 'inherit',
                    borderLeft: '3px solid #FF4A1C',
                    paddingLeft: '16px',
                  }}
                >
                  {transcripcionText}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      ) : (
        <StoryEndScreen
          titulo={historia.titulo}
          subtitulo={historia.subtitulo}
          fecha={historia.fecha}
          citaDestacada={historia.citaDestacada}
          autor={historia.autor}
          tags={historia.tags}
          thumbnailUrl={historia.thumbnailUrl}
          demoStory={historia.demoStory}
          replayLabel="Escuchar de nuevo"
          onReplay={restart}
          onMoreStories={() => {
            void onClose?.();
          }}
        />
      )}
    </>
  );

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(content, document.body);
}
