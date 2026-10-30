'use client';

import type { ReactNode } from 'react';
import { AmUploadModalShell } from '@/components/subir/AmUploadModalShell';
import type { UploadModalCopy } from '@/lib/subir-upload-modal-copy';

type Props = {
  copy: UploadModalCopy;
  onClose: () => void;
  continueEnabled: boolean;
  onContinue: () => void;
  continueLabel?: string;
  continueHint?: string | null;
  closeAriaLabel?: string;
  kicker?: string;
  children: ReactNode;
  /** Título con saltos de línea (texto, foto). */
  titlePreLine?: boolean;
  footnote?: string | null;
  className?: string;
  lead?: ReactNode;
};

export function FormatCaptureEditorialShell({
  copy,
  onClose,
  continueEnabled,
  onContinue,
  continueLabel = 'Continuar',
  continueHint = null,
  closeAriaLabel = 'Cerrar',
  kicker,
  children,
  titlePreLine = false,
  footnote,
  className,
  lead }: Props) {
  const title = titlePreLine ? copy.title : copy.title.replace(/\n/g, ' ');

  return (
    <AmUploadModalShell
      title={title}
      subtitle={copy.subtitle}
      limit={copy.limit}
      onClose={onClose}
      continueEnabled={continueEnabled}
      onContinue={onContinue}
      continueLabel={continueLabel}
      continueHint={continueHint}
      closeAriaLabel={closeAriaLabel}
      kicker={kicker}
      footnote={footnote}
      className={className}
      lead={lead}
    >
      {children}
    </AmUploadModalShell>
  );
}
