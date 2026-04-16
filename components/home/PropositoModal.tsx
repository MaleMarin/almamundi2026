'use client';

/**
 * Texto editorial de `lib/proposito-text.ts`.
 * LOCK de contenido: no sustituir textos sin petición explícita del equipo.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  PROPOSITO_CIERRE,
  PROPOSITO_PARAGRAPHS,
  PROPOSITO_SUBTITLE,
  PROPOSITO_TITLE,
  type PropositoBlock,
} from '@/lib/proposito-text';
import { SITE_FONT_STACK } from '@/lib/typography';

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  button: {
    backgroundColor: '#E9ECF3',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: SITE_FONT_STACK,
    boxShadow: [
      '11px 11px 26px rgba(136, 150, 170, 0.45)',
      '-11px -11px 26px rgba(255, 255, 255, 0.96)',
      'inset 1px 1px 3px rgba(255, 255, 255, 0.65)',
      'inset -2px -2px 6px rgba(163, 177, 198, 0.18)',
    ].join(', '),
  },
} as const;

function renderBlock(block: PropositoBlock, index: number) {
  if (typeof block === 'string') {
    return (
      <p key={index} className="leading-relaxed">
        {block}
      </p>
    );
  }
  if ('lines' in block) {
    return (
      <div key={index} className="space-y-2 leading-relaxed">
        {block.lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  }
  return (
    <p key={index} className="leading-relaxed">
      {block.text}
      <strong style={{ color: soft.textMain }}>{block.bold}</strong>
    </p>
  );
}

export function PropositoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center p-4"
      style={{ background: 'rgba(30, 35, 45, 0.55)', backdropFilter: 'blur(8px)' }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposito-titulo"
        className="max-h-[min(88vh,720px)] w-full max-w-xl overflow-y-auto rounded-[28px] p-6 shadow-2xl md:p-8"
        style={{
          ...soft.button,
          backgroundColor: soft.bg,
          borderRadius: 28,
          fontFamily: SITE_FONT_STACK,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="proposito-titulo"
          className="text-lg font-semibold leading-snug md:text-xl"
          style={{ color: soft.textMain }}
        >
          {PROPOSITO_TITLE}
        </h2>
        {PROPOSITO_SUBTITLE ? (
          <p className="mt-2 text-sm md:text-base" style={{ color: soft.textBody }}>
            {PROPOSITO_SUBTITLE}
          </p>
        ) : null}
        <div
          className="mt-5 space-y-4 text-sm leading-relaxed md:text-base"
          style={{ color: soft.textBody }}
        >
          {PROPOSITO_PARAGRAPHS.map((block, i) => renderBlock(block, i))}
        </div>
        <p
          className="mt-6 text-sm font-medium md:text-base"
          style={{ color: soft.textMain }}
        >
          {PROPOSITO_CIERRE}
        </p>
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-almamundi rounded-full px-6 py-3 text-sm font-semibold transition active:scale-[0.98]"
            style={{ ...soft.button, color: soft.textMain }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
