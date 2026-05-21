'use client';

/**
 * Compartir con cuidado: un único aviso ético breve + panel de opciones.
 * Mismo flujo para video, audio, escrito, fotografía y mapa.
 *
 * El aviso aparece SIEMPRE al iniciar el flujo (no se guarda aceptación previa).
 */
import { X } from 'lucide-react';
import {
  HISTORIAS_FILTER_ICON_IMG_CLASS,
  HISTORIAS_FILTER_ICON_WELL_CLASS,
  HISTORIAS_SHARE_ICON_SRC,
} from '@/lib/historias/historias-exhibition-icons';
import Image from 'next/image';
import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';

import { renderExhibitionShareCardPng } from '@/lib/share/render-exhibition-share-card';

export type EthicalShareFlowProps = {
  open: boolean;
  onClose: () => void;
  authorName: string;
  storyTitle: string;
  quote: string;
  imageUrl: string;
  /** URL canónica de la historia (mismo origen). */
  shareUrl: string;
  /** Texto de formato para la tarjeta y cuerpo del share. Default: "AlmaMundi". */
  exhibitionLabel?: string;
  /** Compatibilidad con call sites antiguos: ya no se usa en el flujo nuevo. */
  themeTag?: string;
};

type Step = 'notice' | 'panel';

const NOTICE_TITLE = 'Antes de compartir';
const NOTICE_BODY_1 =
  'Esta historia fue confiada a AlmaMundi por alguien que decidió contarla.';
const NOTICE_BODY_2 =
  'Al compartirla, cuida su nombre, su voz y su dignidad. Este es un espacio de encuentro, no de viralización.';

function buildShareText(authorName: string, storyTitle: string, label: string): string {
  return `«${storyTitle}» — ${authorName}\n${label} · AlmaMundi`;
}

export function EthicalShareFlow({
  open,
  onClose,
  authorName,
  storyTitle,
  quote,
  imageUrl,
  shareUrl,
  exhibitionLabel = 'AlmaMundi',
}: EthicalShareFlowProps) {
  const dialogId = useId();
  const [step, setStep] = useState<Step>('notice');
  const [toast, setToast] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Reinicia el flujo a 'notice' cada vez que se abre: el aviso aparece SIEMPRE.
  useEffect(() => {
    if (!open) return;
    setStep('notice');
    setToast(null);
  }, [open]);

  const acceptNotice = useCallback(() => {
    setStep('panel');
  }, []);

  const shareText = useMemo(
    () => buildShareText(authorName, storyTitle, exhibitionLabel),
    [authorName, storyTitle, exhibitionLabel]
  );

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flashToast('Enlace copiado');
    } catch {
      flashToast('No se pudo copiar el enlace');
    }
  }, [shareUrl, flashToast]);

  const openWhatsApp = useCallback(() => {
    const msg = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
  }, [shareText, shareUrl]);

  const openEmail = useCallback(() => {
    const subject = encodeURIComponent(`«${storyTitle}» — AlmaMundi`);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [shareText, shareUrl, storyTitle]);

  const nativeShare = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${storyTitle} · ${authorName}`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await copyLink();
      }
    } catch {
      /* cancelado por el usuario */
    }
  }, [storyTitle, authorName, shareText, shareUrl, copyLink]);

  const downloadCard = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const qrRes = await fetch(`/api/qr?url=${encodeURIComponent(shareUrl)}`);
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
        quote: quote || storyTitle,
        authorName,
        storyTitle,
        exhibitionLabel,
        qrDataUrl,
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `almamundi-${authorName.replace(/\s+/g, '-').slice(0, 32) || 'historia'}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      flashToast('No se pudo generar la tarjeta');
    } finally {
      setDownloading(false);
    }
  }, [
    downloading,
    shareUrl,
    imageUrl,
    quote,
    authorName,
    storyTitle,
    exhibitionLabel,
    flashToast,
  ]);

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
          aria-labelledby={`${dialogId}-h`}
          className="relative max-h-[min(92vh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-md"
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

          {step === 'notice' ? (
            <div className="pr-8">
              <h2 id={`${dialogId}-h`} className="text-lg font-semibold leading-snug">
                {NOTICE_TITLE}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/90">
                {NOTICE_BODY_1}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/90">
                {NOTICE_BODY_2}
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={acceptNotice}
                  className="rounded-full border border-white/35 bg-white/15 px-5 py-2 text-sm font-medium text-white hover:bg-white/25"
                >
                  Entiendo y quiero compartir
                </button>
              </div>
            </div>
          ) : (
            <div className="pr-8">
              <h2 id={`${dialogId}-h`} className="text-lg font-semibold">
                Compartir historia
              </h2>
              <p className="mt-2 text-sm font-light text-white/70">
                «{storyTitle}» — {authorName}
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-left text-sm font-medium text-white hover:bg-white/20"
                >
                  Copiar enlace
                </button>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-left text-sm font-medium text-white hover:bg-white/20"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={openEmail}
                  className="rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-left text-sm font-medium text-white hover:bg-white/20"
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => void nativeShare()}
                  className="rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-left text-sm font-medium text-white hover:bg-white/20"
                >
                  Compartir con el sistema
                </button>
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => void downloadCard()}
                  className="rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-left text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
                >
                  {downloading ? 'Generando tarjeta…' : 'Descargar tarjeta'}
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
          )}
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
  ariaLabel = 'Compartir esta historia',
  title: titleProp = 'Compartir esta historia',
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
      <span className={HISTORIAS_FILTER_ICON_WELL_CLASS} aria-hidden>
        <img
          src={HISTORIAS_SHARE_ICON_SRC}
          alt=""
          width={18}
          height={18}
          className={HISTORIAS_FILTER_ICON_IMG_CLASS}
          draggable={false}
        />
      </span>
    </button>
  );
}

/**
 * Franja visual (`/historias/companion-carta.png`) y botón con icono `/icons/compartir.svg`; `betweenCartaAndShare` inserta
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
