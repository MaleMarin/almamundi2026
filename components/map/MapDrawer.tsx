'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { MapDockMode } from './MapDock';

const DRAWER_WIDTH_DESKTOP = 360;
const DRAWER_HEIGHT_MOBILE = '70vh';

const DRAWER_TRANSITION = 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)';

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
    mode === 'stories' ? 'Historias' : mode === 'news' ? 'Noticias' : mode === 'sounds' ? 'Sonidos' : mode === 'bits' ? 'Bits' : 'Buscar por palabras clave';

  // MOBILE: bottom-sheet, contenido dentro del Universe (absolute, no fixed)
  if (isMobile) {
    return (
      <div className="absolute inset-0 z-30">
        <div
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="absolute bottom-0 left-0 right-0 flex max-h-[70vh] flex-col rounded-t-[28px] border border-white/10 bg-[#071225]/80 p-0 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          style={{
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
            <span className="text-lg font-medium text-white/95" style={{ fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/80 transition-colors hover:bg-white/15"
            >
              <X size={20} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4" style={{ scrollbarWidth: 'thin' }}>
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
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pointer-events-auto absolute right-6 top-6 bottom-6 w-[360px] flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#071225]/70 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        style={{
          transform: animatingIn ? 'translateX(0)' : 'translateX(100%)',
          transition: DRAWER_TRANSITION,
        }}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="text-lg font-medium text-white/95" style={{ fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/80 transition-colors hover:bg-white/15"
          >
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4" style={{ scrollbarWidth: 'thin' }}>
          {children}
        </div>
      </aside>
    </div>
  );
}
