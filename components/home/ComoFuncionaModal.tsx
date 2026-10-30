'use client';

/**
 * Explicación del sitio + acceso a privacidad (copy acordado con el equipo editorial).
 */
import Link from 'next/link';
import { useEffect } from 'react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { COMO_FUNCIONA } from '@/lib/i18n/como-funciona';
import { SITE_FONT_STACK } from '@/lib/typography';
const soft = {
  bg: 'var(--home-bg)',
  textMain: '#4A5568',
  textBody: '#616C7C',
  button: {
    backgroundColor: '#FBFAF8',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: SITE_FONT_STACK,
    boxShadow: [
      '11px 11px 26px rgba(136, 150, 170, 0.45)',
      '-11px -11px 26px rgba(255, 255, 255, 0.96)',
      'inset 1px 1px 3px rgba(255, 255, 255, 0.65)',
      'inset -2px -2px 6px rgba(120,110,100,0.18)',
    ].join(', ') } } as const;

export function ComoFuncionaModal({
  isOpen,
  onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { locale } = useHomeLocale();
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copy = COMO_FUNCIONA[locale];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(30, 35, 45, 0.55)', backdropFilter: 'blur(8px)' }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="como-funciona-titulo"
        className="max-h-[min(90vh,680px)] w-full max-w-lg overflow-y-auto rounded-[28px] p-6 shadow-2xl md:p-8"
        style={{
          ...soft.button,
          backgroundColor: soft.bg,
          borderRadius: 28,
          fontFamily: SITE_FONT_STACK }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="como-funciona-titulo"
          className="text-[length:var(--fs-subtitulo)] font-semibold "
          style={{ color: soft.textMain }}
        >
          {copy.title}
        </h2>
        <div
          className="mt-5 space-y-3 text-[length:var(--fs-pequeno)] leading-relaxed md:space-y-3.5 "
          style={{ color: soft.textBody }}
        >
          <p>{copy.p1}</p>
          <p>
            {copy.p2}{' '}
            <strong style={{ color: soft.textMain }}>{copy.formats}</strong>
            {copy.p2b}{' '}
            <strong style={{ color: soft.textMain }}>{copy.auto}</strong>.
          </p>
          <p>
            {copy.p3}{' '}
            <strong style={{ color: soft.textMain }}>{copy.banned}</strong>.
          </p>
          <p>{copy.p4}</p>
          <p>{copy.p5}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <Link
            href="/privacidad"
            className="btn-almamundi inline-flex justify-center rounded-full px-6 py-3 text-center text-[length:var(--fs-pequeno)] font-semibold transition active:scale-[0.98]"
            style={{ ...soft.button, color: soft.textMain }}
            onClick={onClose}
          >
            {copy.privacy}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="btn-almamundi rounded-full px-6 py-3 text-[length:var(--fs-pequeno)] font-semibold transition active:scale-[0.98]"
            style={{ ...soft.button, color: soft.textMain }}
          >
            {copy.close}
          </button>
        </div>
      </div>
    </div>
  );
}
