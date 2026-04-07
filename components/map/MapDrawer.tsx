'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { X } from 'lucide-react';
import { SITE_FONT_STACK } from '@/lib/typography';
import type { MapDockMode } from './MapDock';

const DRAWER_WIDTH_DESKTOP = 360;
const DRAWER_HEIGHT_MOBILE = '70vh';

const DRAWER_TRANSITION = 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)';

/** Glassmorphism: panel más claro y “cristal” legible sobre el mapa */
const glassShell: CSSProperties = {
  background:
    'linear-gradient(168deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.18) 42%, rgba(255,255,255,0.08) 68%, rgba(200, 220, 255, 0.14) 100%)',
  backdropFilter: 'blur(40px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(40px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.48)',
  boxShadow:
    '0 28px 80px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.62), inset 0 0 0 1px rgba(255,255,255,0.12)',
};

const glassHeaderBar: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.1) 100%)',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
  borderBottom: '1px solid rgba(255,255,255,0.32)',
};

const glassCloseBtn: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.14) 100%)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
};

type MapDrawerProps = {
  open: boolean;
  mode: MapDockMode;
  onClose: () => void;
  children: React.ReactNode;
  isMobile?: boolean;
  /** Obsoletos: el drawer es absolute dentro del Universe, ya no se usan */
  sectionTop?: number;
  sectionHeight?: number;
};

export function MapDrawer({ open, mode, onClose, children, isMobile }: MapDrawerProps) {
  const [animatingIn, setAnimatingIn] = useState(false);

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => {
        setAnimatingIn(false);
        requestAnimationFrame(() => setAnimatingIn(true));
      });
      return () => cancelAnimationFrame(t);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const onEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', onEscape);
      return () => window.removeEventListener('keydown', onEscape);
    }
  }, [open, onClose]);

  if (!open) return null;

  const title =
    mode === 'stories' ? 'Historias' : mode === 'news' ? 'Noticias en vivo' : mode === 'sounds' ? 'Sonidos' : mode === 'bits' ? 'Bits' : 'Buscar por palabras clave';
  const bitsMode = mode === 'bits';
  /** En Bits no se muestra el título visible; el diálogo sigue teniendo etiqueta para accesibilidad. */
  const dialogAriaLabel = bitsMode ? 'Hecho curioso del lugar' : title;

  // MOBILE: bottom-sheet, contenido dentro del Universe (absolute, no fixed)
  if (isMobile) {
    return (
      <div className="absolute inset-0 z-30">
        <div
          className="absolute inset-0 bg-black/15"
          onClick={onClose}
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={dialogAriaLabel}
          className={`absolute bottom-0 left-0 right-0 flex max-h-[70vh] flex-col rounded-t-[28px] p-0 ${bitsMode ? 'h-auto' : ''}`}
          style={{
            ...glassShell,
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <div
            className={`flex flex-shrink-0 items-center px-5 py-4 ${bitsMode ? 'justify-end' : 'justify-between'}`}
            style={glassHeaderBar}
          >
            {!bitsMode ? (
              <span className="text-lg font-medium text-white/95" style={{ fontFamily: SITE_FONT_STACK }}>
                {title}
              </span>
            ) : (
              <span className="sr-only">{dialogAriaLabel}</span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/[0.12]"
              style={glassCloseBtn}
            >
              <X size={20} />
            </button>
          </div>
        <div
          className={
            mode === 'bits'
              ? 'min-h-0 overflow-y-auto overflow-x-hidden px-5 py-4'
              : 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4'
          }
          style={{
            scrollbarWidth: 'thin',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// DESKTOP: drawer derecho, slide in from right (misma animación que Noticias)
  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <div
        className="absolute inset-0 bg-black/12 pointer-events-auto"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={dialogAriaLabel}
        className={`pointer-events-auto absolute right-6 flex flex-col overflow-hidden rounded-[28px] ${
          bitsMode
            ? 'top-6 max-h-[calc(100%-3rem)] w-[min(calc(100vw-3rem),400px)]'
            : 'top-6 bottom-6 w-[360px]'
        }`}
        style={{
          ...glassShell,
          transform: animatingIn ? 'translateX(0)' : 'translateX(100%)',
          transition: DRAWER_TRANSITION,
        }}
      >
        <div
          className={`flex flex-shrink-0 items-center px-5 py-4 ${bitsMode ? 'justify-end' : 'justify-between'}`}
          style={glassHeaderBar}
        >
          {!bitsMode ? (
            <span className="text-lg font-medium text-white/95" style={{ fontFamily: SITE_FONT_STACK }}>
              {title}
            </span>
          ) : (
            <span className="sr-only">{dialogAriaLabel}</span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/[0.12]"
            style={glassCloseBtn}
          >
            <X size={20} />
          </button>
        </div>
        <div
          className={
            mode === 'bits'
              ? 'min-h-0 overflow-y-auto overflow-x-hidden px-5 py-4'
              : 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4'
          }
          style={{
            scrollbarWidth: 'thin',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {children}
        </div>
      </aside>
    </div>
  );
}
