'use client';

/**
 * Explicación del sitio + acceso a privacidad (copy acordado con el equipo editorial).
 */
import Link from 'next/link';
import { useEffect } from 'react';
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

export function ComoFuncionaModal({
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

  if (!isOpen) return null;

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
          fontFamily: SITE_FONT_STACK,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="como-funciona-titulo"
          className="text-xl font-semibold md:text-2xl"
          style={{ color: soft.textMain }}
        >
          ¿Cómo funciona?
        </h2>
        <div
          className="mt-5 space-y-3 text-[0.8125rem] leading-relaxed md:space-y-3.5 md:text-sm"
          style={{ color: soft.textBody }}
        >
          <p>AlmaMundi es un mapa vivo de historias humanas.</p>
          <p>
            Puedes compartir tu relato en{' '}
            <strong style={{ color: soft.textMain }}>audio, texto o fotografía</strong>. La opción de{' '}
            <strong style={{ color: soft.textMain }}>video es solo para personas mayores de 18 años</strong>.
            Cada historia pasa por revisión editorial:{' '}
            <strong style={{ color: soft.textMain }}>nada se publica automáticamente</strong>.
          </p>
          <p>
            Solo publicamos relatos que respeten la dignidad humana, la privacidad, los derechos de autor y los
            derechos humanos. No se aceptan contenidos con{' '}
            <strong style={{ color: soft.textMain }}>
              insultos, injurias, calumnias, discriminación, racismo, xenofobia, homofobia, amenazas, violencia,
              abuso, explotación, exposición indebida de terceros, vulneración de derechos de niños, niñas y
              adolescentes, plagio o uso no autorizado de material ajeno
            </strong>
            .
          </p>
          <p>
            Para cuidar cada historia, revisamos su contenido, autoría, consentimiento y posibles riesgos para otras
            personas. Podemos pedir ajustes, no publicar o retirar relatos cuando sea necesario.
          </p>
          <p>
            No pedimos datos sensibles para identificar la autoría. Usamos solo la información necesaria para revisar
            el envío y proteger a quienes participan.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <Link
            href="/privacidad"
            className="btn-almamundi inline-flex justify-center rounded-full px-6 py-3 text-center text-sm font-semibold transition active:scale-[0.98]"
            style={{ ...soft.button, color: soft.textMain }}
            onClick={onClose}
          >
            Ver política de privacidad
          </Link>
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
    </div>
  );
}
