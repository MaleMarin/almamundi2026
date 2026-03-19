'use client';

import { useState, useRef, useEffect } from 'react';

export interface HistoriaFotos {
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
  historia: HistoriaFotos;
  onClose?: () => void;
}

function getDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#1a1612');
          return;
        }
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const desat = Math.round(luminance * 0.15);
        const dark = `rgb(${desat},${desat},${Math.round(desat * 0.9)})`;
        resolve(dark);
      } catch {
        resolve('#1a1612');
      }
    };
    img.onerror = () => resolve('#1a1612');
    img.src = imageUrl;
  });
}

const ROTATIONS: number[] = [];
function getRotation(index: number): number {
  if (ROTATIONS[index] !== undefined) return ROTATIONS[index];
  ROTATIONS[index] = -1.5 + Math.random() * 3;
  return ROTATIONS[index];
}

export default function FotoAlbum({ historia, onClose }: FotoAlbumProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bgColor, setBgColor] = useState('#1a1612');
  const [captionVisible, setCaptionVisible] = useState<string | null>(null);

  const activeImage = historia.imagenes[activeIndex];
  const isLast = activeIndex === historia.imagenes.length - 1;

  useEffect(() => {
    if (!activeImage?.url) return;
    getDominantColor(activeImage.url).then(setBgColor);
  }, [activeImage?.url]);

  useEffect(() => {
    setCaptionVisible(historia.imagenes[activeIndex]?.caption ?? null);
  }, [activeIndex, historia.imagenes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sections = el.querySelectorAll('[data-slide-index]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.slideIndex);
            setActiveIndex(idx);
          }
        });
      },
      { root: el, rootMargin: '-15% 0px -15% 0px', threshold: 0.5 }
    );
    sections.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [historia.imagenes.length]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: bgColor,
        transition: 'background 0.8s ease',
        overflow: 'auto',
        fontFamily: "'Jost', sans-serif",
      }}
    >
      <style>{`
        @keyframes kenBurns {
          from { transform: scale(1); }
          to { transform: scale(1.08) translate(1%, 1%); }
        }
        .ken-burns {
          animation: kenBurns 8s ease-in-out infinite alternate;
        }
      `}</style>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.3)',
            color: '#f5f0e8',
            fontSize: '1.25rem',
            cursor: 'pointer',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      )}

      <div
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: onClose ? '5rem' : '1.5rem',
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.1em',
          zIndex: 20,
        }}
      >
        {activeIndex + 1} / {historia.imagenes.length}
      </div>

      <div style={{ padding: '2rem 0 4rem' }}>
        {historia.imagenes.map((img, i) => (
          <section
            key={i}
            data-slide-index={i}
            style={{
              minHeight: '85vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 1rem',
            }}
          >
            <div
              style={{
                background: '#fff',
                padding: '12px 12px 40px 12px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                transform: `rotate(${getRotation(i)}deg)`,
                maxWidth: '90vw',
              }}
            >
              <div
                className="ken-burns"
                style={{
                  width: '100%',
                  maxWidth: '900px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={img.url}
                  alt={img.caption ?? `Foto ${i + 1}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </section>
        ))}

        {captionVisible && (
          <div
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: '600px',
              padding: '0.75rem 1.25rem',
              background: 'rgba(0,0,0,0.5)',
              color: '#f5f0e8',
              fontSize: '0.9rem',
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              textAlign: 'center',
              borderRadius: '4px',
              opacity: captionVisible ? 1 : 0,
              transition: 'opacity 0.4s ease',
              zIndex: 15,
            }}
          >
            {captionVisible}
          </div>
        )}

        {isLast && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '3rem 2rem',
              marginTop: '2rem',
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
                border: '2px solid rgba(201,169,110,0.4)',
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '0.95rem', color: '#f5f0e8' }}>
                {historia.autor.nombre}
              </p>
              {historia.autor.ubicacion && (
                <p style={{ margin: '0.2rem 0 0 0', fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: 'rgba(245,240,232,0.7)' }}>
                  {historia.autor.ubicacion}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
