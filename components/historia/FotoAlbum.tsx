'use client';

import { SITE_FONT_STACK } from '@/lib/typography';
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
  imagenes: { url: string; caption?: string }[];
  autor: {
    nombre: string;
    avatar: string;
    ubicacion?: string;
  };
  tags?: string[];
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
  const rotations = useRef(imagenes.map(() => (Math.random() - 0.5) * 3));

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
      setCaption(imagenes[fotoActivaIdx].caption ?? '');
    }
  }, [fotoActivaIdx, imagenes]);

  const scrollToPhoto = useCallback((i: number) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    width: 'min(75vw, 900px)',
                    height: 'calc(85vh - 80px)',
                    transform: `rotate(${rotations.current[i]}deg)`,
                  }}
                >
                  <img
                    src={img.url}
                    alt=""
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
                  <div style={{ position: 'relative', overflow: 'hidden', width: '100%', height: 'calc(80vh - 100px)', maxWidth: 600 }}>
                    <img
                      src={img.url}
                      alt=""
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
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src={img.url}
                    alt=""
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

          {/* Cierre del álbum */}
          <section
            style={{
              minHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '3rem 1.5rem',
            }}
          >
            <div style={{ width: 40, height: 1, background: SEPIA, marginBottom: '2rem' }} />
            <img
              src={historia.autor.avatar}
              alt=""
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `1.5px solid ${SEPIA}`,
                boxShadow: `0 0 24px ${SEPIA}40`,
                marginBottom: '1rem',
              }}
            />
            <p style={{ fontFamily: SITE_FONT_STACK, fontStyle: 'italic', fontSize: '1.4rem', color: CREAM, marginBottom: '0.25rem' }}>
              {historia.autor.nombre}
            </p>
            {historia.autor.ubicacion && (
              <p style={{ fontFamily: SITE_FONT_STACK, fontWeight: 200, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: SEPIA, marginBottom: '0.5rem' }}>
                {historia.autor.ubicacion}
              </p>
            )}
            <p style={{ fontFamily: SITE_FONT_STACK, fontWeight: 300, fontSize: '0.9rem', color: CREAM_MUTED, marginBottom: '1rem' }}>
              Fin del álbum · {imagenes.length} fotografías
            </p>
            {(historia.tags ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: '1.5rem' }}>
                {historia.tags!.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: SITE_FONT_STACK,
                      fontWeight: 200,
                      fontSize: '0.65rem',
                      padding: '4px 10px',
                      border: `1px solid rgba(255,69,0,0.5)`,
                      borderRadius: 999,
                      color: SEPIA,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    fontFamily: SITE_FONT_STACK,
                    fontWeight: 400,
                    fontSize: '0.875rem',
                    padding: '0.6rem 1.2rem',
                    border: `1px solid ${SEPIA}`,
                    background: 'transparent',
                    color: SEPIA,
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  ← Ver más historias
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== 'undefined' ? `${window.location.origin}/historias/${historia.id}/foto` : '';
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({ title: historia.titulo, url }).catch(() => navigator.clipboard?.writeText(url));
                  } else {
                    navigator.clipboard?.writeText(url);
                  }
                }}
                style={{
                  fontFamily: SITE_FONT_STACK,
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  padding: '0.6rem 1.2rem',
                  border: `1px solid rgba(245,240,232,0.4)`,
                  background: 'transparent',
                  color: CREAM_SOFT,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                Compartir
              </button>
            </div>
          </section>
        </div>

        {/* Indicador lateral (solo escritorio) */}
        {isDesktop && imagenes.length > 0 && (
          <div
            style={{
              position: 'fixed',
              right: '2rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'center',
            }}
          >
            {imagenes.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToPhoto(i)}
                aria-label={`Ir a foto ${i + 1}`}
                style={{
                  width: 8,
                  height: fotoActivaIdx === i ? 24 : 8,
                  borderRadius: fotoActivaIdx === i ? 4 : 50,
                  background: fotoActivaIdx === i ? SEPIA : 'rgba(245,240,232,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
