'use client';

import { useId, useRef } from 'react';
import styles from '@/components/subir/am-upload-modal.module.css';
import { UploadModalFotoGrid } from '@/components/subir/UploadModalFotoGrid';
import { UPLOAD_MODAL_COPY } from '@/lib/subir-upload-modal-copy';
import { SUBIR_PHOTO_MAX } from '@/lib/subir-limits';
import type { StoryPhotoItem } from '@/lib/story-photo-item';

type Props = {
  photos: StoryPhotoItem[];
  onAddFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  onRetry: (id: string) => void;
  convertingLabel: string;
  retryLabel: string;
  failedLabel: string;
  inlineError?: string;
  maxPhotos?: number;
};

export function UploadModalFotoCapture({
  photos,
  onAddFiles,
  onRemove,
  onRetry,
  convertingLabel,
  retryLabel,
  failedLabel,
  inlineError,
  maxPhotos = SUBIR_PHOTO_MAX,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const primaryCta = UPLOAD_MODAL_COPY.foto.primaryCta;
  const converting = photos.some((p) => p.converting);

  return (
    <div className={styles.amFotoUploader}>
      <UploadModalFotoGrid
        photos={photos}
        onAddFiles={onAddFiles}
        onRemove={onRemove}
        onRetry={onRetry}
        convertingLabel={convertingLabel}
        retryLabel={retryLabel}
        failedLabel={failedLabel}
        maxPhotos={maxPhotos}
        showCounter={false}
      />
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onAddFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        className={styles.amModalBtnPrimary}
        disabled={photos.length >= maxPhotos}
        onClick={() => inputRef.current?.click()}
      >
        {primaryCta}
      </button>
      {converting ? (
        <p className={styles.amModalInlineError} role="status" aria-live="polite">
          {convertingLabel}
        </p>
      ) : null}
      {inlineError ? <p className={styles.amModalInlineError}>{inlineError}</p> : null}
      <p className={styles.amFotoCounter}>
        {photos.length} de {maxPhotos} fotos
      </p>
    </div>
  );
}
