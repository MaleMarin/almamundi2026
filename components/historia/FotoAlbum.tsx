'use client';

import { SITE_FONT_STACK } from '@/lib/typography';
import { neu } from '@/lib/historias-neumorph';
import type { DemoStoryFields } from '@/lib/demo-stories-public';
import { DemoStoryDisclosure } from '@/components/stories/DemoStoryDisclosure';
import { useState, useEffect, useRef, useCallback } from 'react';

const CREAM = 'rgba(245,240,232,0.85)';
const CREAM_SOFT = 'rgba(245,240,232,0.7)';
const CREAM_MUTED = 'rgba(245,240,232,0.5)';
const SEPIA = '#ff4500';
const DEFAULT_BG = '#1a1410';

export interface HistoriaFoto {
  id: string;
  titulo: string;
  subtitulo?: string;
  fecha: string;
  imagenes: { url: string; caption?: string; descripcion?: string; titulo?: string }[];
  autor: {
    nombre: string;
    avatar: string;
    ubicacion?: string;
  };
  tags?: string[];
  demoStory?: DemoStoryFields;
}

interface FotoAlbumProps {
  historia: HistoriaFoto;
  onClose?: () => void;
}

function extractColor(imgUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(DEFAULT_BG);
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const factor = 0.25;
      resolve(`rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`);
    };
    img.onerror = () => resolve(DEFAULT_BG);
    img.src = imgUrl;
  });
}

export default function FotoAlbum({ historia, onClose }: FotoAlbumProps) {
  const { imagenes } = historia;
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [fotoActivaIdx, setFotoActivaIdx] = useState(0);
  const [caption, setCaption] = useState(imagenes[0]?.caption ?? '');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const check = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      setIsMobile(w < 640);
      setIsTablet(w >= 640 && w < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (imagenes[fotoActivaIdx]) {
      extractColor(imagenes[fotoActivaIdx].url).then(setBgColor);
      queueMicrotask(() => setCaption(imagenes[fotoActivaIdx].caption ?? ''));
    }
  }, [fotoActivaIdx, imagenes]);

  const scrollToPhoto = useCallback((i: number) => {
    const next = Math.max(0, Math.min(imagenes.length - 1, i));
    sectionRefs.current[next]?.scrollIntoView({ behavior: 'smooth' });
  }, [imagenes.length]);

  const photoAlt = useCallback(
    (img: HistoriaFoto['imagenes'][number]) =>
      img.descripcion?.trim() ||
      img.caption?.trim() ||
      img.titulo?.trim() ||
      `Fotografía de ${historia.titulo}`,
    [historia.titulo]
  );

  const photoAriaLabel = useCallback(
    (img: HistoriaFoto['imagenes'][number]) => img.descripcion?.trim() || img.caption?.trim() || img.titulo?.trim() || `Foto del álbum: ${historia.titulo}`,
    [historia.titulo]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = sectionRefs.current.indexOf(entry.target as HTMLElement);
          if (i >= 0 && i < imagenes.length) setFotoActivaIdx(i);
        });
      },
      { threshold: 0.6, rootMargin: '0px' }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [imagenes.length]);

  const sectionHeight = isMobile ? '120vw' : isTablet ? '80vh' : '85vh';
  const isDesktop = !isMobile && !isTablet;

  return (
    <>
      <style>{`
        .fotoalbum-kenburns { animation: fotoalbumKenBurns 10s ease-in-out infinite alternate; }
        .fotoalbum-kenburns-alt { animation: fotoalbumKenBurnsAlt 12s ease-in-out infinite alternate; }
        @keyframes fotoalbumKenBurns {
          from { transform: scale(1) translate(0, 0); }
          to { transform: scale(1.08) translate(1.5%, 1%); }
        }
        @keyframes fotoalbumKenBurnsAlt {
          from { transform: scale(1) translate(0, 0); }
          to { transform: scale(1.08) translate(-1.5%, -1%); }
        }
      `}</style>

      <div
        style={{
          background: bgColor,
          minHeight: '100vh',
          transition: 'background 0.8s ease',
        }}
      >
        {/* Header fijo */}
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            zIndex: 100,
            background: bgColor.startsWith('rgb') ? bgColor.replace(/^rgb\(/, 'rgba(').replace(/\)$/, ', 0.85)') : bgColor,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '1.25rem',
            paddingRight: '1.25rem',
          }}
        >
          <div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontFamily: SITE_FONT_STACK,
                  fontWeight: 300,
                  fontSize: '0.75rem',
                  color: CREAM_SOFT,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
                ← Volver
              </button>
            )}
          </div>
          <div style={{ display: isDesktop ? 'block' : 'none', fontFamily: SITE_FONT_STACK, fontStyle: 'italic', fontSize: '0.95rem', color: CREAM, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {historia.titulo}
          </div>
          <div style={{ fontFamily: SITE_FONT_STACK, fontWeight: 200, fontSize: '0.75rem', letterSpacing: '0.2em', color: CREAM_MUTED }}>
            {fotoActivaIdx + 1} / {imagenes.length}
          </div>
        </header>

        {/* Scroll container */}
        <div style={{ overflowY: 'auto', height: '100vh', paddingTop: 56 }}>
          {historia.demoStory ? (
            <div
              style={{
                padding: '12px 1.25rem 8px',
                maxWidth: 640,
                margin: '0 auto',
              }}
            >
              <DemoStoryDisclosure story={historia.demoStory} variant="page" />
            </div>
          ) : null}
          {imagenes.map((img, i) => (
            <section
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              style={{
                width: '100%',
                height: sectionHeight,
                minHeight: sectionHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {isDesktop ? (
                <div
                  role="figure"
                  aria-label={photoAriaLabel(img)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    width: 'min(75vw, 900px)',
                    height: 'calc(85vh - 80px)',
                  }}
                >
                  <img
                    src={img.url}
                    alt={photoAlt(img)}
                    className={i % 2 === 0 ? 'fotoalbum-kenburns' : 'fotoalbum-kenburns-alt'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      boxShadow: 'inset 0 0 0 14px rgba(255,255,255,0.92), inset 0 0 0 15px rgba(200,190,170,0.3)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 64,
                      background: 'rgba(255,255,255,0.92)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {fotoActivaIdx === i && (
                      <p
                        style={{
                          fontFamily: SITE_FONT_STACK,
                          fontWeight: 300,
                          fontSize: '0.78rem',
                          color: '#3a3028',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          padding: '0 16px',
                          margin: 0,
                        }}
                      >
                        {img.caption || ''}
                      </p>
                    )}
                  </div>
                </div>
              ) : isTablet ? (
                <div style={{ width: '85%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    role="figure"
                    aria-label={photoAriaLabel(img)}
                    style={{ position: 'relative', overflow: 'hidden', width: '100%', height: 'calc(80vh - 100px)', maxWidth: 600 }}
                  >
                    <img
                      src={img.url}
                      alt={photoAlt(img)}
                    className="fotoalbum-kenburns"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 10px rgba(255,255,255,0.92)' }} />
                  </div>
                  {img.caption && (
                    <p style={{ fontFamily: SITE_FONT_STACK, fontWeight: 300, fontSize: '0.82rem', color: CREAM_SOFT, marginTop: 12, padding: '0 16px', textAlign: 'center' }}>
                      {img.caption}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  role="figure"
                  aria-label={photoAriaLabel(img)}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <img
                    src={img.url}
                    alt={photoAlt(img)}
                    className="fotoalbum-kenburns"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 'calc(100vw * 1.2 - 80px)',
                      objectFit: 'cover',
                    }}
                  />
                  {img.caption && (
                    <p style={{ fontFamily: SITE_FONT_STACK, fontWeight: 300, fontSize: '0.82rem', color: CREAM_SOFT, padding: '12px 20px', margin: 0, textAlign: 'center' }}>
                      {img.caption}
                    </p>
                  )}
                </div>
              )}
            </section>
          ))}

          {/* Cierre del álbum — mismo criterio neumórfico claro que audio/vídeo al terminar */}
          <section
            style={{
              minHeight: '58vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 'clamp(2rem, 5vw, 3.25rem) 1.25rem',
              background: `linear-gradient(180deg, ${neu.bg} 0%, #dbe0e9 100%)`,
              fontFamily: SITE_FONT_STACK,
            }}
          >
            <div
              style={{
                ...neu.cardProminent,
                width: '100%',
                maxWidth: 520,
                padding: '2.25rem clamp(1.25rem, 4vw, 2.5rem)',
                borderRadius: 28,
                boxShadow: `${neu.cardProminent.boxShadow as string}, 0 36px 56px rgba(163,177,198,0.22)`,
              }}
            >
              <p
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: neu.textBody,
                  marginBottom: '0.85rem',
                }}
              >
                Fin del álbum · {imagenes.length} fotografías
              </p>
              <h2
                style={{
                  fontStyle: 'italic',
                  fontWeight: 600,
                  fontSize: 'clamp(1.35rem, 3.8vw, 1.85rem)',
                  color: neu.textMain,
                  marginBottom: '1.25rem',
                  lineHeight: 1.2,
                }}
              >
                {historia.titulo}
              </h2>
              <div style={{ width: 48, height: 2, background: `${SEPIA}45`, margin: '0 auto 1.35rem', borderRadius: 999 }} />
              <img
                src={historia.autor.avatar}
                alt={`Retrato de ${historia.autor.nombre}`}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${SEPIA}55`,
                  marginBottom: '0.85rem',
                  boxShadow: '8px 8px 14px rgba(163,177,198,0.4), -4px -4px 10px rgba(255,255,255,0.75)',
                }}
              />
              <p
                style={{
                  fontFamily: SITE_FONT_STACK,
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  color: neu.textMain,
                  marginBottom: historia.autor.ubicacion ? '0.35rem' : '1.2rem',
                }}
              >
                {historia.autor.nombre}
              </p>
              {historia.autor.ubicacion ? (
                <p style={{ fontFamily: SITE_FONT_STACK, fontWeight: 500, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: neu.textBody, marginBottom: '1.25rem' }}>
                  {historia.autor.ubicacion}
                </p>
              ) : null}
              {(historia.tags ?? []).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: '1.5rem' }}>
                  {historia.tags!.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: SITE_FONT_STACK,
                        fontWeight: 600,
                        fontSize: '0.62rem',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        padding: '6px 12px',
                        border: `1px solid rgba(255,69,0,0.28)`,
                        borderRadius: 999,
                        color: SEPIA,
                        backgroundColor: neu.bg,
                        boxShadow: 'inset 2px 2px 4px rgba(163,177,198,0.3), inset -2px -2px 4px rgba(255,255,255,0.8)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ marginBottom: '1.5rem' }} />
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'center' }}>
                {onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      ...neu.button,
                      fontFamily: SITE_FONT_STACK,
                      fontWeight: 600,
                      fontSize: '0.74rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      padding: '0.85rem 1.35rem',
                      color: neu.textMain,
                      cursor: 'pointer',
                      borderRadius: 999,
                      boxShadow: `${String(neu.button.boxShadow)}, inset 0 1px 0 rgba(255,255,255,0.75)`,
                    }}
                  >
                    ← Ver más historias
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const url =
                      typeof window !== 'undefined' ? `${window.location.origin}/historias/${historia.id}/foto` : '';
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      navigator.share({ title: historia.titulo, url }).catch(() => navigator.clipboard?.writeText(url));
                    } else {
                      navigator.clipboard?.writeText(url);
                    }
                  }}
                  style={{
                    fontFamily: SITE_FONT_STACK,
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    padding: '0.85rem 1.35rem',
                    borderRadius: 999,
                    border: `1px solid rgba(255,69,0,0.32)`,
                    color: '#fff',
                    cursor: 'pointer',
                    background: `linear-gradient(165deg, #ff7138 0%, ${neu.orange} 100%)`,
                    boxShadow: '0 18px 40px rgba(255,69,0,0.2), inset 0 -1px 0 rgba(0,0,0,0.08)',
                  }}
                >
                  Compartir
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Indicador lateral (solo escritorio) */}
        {isDesktop && imagenes.length > 0 && (
          <div
            style={{
              position: 'fixed',
              right: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => scrollToPhoto(fotoActivaIdx - 1)}
              disabled={fotoActivaIdx <= 0}
              aria-label="Foto anterior"
              style={{
                minHeight: 48,
                minWidth: 48,
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid rgba(245,240,232,0.45)',
                background: 'rgba(0,0,0,0.35)',
                color: CREAM,
                fontFamily: SITE_FONT_STACK,
                fontSize: '15px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                cursor: fotoActivaIdx <= 0 ? 'not-allowed' : 'pointer',
                opacity: fotoActivaIdx <= 0 ? 0.45 : 1,
              }}
            >
              ← Ant.
            </button>
            {imagenes.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToPhoto(i)}
                aria-label={`Ir a foto ${i + 1}`}
                style={{
                  width: 12,
                  height: fotoActivaIdx === i ? 44 : 12,
                  borderRadius: fotoActivaIdx === i ? 6 : 50,
                  background: fotoActivaIdx === i ? SEPIA : 'rgba(245,240,232,0.28)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s',
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => scrollToPhoto(fotoActivaIdx + 1)}
              disabled={fotoActivaIdx >= imagenes.length - 1}
              aria-label="Foto siguiente"
              style={{
                minHeight: 48,
                minWidth: 48,
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid rgba(245,240,232,0.45)',
                background: 'rgba(0,0,0,0.35)',
                color: CREAM,
                fontFamily: SITE_FONT_STACK,
                fontSize: '15px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                cursor: fotoActivaIdx >= imagenes.length - 1 ? 'not-allowed' : 'pointer',
                opacity: fotoActivaIdx >= imagenes.length - 1 ? 0.45 : 1,
              }}
            >
              Sig. →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
