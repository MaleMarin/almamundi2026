'use client';

import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';

export interface ObservatoryShellProps {
  title: string;
  subtitleLeft?: string;
  subtitleRight?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** 'page' = full page with Link back; 'modal' = overlay with close button. Por defecto 'page' si no se pasa. */
  variant?: 'page' | 'modal';
  backHref?: string;
  onClose?: () => void;
}

export function ObservatoryShell({
  title,
  subtitleLeft,
  subtitleRight,
  badge,
  actions,
  children,
  variant = 'page',
  backHref = '/#mapa',
  onClose,
}: ObservatoryShellProps) {
  const isModal = variant === 'modal';

  return (
    <div
      className={
        isModal
          ? 'flex flex-col h-full min-h-0 bg-[#0F172A]/98 backdrop-blur-xl'
          : 'min-h-screen flex flex-col bg-[#0F172A]'
      }
    >
      <header
        className={
          isModal
            ? 'shrink-0 flex items-center justify-between gap-4 p-4 border-b border-white/10'
            : 'shrink-0 flex items-center justify-between gap-4 p-6 border-b border-white/10 backdrop-blur-xl bg-[#0F172A]/90 sticky top-0 z-10'
        }
      >
        <div className="flex items-center gap-3 min-w-0">
          {isModal && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X size={22} strokeWidth={2} />
            </button>
          ) : (
            <Link
              href={backHref}
              className="shrink-0 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Volver al globo"
            >
              <ArrowLeft size={isModal ? 20 : 24} strokeWidth={2} />
            </Link>
          )}
          <div className="min-w-0">
            <h1
              className={`font-bold text-white truncate ${isModal ? 'text-lg' : 'text-xl md:text-2xl'}`}
            >
              {title}
            </h1>
            {(subtitleLeft || subtitleRight) && (
              <p className={`text-white/60 truncate ${isModal ? 'text-xs' : 'text-sm'}`}>
                {[subtitleLeft, subtitleRight].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          {badge != null && <div className="shrink-0">{badge}</div>}
        </div>
        {actions != null && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </header>

      <section
        className={
          isModal
            ? 'flex-1 min-h-0 overflow-auto p-4'
            : 'flex-1 flex flex-col p-6 md:p-10'
        }
      >
        {children}
      </section>
    </div>
  );
}
