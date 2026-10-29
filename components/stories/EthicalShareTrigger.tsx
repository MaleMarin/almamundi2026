'use client';

import {
  HISTORIAS_FILTER_ICON_IMG_CLASS,
  HISTORIAS_FILTER_ICON_WELL_CLASS,
  HISTORIAS_SHARE_ICON_SRC } from '@/lib/historias/historias-exhibition-icons';
import Image from 'next/image';
import type { ReactNode } from 'react';

export function EthicalShareTriggerButton({
  onClick,
  className = '',
  ariaLabel = 'Compartir esta historia',
  title: titleProp = 'Compartir esta historia' }: {
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
  shareButtonAriaLabel }: {
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
