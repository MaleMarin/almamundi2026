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
  showContinue?: boolean;
  className?: string;
  /** Si true, solo renderiza la tarjeta (sin overlay). */
  cardOnly?: boolean;
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
  showContinue = true,
  className,
  cardOnly = false,
}: AmUploadModalShellProps) {
  const card = (
    <div className={`${styles.amModalCard} ${className ?? ''}`}>
      <header className={styles.amModalHeader}>
        <span className={styles.amModalBrand}>ALMAMUNDI</span>
        <button type="button" className={styles.amModalClose} onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </header>

      <div className={styles.amModalBody}>
        <h2 className={styles.amModalTitle}>{title}</h2>
        <p className={styles.amModalSubtitle}>{subtitle}</p>
        {limit ? <p className={styles.amModalLimit}>{limit}</p> : null}
        {children}
      </div>

      {showContinue ? (
        <footer className={styles.amModalFooter}>
          <button
            type="button"
            className={`${styles.amModalBtnContinue} ${continueEnabled ? styles.amModalBtnContinueActive : ''}`}
            disabled={!continueEnabled}
            onClick={continueEnabled ? onContinue : undefined}
          >
            {continueLabel}
          </button>
        </footer>
      ) : null}
    </div>
  );

  if (cardOnly) return card;

  return <div className={styles.amModalOverlay}>{card}</div>;
}