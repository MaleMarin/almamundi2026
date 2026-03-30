'use client';

/**
 * Explicación del sitio + acceso a privacidad.
 * LOCK de contenido: no sustituir textos sin petición explícita del equipo (acuerdo editorial).
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
        className="max-h-[min(88vh,640px)] w-full max-w-lg overflow-y-auto rounded-[28px] p-6 shadow-2xl md:p-8"
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
          className="mt-5 space-y-4 text-sm leading-relaxed md:text-base"
          style={{ color: soft.textBody }}
        >
          <p>
            <strong style={{ color: soft.textMain }}>AlmaMundi</strong> es un espacio para que las
            historias humanas —en video, audio, texto o fotografía— tengan un lugar digno: no se
            pierden en el scroll infinito y pueden resonar con otras personas.
          </p>
          <p>
            Puedes <strong style={{ color: soft.textMain }}>grabar o subir tu relato</strong> desde
            las tarjetas de la página principal, explorar el <strong style={{ color: soft.textMain }}>mapa</strong>{' '}
            para descubrir voces de distintos lugares, y compartir con intención respetando siempre
            a quien cuenta y a quien escucha.
          </p>
          <p>
            Los datos que nos confías al participar se tratan con cuidado. La{' '}
            <strong style={{ color: soft.textMain }}>política de privacidad</strong> describe qué
            recopilamos, para qué y tus derechos.
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
