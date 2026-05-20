'use client';

import { useId, useRef } from 'react';
import styles from '@/components/subir/am-upload-modal.module.css';
import { UploadModalFotoGrid } from '@/components/subir/UploadModalFotoGrid';
import { UPLOAD_MODAL_COPY } from '@/lib/subir-upload-modal-copy';
import { SUBIR_PHOTO_MAX } from '@/lib/subir-limits';

type Props = {
  photoFiles: File[];
  photoPreviews: string[];
  onAddFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  inlineError?: string;
  maxPhotos?: number;
};

export function UploadModalFotoCapture({
  photoFiles,
  photoPreviews,
  onAddFiles,
  onRemove,
  inlineError,
  maxPhotos = SUBIR_PHOTO_MAX,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const primaryCta = UPLOAD_MODAL_COPY.foto.primaryCta;

  return (
    <div className={styles.amFotoUploader}>
      <UploadModalFotoGrid
        photoFiles={photoFiles}
        photoPreviews={photoPreviews}
        onAddFiles={onAddFiles}
        onRemove={onRemove}
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
        disabled={photoPreviews.length >= maxPhotos}
        onClick={() => inputRef.current?.click()}
      >
        {primaryCta}
      </button>
      {inlineError ? <p className={styles.amModalInlineError}>{inlineError}</p> : null}
      <p className={styles.amFotoCounter}>
        {photoPreviews.length} de {maxPhotos} fotos
      </p>
    </div>
  );
}
