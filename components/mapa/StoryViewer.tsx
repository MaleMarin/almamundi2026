'use client';

import { useEffect, useState, useRef } from 'react';
import type { StoryPoint } from '@/lib/map-data/stories';
import { duckAmbient } from '@/lib/sound/ambient';
import { registerPulse, getApproxLocation } from '@/lib/userLocation';
import { incrementStoriesRead, shouldShowMomentoJusto, markMomentoJustoShown } from '@/lib/sessionTracker';
import { getUserWeather } from '@/lib/weather';
import { EcoRecorder } from '@/components/mapa/EcoRecorder';
import { RelatedCarousel } from '@/components/mapa/RelatedCarousel';
import { ReadingChain } from '@/components/mapa/ReadingChain';
import { ShareStoryModal } from '@/components/mapa/ShareStoryModal';

type Props = {
  story: StoryPoint;
  onClose: () => void;
  isClosing: boolean;
  onSelectRelated?: (story: StoryPoint) => void;
};

function KenBurnsViewer({
  photos,
}: {
  photos: { url: string; name: string; date: string }[];
}) {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;

    setPhase('enter');
    t1 = setTimeout(() => setPhase('hold'), 1500);
    t2 = setTimeout(() => setPhase('exit'), 5500);
    t3 = setTimeout(() => {
      setCurrent((c) => (c + 1) % photos.length);
    }, 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [current, photos.length]);

  const photo = photos[current];
  if (!photo) return null;

  const moves = [
    'scale(1.08) translate(-1%, -1%)',
    'scale(1.08) translate(1%, -1%)',
    'scale(1.08) translate(0%, 1%)',
    'scale(1.06) translate(-1%, 0%)',
  ];
  const startMove = moves[current % moves.length];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          height: 320,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          background: '#0a0f1e',
        }}
      >
        <img
          key={photo.url}
          src={photo.url}
          alt={photo.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform:
              phase === 'enter'
                ? 'scale(1.0) translate(0%, 0%)'
                : phase === 'hold' || phase === 'exit'
                  ? startMove
                  : 'scale(1.0)',
            opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
            transition:
              phase === 'enter'
                ? 'opacity 1500ms ease, transform 6000ms ease-out'
                : phase === 'exit'
                  ? 'opacity 1000ms ease'
                  : 'transform 6000ms ease-out',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background:
              'linear-gradient(to top, rgba(5,8,20,0.95) 0%, transparent 100%)',
            borderRadius: '0 0 16px 16px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 18,
            right: 18,
            zIndex: 2,
            opacity: phase === 'hold' ? 1 : 0,
            transition: 'opacity 800ms ease',
          }}
        >
          <p
            style={{
              fontSize: 15,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.92)',
              margin: '0 0 3px',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            {photo.name}
          </p>
          <p
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.40)',
              margin: 0,
              fontFamily: "'Avenir Light', Avenir, sans-serif",
              letterSpacing: '0.06em',
            }}
          >
            {photo.date}
          </p>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            fontSize: 10,
            color: 'rgba(255,255,255,0.35)',
            fontFamily: "'Avenir Light', Avenir, sans-serif",
            letterSpacing: '0.08em',
            zIndex: 2,
          }}
        >
          {current + 1} / {photos.length}
        </div>
      </div>
      {photos.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 12,
          }}
        >
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background:
                  i === current
                    ? 'rgba(255,255,255,0.60)'
                    : 'rgba(255,255,255,0.18)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                transition: 'all 300ms ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function StoryViewer({ story, onClose, isClosing, onSelectRelated }: Props) {
  const [mounted, setMounted] = useState(false);
  const [showEco, setShowEco] = useState(false);
  const [listening, setListening] = useState(false);
  const [showLastSecond, setShowLastSecond] = useState(false);
  const [lastSecondText, setLastSecondText] = useState('');
  const [lastSecondSent, setLastSecondSent] = useState(false);
  const [resonanceSent, setResonanceSent] = useState(false);
  const [shareMode, setShareMode] = useState<'share' | 'postal' | null>(null);
  const [showMomentoJusto, setShowMomentoJusto] = useState(false);
  const [liveReaders, setLiveReaders] = useState(0);
  const [weather, setWeather] = useState<string>('unknown');
  const endRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const readerIdRef = useRef<string | null>(null);

  const alreadySentKey = `resonance_${story.id}`;
  const alreadySent =
    typeof window !== 'undefined' && sessionStorage.getItem(alreadySentKey) === '1';

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    duckAmbient(true);
    incrementStoriesRead(story.id);
    return () => {
      duckAmbient(false);
    };
  }, [story.id]);

  useEffect(() => {
    if (!endRef.current) return;
    let fired = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !fired) {
          fired = true;
          void registerPulse(story.id ?? '');
          setTimeout(() => setShowEco(true), 3000);
          setTimeout(() => setShowLastSecond(true), 30_000);
          if (shouldShowMomentoJusto()) {
            markMomentoJustoShown();
            setTimeout(() => setShowMomentoJusto(true), 2000);
          }
        }
      },
      { threshold: 0.9 }
    );
    obs.observe(endRef.current);
    return () => obs.disconnect();
  }, [story.id]);

  const photos = story.photos ?? [];
  const format = story.videoUrl
    ? 'video'
    : story.audioUrl
      ? 'audio'
      : photos.length > 0
        ? 'photos'
        : 'text';

  const startListening = () => {
    if (!story.body || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(story.body);
    utter.lang = 'es-ES';
    utter.rate = 0.82;
    utter.pitch = 0.95;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const esVoice =
      voices.find((v) =>
        v.lang.startsWith('es') &&
        (v.name.includes('Female') || v.name.includes('Lucía') || v.name.includes('Monica'))
      ) ?? voices.find((v) => v.lang.startsWith('es'));
    if (esVoice) utter.voice = esVoice;
    utter.onend = () => setListening(false);
    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
    setListening(true);
  };

  const stopListening = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setListening(false);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const ping = async () => {
      try {
        const headers: HeadersInit = {};
        if (readerIdRef.current) headers['x-reader-id'] = readerIdRef.current;
        const res = await fetch(`/api/stories/${story.id}/readers`, { method: 'POST', headers });
        const d = (await res.json()) as { count?: number; readerId?: string };
        if (d.readerId) readerIdRef.current = d.readerId;
        setLiveReaders(d.count ?? 0);
      } catch {}
    };
    void ping();
    interval = setInterval(() => void ping(), 15_000);
    return () => {
      clearInterval(interval);
      const id = readerIdRef.current;
      if (id) {
        fetch(`/api/stories/${story.id}/readers`, { method: 'DELETE', headers: { 'x-reader-id': id } }).catch(() => {});
      }
    };
  }, [story.id]);

  useEffect(() => {
    if (!story.weatherTags?.length) return;
    getApproxLocation().then((loc) => {
      if (!loc) return;
      getUserWeather(loc.lat, loc.lng).then((w) => setWeather(w));
    });
  }, [story.id, story.weatherTags]);

  return (
    <>
      <style>{`
        @keyframes storySlideUp {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes storySlideDown {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(60px); }
        }
        @keyframes ecoFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rainAtm {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          left: 'clamp(0px, 30vw, 420px)',
          right: 0,
          bottom: 0,
          top: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 720,
            maxHeight: '92vh',
            margin: '0 auto',
            padding: '0 24px 24px',
            pointerEvents: 'auto',
            animation: isClosing
              ? 'storySlideDown 400ms ease forwards'
              : mounted
                ? 'storySlideUp 500ms cubic-bezier(0.22,1,0.36,1) forwards'
                : 'none',
            opacity: mounted ? 1 : 0,
          }}
        >
          <div
            style={{
              background:     'rgba(6, 10, 22, 0.82)',
              backdropFilter: 'blur(48px) saturate(180%)',
              WebkitBackdropFilter: 'blur(48px) saturate(180%)',
              border:         '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius:   28,
              boxShadow: `
                inset 0 1.5px 0 rgba(255, 255, 255, 0.14),
                inset 0 -1px 0 rgba(255, 255, 255, 0.04),
                0 40px 80px rgba(0, 0, 0, 0.70),
                0 8px 32px rgba(0, 0, 0, 0.40)
              `,
              overflow:       'hidden',
              maxHeight:      '88vh',
              display:        'flex',
              flexDirection:  'column',
              position:       'relative',
            }}
          >
            {/* Reflejo de luz en el borde superior */}
            <div aria-hidden style={{
              position:      'absolute',
              top:           0,
              left:          '10%',
              right:         '10%',
              height:       1,
              background:    'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              pointerEvents: 'none',
              zIndex:        1,
            }} />
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                padding: '22px 24px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(249,115,22,0.70)',
                    margin: '0 0 6px',
                    fontFamily: "'Avenir Light', Avenir, sans-serif",
                  }}
                >
                  {[story.city, story.country].filter(Boolean).join(', ')}
                </p>
                <h2
                  style={{
                    fontSize: 'clamp(20px, 3vw, 30px)',
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.96)',
                    margin: '0 0 4px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    fontFamily: "'Avenir Light', Avenir, sans-serif",
                  }}
                >
                  {story.title ?? story.label}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.35)',
                    margin: 0,
                    fontStyle: 'italic',
                    fontFamily: "'Avenir Light', Avenir, sans-serif",
                  }}
                >
                  — {story.label}
                </p>
                {liveReaders > 1 && (
                  <p
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.28)',
                      margin: '6px 0 0',
                      fontFamily: "'Avenir Light', Avenir, sans-serif",
                      fontStyle: 'italic',
                    }}
                  >
                    Alguien más está aquí ahora.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.60)',
                  cursor: 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginLeft: 16,
                  outline: 'none',
                  transition: 'all 150ms ease',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                position: 'relative',
                zIndex: 2,
                overflowY: 'auto',
                scrollbarWidth: 'none',
                padding: '24px 24px 28px',
                flex: 1,
              }}
            >
              {story.weatherTags?.includes(weather) && weather === 'rain' && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                    borderRadius: 28,
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(60,100,180,0.08) 0%, transparent 70%)',
                    animation: 'rainAtm 3s ease-in-out infinite',
                  }}
                />
              )}
              {story.weatherTags?.includes(weather) && weather === 'storm' && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                    borderRadius: 28,
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(80,40,200,0.10) 0%, transparent 70%)',
                  }}
                />
              )}
              {format === 'video' && story.videoUrl && (
                <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                  <video
                    controls
                    autoPlay
                    src={story.videoUrl}
                    onEnded={() => {
                      void registerPulse(story.id ?? '');
                      setTimeout(() => setShowEco(true), 2000);
                    }}
                    style={{ width: '100%', display: 'block', maxHeight: '55vh', objectFit: 'cover' }}
                  />
                </div>
              )}

              {format === 'audio' && story.audioUrl && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: '20px',
                    marginBottom: 24,
                  }}
                >
                  <audio
                    controls
                    autoPlay
                    src={story.audioUrl}
                    onEnded={() => {
                      void registerPulse(story.id ?? '');
                      setTimeout(() => setShowEco(true), 2000);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {format === 'photos' && photos.length > 0 && (
                <KenBurnsViewer photos={photos} />
              )}

              {format === 'text' && story.body && (
                <div
                  style={{
                    fontSize: 'clamp(15px, 2vw, 18px)',
                    lineHeight: 1.85,
                    color: 'rgba(255,255,255,0.78)',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  {story.body
                    .split('\n')
                    .filter((p) => p.trim())
                    .map((p, i) => (
                      <p key={i} style={{ marginBottom: '1.4em' }}>
                        {p}
                      </p>
                    ))}
                </div>
              )}

              <div ref={endRef} style={{ height: 1 }} />

              <div
                style={{
                  height: 1,
                  background: 'rgba(255,255,255,0.07)',
                  margin: '24px 0',
                }}
              />

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {format === 'text' && story.body && (
                  <button
                    type="button"
                    onClick={listening ? stopListening : startListening}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 999,
                      background: listening
                        ? 'rgba(96,165,250,0.15)'
                        : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${
                        listening
                          ? 'rgba(96,165,250,0.35)'
                          : 'rgba(255,255,255,0.10)'
                      }`,
                      color: listening ? '#93c5fd' : 'rgba(255,255,255,0.55)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: "'Avenir Light', Avenir, sans-serif",
                      outline: 'none',
                      transition: 'all 180ms ease',
                    }}
                  >
                    {listening ? 'Detener lectura' : 'Cerrar los ojos'}
                  </button>
                )}
                <ActionButton label="Enviar a alguien" onClick={() => setShareMode('share')} />
                <ActionButton label="Enviar postal" onClick={() => setShareMode('postal')} />
                {!alreadySent && !resonanceSent && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const loc = await getApproxLocation();
                        await fetch(`/api/stories/${story.id}/resonance`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ lat: loc?.lat, lng: loc?.lng }),
                        });
                      } catch {}
                      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(alreadySentKey, '1');
                      setResonanceSent(true);
                    }}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.55)',
                      cursor: 'pointer',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: "'Avenir Light', Avenir, sans-serif",
                      transition: 'all 180ms ease',
                    }}
                  >
                    Esto me llegó
                  </button>
                )}
                {resonanceSent && (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'rgba(249,115,22,0.60)',
                      margin: 0,
                      fontFamily: "'Avenir Light', Avenir, sans-serif",
                      fontStyle: 'italic',
                    }}
                  >
                    El autor sabrá que llegó a alguien.
                  </p>
                )}
                <ActionButton label="¿Dejar un eco?" onClick={() => setShowEco(true)} accent />
              </div>

              <ReadingChain storyId={story.id ?? ''} />

              {onSelectRelated && (
                <RelatedCarousel
                  currentStoryId={story.id ?? ''}
                  onSelect={onSelectRelated}
                />
              )}
            </div>
          </div>

          {showEco && (
            <div
              style={{
                marginTop: 12,
                padding: '16px 20px',
                background: 'rgba(8,12,25,0.85)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(249,115,22,0.18)',
                borderRadius: 18,
                animation: 'ecoFadeIn 500ms ease forwards',
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.70)',
                  margin: '0 0 12px',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                  lineHeight: 1.4,
                }}
              >
                ¿Quieres dejar tu reacción?
                <span
                  style={{
                    color: 'rgba(255,255,255,0.38)',
                    fontSize: 12,
                    display: 'block',
                    marginTop: 2,
                  }}
                >
                  10 segundos. Sin edición. Solo tu voz.
                </span>
              </p>
              <EcoRecorder storyId={story.id ?? ''} onDone={() => setShowEco(false)} />
            </div>
          )}

          {showLastSecond && !lastSecondSent && (
            <div
              style={{
                marginTop: 12,
                padding: '18px 20px',
                background: 'rgba(8,12,25,0.90)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 18,
                animation: 'ecoFadeIn 600ms ease forwards',
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.65)',
                  margin: '0 0 4px',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}
              >
                ¿Hay algo que no dijiste en esta historia?
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.28)',
                  margin: '0 0 14px',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}
              >
                El autor lo recibirá. Máximo dos líneas.
              </p>
              <textarea
                value={lastSecondText}
                onChange={(e) => {
                  if (e.target.value.length <= 180) setLastSecondText(e.target.value);
                }}
                placeholder="Lo que quedó sin decir..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: 13,
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
                  {180 - lastSecondText.length} caracteres restantes
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowLastSecond(false)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 999,
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.35)',
                      cursor: 'pointer',
                      fontSize: 12,
                      outline: 'none',
                      fontFamily: "'Avenir Light', Avenir, sans-serif",
                    }}
                  >
                    No, gracias
                  </button>
                  <button
                    type="button"
                    disabled={!lastSecondText.trim()}
                    onClick={async () => {
                      try {
                        await fetch(`/api/stories/${story.id}/addendum`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: lastSecondText }),
                        });
                      } catch {}
                      setLastSecondSent(true);
                      setShowLastSecond(false);
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 999,
                      background: lastSecondText.trim() ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${lastSecondText.trim() ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.06)'}`,
                      color: lastSecondText.trim() ? '#fdba74' : 'rgba(255,255,255,0.25)',
                      cursor: lastSecondText.trim() ? 'pointer' : 'not-allowed',
                      fontSize: 12,
                      outline: 'none',
                      fontFamily: "'Avenir Light', Avenir, sans-serif",
                      transition: 'all 180ms ease',
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {showMomentoJusto && (
            <div
              style={{
                marginTop: 16,
                padding: '20px 22px',
                background: 'rgba(8,12,25,0.88)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 18,
                animation: 'ecoFadeIn 800ms ease forwards',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.82)',
                  margin: '0 0 6px',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                  lineHeight: 1.35,
                }}
              >
                Llevas un rato aquí.
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.40)',
                  margin: '0 0 18px',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}
              >
                ¿Hay algo tuyo que podría vivir en este mapa?
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMomentoJusto(false);
                    onClose();
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('almamundi:openModal'));
                    }, 600);
                  }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 999,
                    background: 'rgba(249,115,22,0.18)',
                    border: '1px solid rgba(249,115,22,0.35)',
                    color: '#fdba74',
                    cursor: 'pointer',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: "'Avenir Light', Avenir, sans-serif",
                  }}
                >
                  Sí, quiero contarlo
                </button>
                <button
                  type="button"
                  onClick={() => setShowMomentoJusto(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.30)',
                    cursor: 'pointer',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: "'Avenir Light', Avenir, sans-serif",
                  }}
                >
                  Ahora no
                </button>
              </div>
            </div>
          )}

          {shareMode && (
            <ShareStoryModal
              story={story}
              mode={shareMode}
              onClose={() => setShareMode(null)}
            />
          )}
        </div>
      </div>
    </>
  );
}

function ActionButton({
  label,
  onClick,
  accent = false,
}: {
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '9px 18px',
        borderRadius: 999,
        background: accent ? 'rgba(249,115,22,0.14)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${accent ? 'rgba(249,115,22,0.30)' : 'rgba(255,255,255,0.10)'}`,
        color: accent ? '#fdba74' : 'rgba(255,255,255,0.55)',
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: "'Avenir Light', Avenir, sans-serif",
        outline: 'none',
        transition: 'all 180ms ease',
      }}
    >
      {label}
    </button>
  );
}
