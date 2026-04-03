'use client';

/**
 * Compartido con intención: compromiso de resguardo, elección de resonancia,
 * crédito obligatorio, tarjeta descargable y copia de enlace con ritual de 2 s.
 */
import { HandHeart, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';

import { ExhibitionCompromisoStatement } from '@/components/stories/ExhibitionCompromisoStatement';
import { EXHIBITION_COMPROMISO_BODY } from '@/lib/historias/exhibition-compromiso';
import { renderExhibitionShareCardPng } from '@/lib/share/render-exhibition-share-card';

const STORAGE_KEY = 'almamundi-compromiso-resguardo-v1';

export type ResonanceIntent = 'conmovio' | 'perspectiva' | 'reflexion';

export type EthicalShareFlowProps = {
  open: boolean;
  onClose: () => void;
  authorName: string;
  storyTitle: string;
  quote: string;
  imageUrl: string;
  /** URL canónica de la historia (mismo origen). */
  shareUrl: string;
  exhibitionLabel: string;
  /** Tema para la plantilla “resiliencia / …” (p. ej. primer tag). */
  themeTag: string;
};

type Step = 'compromiso' | 'ethics' | 'ritual' | 'choose' | 'pledge' | 'result';

function buildCreditedMessage(
  intent: ResonanceIntent,
  authorName: string,
  storyTitle: string,
  exhibitionLabel: string,
  themeTag: string,
  reflectionExtra: string
): string {
  const credit = `Historia: «${storyTitle}»\nAutor/a: ${authorName}\n${exhibitionLabel} · AlmaMundi`;
  if (intent === 'conmovio') {
    return `Me conmovió esta historia de ${themeTag}…\n\n${credit}`;
  }
  if (intent === 'perspectiva') {
    return `Encontré una nueva perspectiva en las palabras de ${authorName}…\n\n${credit}`;
  }
  const extra = reflectionExtra.trim() || '…';
  return `Esta historia me recordó que ${extra}\n\n${credit}`;
}

function intentUrl(fullUrl: string, intent: ResonanceIntent): string {
  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(fullUrl, base);
    u.searchParams.set('intencion', intent);
    return u.toString();
  } catch {
    return fullUrl;
  }
}

export function EthicalShareFlow({
  open,
  onClose,
  authorName,
  storyTitle,
  quote,
  imageUrl,
  shareUrl,
  exhibitionLabel,
  themeTag,
}: EthicalShareFlowProps) {
  const dialogId = useId();
  const [step, setStep] = useState<Step>('ethics');
  const [intent, setIntent] = useState<ResonanceIntent>('conmovio');
  const [reflectionExtra, setReflectionExtra] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep('compromiso');
    setIntent('conmovio');
    setReflectionExtra('');
    setToast(null);
  }, [open]);

  const goAfterCompromiso = useCallback(() => {
    const hasAck =
      typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === '1';
    setStep(hasAck ? 'ritual' : 'ethics');
  }, []);

  const finalUrl = useMemo(
    () => intentUrl(shareUrl, intent),
    [shareUrl, intent]
  );

  const bodyText = useMemo(
    () =>
      buildCreditedMessage(
        intent,
        authorName,
        storyTitle,
        exhibitionLabel,
        themeTag,
        reflectionExtra
      ),
    [intent, authorName, storyTitle, exhibitionLabel, themeTag, reflectionExtra]
  );

  const fullSharePayload = useMemo(
    () => `${bodyText}\n\n${finalUrl}`,
    [bodyText, finalUrl]
  );

  const acceptEthics = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
    setStep('ritual');
  }, []);

  const goChoose = useCallback(() => {
    setStep('choose');
  }, []);

  const goPledge = useCallback(() => {
    if (intent === 'reflexion' && reflectionExtra.trim().length < 2) return;
    setStep('pledge');
  }, [intent, reflectionExtra]);

  const goResultFromPledge = useCallback(() => {
    setStep('result');
  }, []);

  const downloadCard = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const qrRes = await fetch(
        `/api/qr?url=${encodeURIComponent(finalUrl)}`
      );
      if (!qrRes.ok) throw new Error('qr');
      const qrBlob = await qrRes.blob();
      const qrDataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () =>
          typeof r.result === 'string' ? resolve(r.result) : reject();
        r.onerror = () => reject();
        r.readAsDataURL(qrBlob);
      });
      const blob = await renderExhibitionShareCardPng({
        imageUrl,
        quote,
        authorName,
        storyTitle,
        exhibitionLabel,
        qrDataUrl,
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `almamundi-${authorName.replace(/\s+/g, '-').slice(0, 32)}-historia.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setToast(
        'No se pudo generar la tarjeta (QR o imagen). Revisa la conexión o inténtalo más tarde.'
      );
    } finally {
      setDownloading(false);
    }
  }, [
    downloading,
    finalUrl,
    imageUrl,
    quote,
    authorName,
    storyTitle,
    exhibitionLabel,
    setToast,
  ]);

  const copyLink = useCallback(async () => {
    if (copying) return;
    setCopying(true);
    setToast('Gracias por difundir esta historia con afecto');
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await navigator.clipboard.writeText(`${fullSharePayload}`);
    } catch {
      try {
        await navigator.clipboard.writeText(finalUrl);
      } catch {
        /* noop */
      }
    }
    setToast(null);
    setCopying(false);
  }, [copying, fullSharePayload, finalUrl]);

  const nativeShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${storyTitle} · ${authorName}`,
          text: bodyText,
          url: finalUrl,
        });
      }
    } catch {
      /* cancelado */
    }
  }, [storyTitle, authorName, bodyText, finalUrl]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        role="presentation"
        onClick={onClose}
      >
        <div
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={
            step === 'compromiso' ? `${dialogId}-compromiso-heading` : `${dialogId}-h`
          }
          className="relative max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>

          {step === 'compromiso' ? (
            <div className="flex flex-col items-stretch gap-5">
              <ExhibitionCompromisoStatement
                variant="share-intro"
                id={`${dialogId}-compromiso`}
              />
              <p className="text-center text-xs leading-relaxed text-white/60">
                Cuando cierres este aviso, podrás seguir con la opción de compartir (enlace, tarjeta o
                apps del sistema).
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={goAfterCompromiso}
                  className="rounded-full border border-white/35 bg-white/15 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/25"
                >
                  Cerrar aviso y continuar
                </button>
              </div>
            </div>
          ) : null}

          {step === 'ethics' ? (
            <div className="pr-8">
              <h2 id={`${dialogId}-h`} className="text-lg font-semibold leading-snug">
                Compromiso de Resguardo
              </h2>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/50">
                Antes de compartir con intención
              </p>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
                <p className="font-serif text-sm font-light italic leading-relaxed text-white/88">
                  {EXHIBITION_COMPROMISO_BODY}
                </p>
                <p className="text-sm text-white/80">Al continuar, también aceptas que:</p>
                <ul className="list-disc space-y-2 pl-5 marker:text-white/50">
                  <li>
                    <strong className="font-medium text-white">Tu historia es tuya:</strong>{' '}
                    tú decides compartirla y puedes pedir retirarla cuando quieras.
                  </li>
                  <li>
                    <strong className="font-medium text-white">Compartir es un honor:</strong>{' '}
                    si compartes la historia de otro, lo haces para honrar su camino. Este sitio
                    genera automáticamente los créditos del autor o autora.
                  </li>
                  <li>
                    <strong className="font-medium text-white">Uso ético:</strong> está
                    estrictamente prohibido usar estas historias para burlas, desinformación o
                    fines comerciales no autorizados.
                  </li>
                  <li>
                    <strong className="font-medium text-white">Resonancia, no reacción:</strong>{' '}
                    no buscamos “likes”; buscamos que las historias viajen con respeto a quienes las
                    necesitan.
                  </li>
                </ul>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('compromiso')}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  Atrás al aviso
                </button>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                  >
                    Ahora no
                  </button>
                  <button
                    type="button"
                    onClick={acceptEthics}
                    className="rounded-full border border-white/35 bg-white/15 px-5 py-2 text-sm font-medium text-white hover:bg-white/25"
                  >
                    Entiendo y continúo
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {step === 'ritual' ? (
            <div className="pr-8">
              <h2 id={`${dialogId}-h`} className="text-lg font-semibold">
                Llevar esta historia conmigo
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/88">
                Estás a punto de llevar la historia de{' '}
                <span className="font-medium text-white">{authorName}</span> fuera de este
                espacio. El enlace y la tarjeta incluyen siempre el nombre de la persona y el
                contexto; no se puede separar la historia de quien la cuenta.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('compromiso')}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  Atrás al aviso
                </button>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={goChoose}
                    className="rounded-full border border-white/35 bg-white/15 px-5 py-2 text-sm font-medium text-white hover:bg-white/25"
                  >
                    Elegir cómo la presento
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {step === 'choose' ? (
            <div className="pr-8">
              <h2 id={`${dialogId}-h`} className="text-lg font-semibold">
                ¿Cómo te gustaría presentarla?
              </h2>
              <p className="mt-2 text-sm text-white/75">
                Elige una intención; condicionará el mensaje que llevas a redes u otras apps.
              </p>
              <fieldset className="mt-5 space-y-3">
                <legend className="sr-only">Intención de resonancia</legend>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-black/20 p-3 hover:border-white/25">
                  <input
                    type="radio"
                    name="intent"
                    checked={intent === 'conmovio'}
                    onChange={() => setIntent('conmovio')}
                    className="mt-1 accent-orange-400"
                  />
                  <span className="text-sm text-white/90">
                    Me conmovió esta historia de {themeTag}…
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-black/20 p-3 hover:border-white/25">
                  <input
                    type="radio"
                    name="intent"
                    checked={intent === 'perspectiva'}
                    onChange={() => setIntent('perspectiva')}
                    className="mt-1 accent-orange-400"
                  />
                  <span className="text-sm text-white/90">
                    Encontré una nueva perspectiva en las palabras de {authorName}…
                  </span>
                </label>
                <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-white/15 bg-black/20 p-3 hover:border-white/25">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="intent"
                      checked={intent === 'reflexion'}
                      onChange={() => setIntent('reflexion')}
                      className="mt-1 accent-orange-400"
                    />
                    <span className="text-sm text-white/90">
                      Esta historia me recordó que…
                    </span>
                  </div>
                  {intent === 'reflexion' ? (
                    <textarea
                      value={reflectionExtra}
                      onChange={(e) => setReflectionExtra(e.target.value.slice(0, 400))}
                      rows={3}
                      placeholder="Completa con una frase breve y respetuosa."
                      className="ml-7 w-[calc(100%-1.75rem)] resize-y rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                    />
                  ) : null}
                </label>
              </fieldset>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const hasAck =
                      typeof window !== 'undefined' &&
                      window.localStorage.getItem(STORAGE_KEY) === '1';
                    setStep(hasAck ? 'ritual' : 'ethics');
                  }}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={intent === 'reflexion' && reflectionExtra.trim().length < 2}
                  onClick={goPledge}
                  className="rounded-full border border-white/35 bg-white/15 px-5 py-2 text-sm font-medium text-white hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}

          {step === 'pledge' ? (
            <div className="pr-8">
              <h2 id={`${dialogId}-h`} className="text-lg font-semibold">
                Antes de generar el enlace
              </h2>
              <p className="mt-2 text-sm font-light text-white/75">
                Lee este recordatorio ético. Es lo último que verás antes de copiar, compartir o
                descargar la tarjeta.
              </p>
              <div className="mt-5">
                <ExhibitionCompromisoStatement variant="modal" id={`${dialogId}-pledge`} />
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={goResultFromPledge}
                  className="rounded-full border border-white/35 bg-white/15 px-5 py-2 text-sm font-medium text-white hover:bg-white/25"
                >
                  Confirmo y continúo
                </button>
              </div>
            </div>
          ) : null}

          {step === 'result' ? (
            <div className="pr-8">
              <h2 id={`${dialogId}-h`} className="text-lg font-semibold">
                Tu mensaje con crédito
              </h2>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-white/85">
                {fullSharePayload}
              </pre>
              <p className="mt-3 text-xs text-white/55">
                Tarjeta ~15×15 cm (exportada en alta resolución para redes o impresión). Incluye
                foto, cita, autoría y código QR hacia la historia en contexto.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => void downloadCard()}
                  className="rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25 disabled:opacity-50"
                >
                  {downloading ? 'Generando…' : 'Descargar tarjeta (PNG)'}
                </button>
                <button
                  type="button"
                  disabled={copying}
                  onClick={() => void copyLink()}
                  className="rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25 disabled:opacity-50"
                >
                  {copying ? 'Copiando…' : 'Copiar mensaje y enlace'}
                </button>
                <button
                  type="button"
                  onClick={() => void nativeShare()}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                >
                  Compartir con el sistema…
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {toast ? (
        <div
          className="pointer-events-none fixed bottom-8 left-1/2 z-[120] max-w-[min(92vw,360px)] -translate-x-1/2 rounded-full border border-white/25 bg-black/75 px-5 py-3 text-center text-sm text-white shadow-xl backdrop-blur-md"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}

export function EthicalShareTriggerButton({
  onClick,
  className = '',
  ariaLabel = 'Llevar esta historia conmigo: compartido ético con crédito al autor o autora',
  title: titleProp = 'Llevar esta historia conmigo',
}: {
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full p-2 transition ${className}`}
      aria-label={ariaLabel}
      title={titleProp}
    >
      <HandHeart className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );
}

/**
 * Franja visual (`/historias/companion-carta.png`) y botón HandHeart; `betweenCartaAndShare` inserta
 * controles (p. ej. buzón de resonancia) entre la carta y el icono de compartir.
 */
export function EthicalShareTriggerWithCartaCompanion({
  onClick,
  buttonClassName = '',
  betweenCartaAndShare,
  companionClassName = '',
  companionAlt = '',
  companionTitle,
  shareButtonTitle,
  shareButtonAriaLabel,
}: {
  onClick: () => void;
  buttonClassName?: string;
  /** Iconos neumórficos entre la carta y «llevar historia» (p. ej. ResonanceMailbox). */
  betweenCartaAndShare?: ReactNode;
  companionClassName?: string;
  /** Accesibilidad: qué es la ilustración de la carta (p. ej. en barra de filtros). */
  companionAlt?: string;
  /** Tooltip al pasar el cursor sobre la ilustración de la carta. */
  companionTitle?: string;
  shareButtonTitle?: string;
  shareButtonAriaLabel?: string;
}) {
  const carta = (
    <Image
      src="/historias/companion-carta.png"
      alt={companionAlt}
      width={172}
      height={342}
      className={`pointer-events-none h-[52px] w-auto max-h-14 shrink-0 select-none object-contain ${companionClassName}`}
      unoptimized
    />
  );

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
      {companionTitle ? (
        <span title={companionTitle} className="inline-flex shrink-0 cursor-help">
          {carta}
        </span>
      ) : (
        carta
      )}
      {betweenCartaAndShare}
      <EthicalShareTriggerButton
        onClick={onClick}
        className={buttonClassName}
        title={shareButtonTitle}
        ariaLabel={shareButtonAriaLabel}
      />
    </div>
  );
}
