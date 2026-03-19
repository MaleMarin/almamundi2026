'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

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

const BAR_COUNT = 15;
const WARM_DARK = '#0d0a08';
const SEPIA = '#c9a96e';
const CREAM = '#f5f0e8';

export default function AudioPlayer({ historia, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(historia.duracion);
  const [isMuted, setIsMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    const audio = new Audio(historia.audioUrl);
    audioRef.current = audio;
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setEnded(true);
      setIsPlaying(false);
    };
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [historia.audioUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  const frases = historia.frases ?? [];
  const phraseThreshold = frases.length > 0 ? historia.duracion / frases.length : 0;
  const currentPhraseIndex = frases.length === 0 ? -1 : Math.min(
    Math.floor(currentTime / phraseThreshold),
    frases.length - 1
  );
  const barHeights = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => 8 + Math.random() * 32),
    []
  );

  const content = (
    <>
      <style>{`
        :root {
          --cream: ${CREAM};
          --sepia: ${SEPIA};
          --sepia-dk: #8b6914;
          --film: #111009;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${WARM_DARK}; font-family: 'Jost', sans-serif; overflow: hidden; }
        @keyframes halo {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px 10px rgba(201,169,110,0.25); }
          50% { transform: scale(1.02); box-shadow: 0 0 50px 20px rgba(201,169,110,0.4); }
        }
        .avatar-halo { animation: halo 2.5s ease-in-out infinite; }
        @keyframes barWave {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
        .wave-bar { transform-origin: center bottom; }
        @keyframes endReveal {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .end-reveal { animation: endReveal 0.8s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes phraseIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .phrase-in { animation: phraseIn 0.5s ease forwards; }
        input[type='range'] {
          -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%;
          background: var(--sepia);
        }
        input[type='range']::-webkit-slider-runnable-track {
          height: 3px; border-radius: 2px; background: rgba(255,255,255,0.15);
        }
      `}</style>

      {!ended ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: WARM_DARK,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
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
                border: '1px solid rgba(201,169,110,0.3)',
                background: 'rgba(0,0,0,0.3)',
                color: CREAM,
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          )}

          <div
            className="avatar-halo"
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              overflow: 'hidden',
              marginBottom: '2rem',
              border: '3px solid rgba(201,169,110,0.35)',
            }}
          >
            <img
              src={historia.autor.avatar}
              alt={historia.autor.nombre}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '4px',
              height: '40px',
              marginBottom: '2rem',
            }}
          >
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="wave-bar"
                style={{
                  width: '6px',
                  height: `${h}px`,
                  background: SEPIA,
                  borderRadius: '2px',
                  animation: 'barWave 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.06}s`,
                }}
              />
            ))}
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: CREAM,
              textAlign: 'center',
              maxWidth: '90%',
              marginBottom: '2rem',
              lineHeight: 1.3,
            }}
          >
            {historia.titulo}
          </h1>

          {frases.length > 0 && (
            <div
              style={{
                minHeight: '4rem',
                maxWidth: '480px',
                textAlign: 'center',
                marginBottom: '2rem',
              }}
            >
              {frases.map((frase, i) => {
                const show = currentTime >= i * phraseThreshold;
                if (!show) return null;
                const isCurrent = i === currentPhraseIndex;
                return (
                  <p
                    key={i}
                    className={isCurrent ? 'phrase-in' : ''}
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      fontSize: '1.1rem',
                      color: 'rgba(245,240,232,0.9)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {frase}
                  </p>
                );
              })}
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              bottom: '2rem',
              left: '1.5rem',
              right: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={seek}
              style={{ width: '100%' }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <button
                type="button"
                onClick={togglePlay}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: `1px solid ${SEPIA}`,
                  background: 'rgba(201,169,110,0.1)',
                  color: SEPIA,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                {isPlaying ? '‖' : '▶'}
              </button>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: 'rgba(245,240,232,0.7)' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                type="button"
                onClick={toggleMute}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid rgba(201,169,110,0.3)',
                  background: 'transparent',
                  color: CREAM,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#111009',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-5%',
              backgroundImage: `url(${historia.thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(60px) brightness(0.1) saturate(0.3)',
              transform: 'scale(1.1)',
            }}
          />
          <div
            className="end-reveal"
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '520px',
              width: '90%',
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
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '0.85rem', color: SEPIA, letterSpacing: '0.3em' }}>Fin</span>
              <div style={{ width: '40px', height: '1px', background: 'rgba(201,169,110,0.4)' }} />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', color: CREAM, letterSpacing: '0.05em', lineHeight: 1.2, marginBottom: '1.8rem' }}>
              {historia.titulo}
            </h2>
            {historia.citaDestacada && (
              <blockquote style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 400, fontSize: '1.05rem', color: 'rgba(245,240,232,0.55)', lineHeight: 1.7, borderLeft: '2px solid rgba(201,169,110,0.3)', paddingLeft: '1.2rem', marginBottom: '2.5rem', textAlign: 'left' }}>
                &quot;{historia.citaDestacada}&quot;
              </blockquote>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.2rem 1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,169,110,0.1)', borderRadius: '3px', width: '100%', marginBottom: '2.5rem' }}>
              <img src={historia.autor.avatar} alt={historia.autor.nombre} style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(201,169,110,0.35)', flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '0.95rem', color: CREAM, letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{historia.autor.nombre}</p>
                {historia.autor.ubicacion && (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: SEPIA, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{historia.autor.ubicacion}</p>
                )}
              </div>
            </div>
            {historia.tags && historia.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
                {historia.tags.map(tag => (
                  <span key={tag} style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,169,110,0.6)', border: '1px solid rgba(201,169,110,0.2)', padding: '0.25rem 0.8rem', borderRadius: '2px' }}>{tag}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <button
                onClick={() => { setEnded(false); setCurrentTime(0); setIsPlaying(false); if (audioRef.current) { audioRef.current.currentTime = 0; } }}
                style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', borderRadius: '3px', color: SEPIA, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.78rem', letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Escuchar de nuevo
              </button>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: '0.85rem', background: 'linear-gradient(135deg, #8b6914, ' + SEPIA + ')', border: 'none', borderRadius: '3px', color: '#111009', fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '0.78rem', letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Más historias
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(content, document.body);
}
