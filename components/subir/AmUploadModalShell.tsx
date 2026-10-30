'use client';

import type { ReactNode } from 'react';
import styles from '@/components/subir/am-upload-modal.module.css';

export type AmUploadModalShellProps = {
  title: string;
  subtitle: string;
  limit?: string;
  onClose: () => void;
  children: ReactNode;
  continueEnabled?: boolean;
  onContinue?: () => void;
  continueLabel?: string;
  continueHint?: string | null;
  closeAriaLabel?: string;
  kicker?: string;
  showContinue?: boolean;
  className?: string;
  /** Si true, solo renderiza la tarjeta (sin overlay). */
  cardOnly?: boolean;
  /** Línea al pie, solo en builds que no son production. */
  footnote?: string | null;
  /** Línea sobre el título, por ejemplo la pregunta que se está respondiendo. */
  lead?: ReactNode;
};

export function AmUploadModalShell({
  title,
  subtitle,
  limit,
  onClose,
  children,
  continueEnabled = false,
  onContinue,
  continueLabel = 'Continuar',
  continueHint = null,
  closeAriaLabel = 'Cerrar',
  kicker,
  showContinue = true,
  className,
  cardOnly = false,
  footnote,
  lead }: AmUploadModalShellProps) {
  const card = (
    <div className={`${styles.amModalCard} font-interna ${className ?? ''}`}>
      <header className={styles.amModalHeader}>
        <span className={styles.amModalBrand}>ALMAMUNDI</span>
        <button type="button" className={styles.amModalClose} onClick={onClose} aria-label={closeAriaLabel}>
          ×
        </button>
      </header>

      <div className={styles.amModalBody}>
        {lead}
        {kicker ? (
          <p className={styles.amModalKicker} aria-live="polite">
            {kicker}
          </p>
        ) : null}
        <h2 className={styles.amModalTitle}>{title}</h2>
        <p className={styles.amModalSubtitle}>{subtitle}</p>
        {limit ? <p className={styles.amModalLimit}>{limit}</p> : null}
        {children}
      </div>

      {showContinue || footnote ? (
        <footer className={styles.amModalFooter}>
          {continueHint ? (
            <p className={styles.amModalContinueHint} role="status">
              {continueHint}
            </p>
          ) : null}
          {showContinue ? (
            <button
              type="button"
              className={`${styles.amModalBtnContinue} ${continueEnabled ? styles.amModalBtnContinueActive : ''}`}
              disabled={!continueEnabled}
              onClick={continueEnabled ? onContinue : undefined}
            >
              {continueLabel}
            </button>
          ) : null}
          {footnote ? <p className={styles.amModalFootnote}>{footnote}</p> : null}
        </footer>
      ) : null}
    </div>
  );

  if (cardOnly) return card;

  return <div className={`${styles.amModalOverlay} font-interna story-submit-modal`} data-lenis-prevent="">{card}</div>;
}