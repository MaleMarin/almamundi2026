'use client';

import { useState, useEffect, useRef } from 'react';
import { formatPublishedAtEsStable } from '@/lib/historias/format-published-es-stable';
import { SITE_FONT_STACK } from '@/lib/typography';

const PAPEL = '#faf8f4';
const TINTA = '#2a2218';
const TINTA_SOFT = '#4a3f32';
const SEPIA = '#ff4500';
const SEPIA_DK = '#c23600';

export interface HistoriaTexto {
  id: string;
  titulo: string;
  subtitulo?: string;
  contenido: string;
  tiempoLectura?: number;
  fecha: string;
  autor: {
    nombre: string;
    avatar: string;
    ubicacion?: string;
    bio?: string;
  };
  tags?: string[];
}

interface TextoReaderProps {
  historia: HistoriaTexto;
  onClose?: () => void;
}

function formatFecha(fecha: string): string {
  if (!fecha) return '';
  const s = formatPublishedAtEsStable(fecha);
  return s === '—' ? fecha : s;
}

function getFirstParagraphDropAndRest(contenido: string): { drop: string; rest: string; otherParrafos: string[] } {
  const parrafos = splitParrafos(contenido);
  if (parrafos.length === 0) return { drop: '', rest: '', otherParrafos: [] };
  const first = parrafos[0].trim();
  const words = first.split(/\s+/);
  const drop = words.length <= 2 ? first : words.slice(0, 2).join(' ');
  const rest = words.length <= 2 ? '' : words.slice(2).join(' ');
  return { drop, rest, otherParrafos: parrafos.slice(1) };
}

function splitParrafos(contenido: string): string[] {
  const trimmed = contenido.trim();
  if (!trimmed) return [];
  return trimmed.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
}

export default function TextoReader({ historia, onClose }: TextoReaderProps) {
  const [readProgress, setReadProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [visibleParrafos, setVisibleParrafos] = useState<boolean[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
      setReadProgress(pct);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [historia.id]);

  const { drop, rest: restOfFirst, otherParrafos } = getFirstParagraphDropAndRest(historia.contenido);
  const totalParrafos = (drop || restOfFirst ? 1 : 0) + otherParrafos.length;

  useEffect(() => {
    const refs = paragraphRefs.current;
    if (totalParrafos === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleParrafos((prev) => {
          const next = [...prev];
          entries.forEach((e) => {
            const i = refs.indexOf(e.target as HTMLParagraphElement);
            if (i >= 0 && e.isIntersecting) next[i] = true;
          });
          return next;
        });
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.1 }
    );
    refs.forEach((r) => r && observer.observe(r));
    setVisibleParrafos((prev) => {
      const next = new Array(totalParrafos).fill(false);
      prev.forEach((v, i) => { if (i < totalParrafos) next[i] = v; });
      return next;
    });
    return () => observer.disconnect();
  }, [totalParrafos, historia.id]);

  const maxWidth = isMobile ? '100%' : '640px';
  const maxWidthDesktop = '720px';
  const paddingX = isMobile ? 20 : 24;
  const displayTags = (historia.tags ?? []).slice(0, isMobile ? 3 : undefined);
  const avatarSize = isMobile ? 48 : 64;

  return (
    <>
      {/* Barra de progreso */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${SEPIA_DK}, ${SEPIA})`,
          width: `${readProgress}%`,
          zIndex: 1000,
          transition: 'width 0.15s ease-out',
        }}
      />

      {/* Botón Volver */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: '1.2rem',
            left: '1.5rem',
            zIndex: 100,
            fontFamily: SITE_FONT_STACK,
            fontWeight: 300,
            fontSize: '0.75rem',
            color: SEPIA,
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
          {isMobile ? '←' : '← Volver'}
        </button>
      )}

      {/* Contenedor principal */}
      <div
        style={{
          background: PAPEL,
          minHeight: '100vh',
          paddingTop: '5rem',
          paddingBottom: '6rem',
          paddingLeft: paddingX,
          paddingRight: paddingX,
          maxWidth: isMobile ? '100%' : maxWidthDesktop,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Fecha */}
        <p
          style={{
            fontFamily: SITE_FONT_STACK,
            fontWeight: 200,
            fontSize: '0.7rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: SEPIA,
            marginBottom: '1.5rem',
          }}
        >
          {formatFecha(historia.fecha)}
        </p>

        {/* Título */}
        <h1
          style={{
            fontFamily: SITE_FONT_STACK,
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            color: TINTA,
            lineHeight: 1.15,
            marginBottom: '0.8rem',
          }}
        >
          {historia.titulo}
        </h1>

        {/* Subtítulo */}
        {historia.subtitulo && (
          <p
            style={{
              fontFamily: SITE_FONT_STACK,
              fontWeight: 300,
              fontSize: '1rem',
              color: TINTA_SOFT,
              lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}
          >
            {historia.subtitulo}
          </p>
        )}

        {/* Línea separadora */}
        <div
          style={{
            width: 60,
            height: 1,
            background: `linear-gradient(90deg, ${SEPIA_DK}, transparent)`,
            marginBottom: '1.5rem',
          }}
        />

        {/* Metadatos: avatar + nombre + tiempo */}
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
            marginBottom: '3rem',
          }}
        >
          <img
            src={historia.autor.avatar}
            alt=""
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <span style={{ fontFamily: SITE_FONT_STACK, fontWeight: 400, fontSize: '0.88rem', color: TINTA }}>
            {historia.autor.nombre}
          </span>
          <span style={{ color: TINTA_SOFT, opacity: 0.7 }}>·</span>
          {historia.tiempoLectura != null && (
            <span
              style={{
                fontFamily: SITE_FONT_STACK,
                fontWeight: 200,
                fontSize: '0.8rem',
                color: SEPIA,
              }}
            >
              {historia.tiempoLectura} min de lectura
            </span>
          )}
        </div>

        {/* Cuerpo: drop cap + párrafos con fade-in */}
        <article>
          {(drop || restOfFirst) && (
            <p
              ref={(el) => { paragraphRefs.current[0] = el; }}
              style={{
                fontFamily: SITE_FONT_STACK,
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                lineHeight: 2,
                color: TINTA,
                marginBottom: '1.6rem',
                letterSpacing: '0.01em',
                opacity: visibleParrafos[0] ? 1 : 0,
                transform: visibleParrafos[0] ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
              }}
            >
              {drop && (
                <span
                  style={{
                    fontFamily: SITE_FONT_STACK,
                    fontStyle: 'italic',
                    fontSize: isMobile ? '2.5rem' : 'clamp(2.5rem, 6vw, 4rem)',
                    color: SEPIA,
                    float: 'left',
                    lineHeight: 0.85,
                    marginRight: 8,
                    marginTop: 6,
                  }}
                >
                  {drop}
                </span>
              )}
              {restOfFirst}
            </p>
          )}

          {otherParrafos.map((texto, i) => {
            const idx = (drop || restOfFirst ? 1 : 0) + i;
            const isVisible = visibleParrafos[idx] ?? false;
            return (
              <p
                key={idx}
                ref={(el) => { paragraphRefs.current[idx] = el; }}
                style={{
                  fontFamily: SITE_FONT_STACK,
                  fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                  lineHeight: 2,
                  color: TINTA,
                  marginBottom: '1.6rem',
                  letterSpacing: '0.01em',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                  transition: 'opacity 0.7s ease, transform 0.7s ease',
                }}
              >
                {texto}
              </p>
            );
          })}
        </article>

        {/* Firma del autor */}
        <div style={{ marginTop: '4rem' }}>
          <div
            style={{
              width: 40,
              height: 1,
              background: SEPIA,
              margin: '0 auto 2rem',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img
              src={historia.autor.avatar}
              alt=""
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `1.5px solid ${SEPIA}`,
                marginBottom: '0.75rem',
              }}
            />
            <p
              style={{
                fontFamily: SITE_FONT_STACK,
                fontStyle: 'italic',
                fontSize: '1.3rem',
                color: TINTA,
                marginBottom: '0.25rem',
              }}
            >
              {historia.autor.nombre}
            </p>
            {historia.autor.ubicacion && (
              <p
                style={{
                  fontFamily: SITE_FONT_STACK,
                  fontWeight: 200,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: SEPIA,
                  marginBottom: '0.5rem',
                }}
              >
                {historia.autor.ubicacion}
              </p>
            )}
            {historia.autor.bio && (
              <p
                style={{
                  fontFamily: SITE_FONT_STACK,
                  fontWeight: 300,
                  fontSize: '0.85rem',
                  color: TINTA_SOFT,
                  maxWidth: 360,
                  marginBottom: '1rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {historia.autor.bio}
              </p>
            )}
            {displayTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: SITE_FONT_STACK,
                      fontWeight: 200,
                      fontSize: '0.65rem',
                      padding: '4px 10px',
                      border: `1px solid rgba(255,69,0,0.5)`,
                      borderRadius: 999,
                      color: SEPIA_DK,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navegación final */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            marginTop: '3rem',
          }}
        >
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
                color: SEPIA_DK,
                cursor: 'pointer',
                borderRadius: 4,
              }}
            >
              ← Volver a las historias
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const url = typeof window !== 'undefined' ? `${window.location.origin}/historias/${historia.id}/texto` : '';
              if (typeof navigator !== 'undefined' && navigator.share) {
                navigator.share({ title: historia.titulo, url, text: historia.subtitulo }).catch(() => {
                  navigator.clipboard?.writeText(url);
                });
              } else {
                navigator.clipboard?.writeText(url);
              }
            }}
            style={{
              fontFamily: SITE_FONT_STACK,
              fontWeight: 400,
              fontSize: '0.875rem',
              padding: '0.6rem 1.2rem',
              border: `1px solid ${TINTA_SOFT}`,
              background: 'transparent',
              color: TINTA_SOFT,
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            Compartir esta historia
          </button>
        </div>
      </div>
    </>
  );
}
