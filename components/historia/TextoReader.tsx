'use client';

import { useState, useRef, useEffect } from 'react';

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

const PAPER = '#faf8f4';
const INK = '#2a2520';
const DROP_CAP = '#c9a96e';

export default function TextoReader({ historia, onClose }: TextoReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleLines, setVisibleLines] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      setScrollProgress(max <= 0 ? 1 : Math.min(scrollTop / max, 1));
    };
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [historia.contenido]);

  const lines = historia.contenido.split('\n').filter(Boolean);
  const firstLine = lines[0] ?? '';
  const firstTwoWords = firstLine.split(/\s+/).slice(0, 2).join(' ');
  const restOfFirstLine = firstLine.slice(firstTwoWords.length).trim();
  const remainingLines = lines.slice(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observers: IntersectionObserver[] = [];
    const lineEls = el.querySelectorAll('[data-line-index]');
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleLines((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            const idx = Number((entry.target as HTMLElement).dataset.lineIndex);
            if (entry.isIntersecting) next.add(idx);
          });
          return next;
        });
      },
      { root: el, rootMargin: '-10% 0px -10% 0px', threshold: 0 }
    );
    lineEls.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [historia.contenido]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: PAPER,
        overflow: 'auto',
        fontFamily: "'Jost', sans-serif",
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(201,169,110,0.2)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${scrollProgress * 100}%`,
            background: DROP_CAP,
            transition: 'width 0.15s ease',
          }}
        />
      </div>

      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '3rem 2rem 4rem',
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              marginBottom: '2rem',
              background: 'none',
              border: 'none',
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.9rem',
              color: INK,
              cursor: 'pointer',
              opacity: 0.7,
            }}
          >
            ← Volver
          </button>
        )}

        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.8rem',
            color: 'rgba(42,37,32,0.6)',
            marginBottom: '1.5rem',
          }}
        >
          {historia.tiempoLectura ?? 0} min de lectura
        </p>

        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 600,
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            color: INK,
            lineHeight: 1.2,
            marginBottom: '0.5rem',
          }}
        >
          {historia.titulo}
        </h1>
        {historia.subtitulo && (
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: '1.1rem',
              color: 'rgba(42,37,32,0.7)',
              marginBottom: '2rem',
            }}
          >
            {historia.subtitulo}
          </p>
        )}

        <article
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.15rem',
            lineHeight: 2,
            color: INK,
          }}
        >
          <p style={{ marginBottom: '1.5em' }}>
            <span
              style={{
                float: 'left',
                fontSize: '3rem',
                lineHeight: 1.1,
                color: DROP_CAP,
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                marginRight: '0.25rem',
                marginTop: '-0.1em',
              }}
            >
              {firstTwoWords}
            </span>
            {restOfFirstLine && (
              <span
                data-line-index={0}
                style={{
                  opacity: visibleLines.has(0) ? 1 : 0.3,
                  transition: 'opacity 0.5s ease',
                }}
              >
                {restOfFirstLine}
              </span>
            )}
          </p>
          {remainingLines.map((line, i) => (
            <p
              key={i}
              data-line-index={i + 1}
              style={{
                marginBottom: '1.5em',
                opacity: visibleLines.has(i + 1) ? 1 : 0.3,
                transition: 'opacity 0.5s ease',
              }}
            >
              {line}
            </p>
          ))}
        </article>

        <div
          style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(42,37,32,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <img
            src={historia.autor.avatar}
            alt={historia.autor.nombre}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(201,169,110,0.3)',
            }}
          />
          <div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '0.95rem', color: INK, margin: 0 }}>
              {historia.autor.nombre}
            </p>
            {historia.autor.ubicacion && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: 'rgba(42,37,32,0.6)', margin: '0.2rem 0 0 0' }}>
                {historia.autor.ubicacion}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
