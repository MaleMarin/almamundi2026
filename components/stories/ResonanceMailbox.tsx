'use client';

/**
 * Buzón de resonancia: carta breve al relato; modal y envío vía API (filtro de tono + registro;
 * el equipo puede revisar antes de acercar el mensaje a quien narra).
 */
import { X } from 'lucide-react';
import {
  HISTORIAS_FILTER_ICON_IMG_CLASS,
  HISTORIAS_FILTER_ICON_WELL_CLASS,
  HISTORIAS_MAILBOX_ICON_SRC,
} from '@/lib/historias/historias-exhibition-icons';
import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

export type ResonanceMailboxTriggerLayout = 'floating' | 'inline';

export type ResonanceMailboxProps = {
  storyId: string;
  recipientName: string;
  className?: string;
  /**
   * `floating`: botón circular a la izquierda del carrusel (comportamiento anterior).
   * `inline`: solo el botón, sin posicionamiento absoluto (p. ej. barra superior junto a compartir).
   */
  triggerLayout?: ResonanceMailboxTriggerLayout;
  /** `light`: icono y borde oscuros para barra sobre fondo claro (sala de exposición clara). `orange`: AlmaMundi en listados. */
  triggerTone?: 'dark' | 'light' | 'orange';
  /** Texto al pasar el cursor (p. ej. leyenda breve en barra de filtros). */
  triggerTitle?: string;
  /** Sustituye el aria-label del botón (p. ej. «Carta a quien cuenta» en listados). */
  triggerAriaLabel?: string;
};

export function ResonanceMailbox({
  storyId,
  recipientName,
  className = '',
  triggerLayout = 'floating',
  triggerTone = 'dark',
  triggerTitle,
  triggerAriaLabel,
}: ResonanceMailboxProps) {
  const mailboxAria =
    triggerAriaLabel ??
    'Carta de resonancia: escribir para quien narra; AlmaMundi revisa el mensaje antes de poder acercárselo';
  const dialogId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reformulateHint, setReformulateHint] = useState<string | null>(null);
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    setText('');
    setError(null);
    setReformulateHint(null);
    if (!open) return;
  }, [storyId, open]);

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setError('Escribe al menos unas palabras.');
      return;
    }
    setSending(true);
    setError(null);
    setReformulateHint(null);
    try {
      const res = await fetch(`/api/stories/${encodeURIComponent(storyId)}/affective-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        reformulate?: boolean;
        hint?: string;
        error?: string;
      };
      if (res.status === 422 && data.reformulate && data.hint) {
        setReformulateHint(data.hint);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'No se pudo enviar. Intenta más tarde.');
        return;
      }
      setOpen(false);
      setText('');
      setGlow(true);
      window.setTimeout(() => setGlow(false), 1800);
    } catch {
      setError('Error de red. Revisa tu conexión.');
    } finally {
      setSending(false);
    }
  }, [storyId, text]);

  return (
    <>
      <style>{`
        @keyframes pulsoAfectivo {
          0% {
            box-shadow: 0 0 10px rgba(147, 197, 253, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 25px rgba(147, 197, 253, 0.6);
            transform: scale(1.05);
          }
          100% {
            box-shadow: 0 0 10px rgba(147, 197, 253, 0.3);
            transform: scale(1);
          }
        }
        @keyframes resonance-mailbox-sent {
          0% { box-shadow: 0 0 0 0 rgba(255, 200, 150, 0); transform: scale(1); }
          35% { box-shadow: 0 0 32px 14px rgba(255, 180, 120, 0.55); transform: scale(1.04); }
          100% { box-shadow: 0 0 12px rgba(147, 197, 253, 0.35); transform: scale(1); }
        }
        .boton-resonancia {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: border-color 0.35s ease, background-color 0.35s ease;
          box-shadow: 0 0 15px rgba(100, 200, 255, 0.2);
          animation: pulsoAfectivo 4s ease-in-out infinite;
        }
        .boton-resonancia:hover {
          border-color: rgba(255, 255, 255, 0.45);
          background: rgba(255, 255, 255, 0.14);
        }
        .boton-resonancia--sent {
          animation: resonance-mailbox-sent 1.6s ease-out forwards;
        }
        .boton-resonancia--inline {
          width: 40px;
          height: 40px;
        }
        .boton-resonancia--inline > svg {
          width: 1.25rem;
          height: 1.25rem;
        }
        .boton-resonancia--light-inline {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(60, 60, 70, 0.22);
          color: rgb(31, 41, 55);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
          animation: none;
        }
        .boton-resonancia--light-inline:hover {
          border-color: rgba(60, 60, 70, 0.35);
          background: rgba(255, 255, 255, 0.95);
        }
        .boton-resonancia--orange-inline {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.92);
          border: 2px solid var(--almamundi-orange, #ff4500);
          color: var(--almamundi-orange, #ff4500);
          box-shadow: 0 2px 14px rgba(255, 69, 0, 0.12);
          animation: none;
        }
        .boton-resonancia--orange-inline:hover {
          background: rgba(255, 255, 255, 1);
          border-color: var(--almamundi-orange, #ff4500);
          box-shadow: 0 2px 18px rgba(255, 69, 0, 0.2);
        }
        .boton-resonancia--orange-floating {
          background: rgba(255, 255, 255, 0.12);
          border: 2px solid var(--almamundi-orange, #ff4500);
          color: var(--almamundi-orange, #ff4500);
          animation: none;
          box-shadow: 0 0 18px rgba(255, 69, 0, 0.25);
        }
        .boton-resonancia--orange-floating:hover {
          border-color: var(--almamundi-orange, #ff4500);
          background: rgba(255, 255, 255, 0.18);
        }
      `}</style>

      {triggerLayout === 'floating' ? (
        <div
          className={`pointer-events-none absolute left-20 top-1/2 z-30 -translate-y-1/2 sm:left-24 ${className}`}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setError(null);
              setReformulateHint(null);
            }}
            className={`boton-resonancia pointer-events-auto ${triggerTone === 'orange' ? 'boton-resonancia--orange-floating' : 'text-white/95'} ${glow ? 'boton-resonancia--sent' : ''}`}
            aria-expanded={open}
            aria-controls={dialogId}
            aria-label={mailboxAria}
            title={triggerTitle}
          >
            <span className={`${HISTORIAS_FILTER_ICON_WELL_CLASS} h-8 w-8`} aria-hidden>
              <img
                src={HISTORIAS_MAILBOX_ICON_SRC}
                alt=""
                width={22}
                height={22}
                className={`${HISTORIAS_FILTER_ICON_IMG_CLASS} h-[1.25rem] w-[1.25rem]`}
                draggable={false}
              />
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
            setReformulateHint(null);
          }}
          className={`boton-resonancia boton-resonancia--inline shrink-0 ${
            triggerTone === 'orange'
              ? 'boton-resonancia--orange-inline'
              : triggerTone === 'light'
                ? 'boton-resonancia--light-inline'
                : 'text-white/95'
          } ${glow ? 'boton-resonancia--sent' : ''} ${className}`}
          aria-expanded={open}
          aria-controls={dialogId}
          aria-label={mailboxAria}
          title={triggerTitle}
        >
          <span className={HISTORIAS_FILTER_ICON_WELL_CLASS} aria-hidden>
            <img
              src={HISTORIAS_MAILBOX_ICON_SRC}
              alt=""
              width={18}
              height={18}
              className={HISTORIAS_FILTER_ICON_IMG_CLASS}
              draggable={false}
            />
          </span>
        </button>
      )}

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
            >
              <div
                id={dialogId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${dialogId}-title`}
                className="relative box-border w-full max-w-md rounded-2xl border border-white/20 bg-[rgba(22,26,36,0.92)] p-5 text-white shadow-2xl backdrop-blur-xl sm:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-3 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
                <h2
                  id={`${dialogId}-title`}
                  className="pr-10 text-base font-semibold leading-snug text-white sm:text-lg"
                >
                  ¿Esta historia resonó contigo?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/85">
                  Escribe una carta breve de afecto y respeto pensada para{' '}
                  <span className="font-medium text-white">{recipientName}</span>. AlmaMundi recibe tu carta, la
                  revisa con cuidado (incluye un filtro automático de tono) y, cuando corresponda, puede acercársela a
                  quien narró este relato. Es un camino con pausa y mirada humana: no hay envío directo sin este
                  resguardo, y no hay plazo fijo de respuesta.
                </p>
                <label htmlFor={`${dialogId}-msg`} className="sr-only">
                  Texto de tu carta de resonancia
                </label>
                <textarea
                  id={`${dialogId}-msg`}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 2000))}
                  rows={5}
                  placeholder="Escribe aquí con cariño…"
                  className="mt-4 box-border w-full min-h-[120px] resize-y rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/35 focus:outline-none focus:ring-2 focus:ring-white/15"
                />
                {reformulateHint ? (
                  <p className="mt-3 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/95">
                    {reformulateHint}
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-2 text-sm text-rose-300/95" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full rounded-full border border-white/20 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={sending || text.trim().length < 3}
                    onClick={() => void send()}
                    className="w-full rounded-full border border-white/35 bg-white/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {sending ? 'Enviando…' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
