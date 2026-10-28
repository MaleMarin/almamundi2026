'use client';

import styles from '@/components/subir/am-upload-modal.module.css';
import { UploadModalFotoGrid } from '@/components/subir/UploadModalFotoGrid';
import { SUBIR_PHOTO_MAX } from '@/lib/subir-limits';
import type { StoryPhotoItem } from '@/lib/story-photo-item';

type PhotoPatch = Partial<
  Pick<StoryPhotoItem, 'titulo' | 'anio' | 'anioDesconocido' | 'decada' | 'lugar' | 'alt'>
>;

type Props = {
  photos: StoryPhotoItem[];
  onAddFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  onRetry: (id: string) => void;
  onPatch: (id: string, patch: PhotoPatch) => void;
  convertingLabel: string;
  retryLabel: string;
  failedLabel: string;
  inlineError?: string;
  incompleteIds?: string[];
  fichaMessage?: string;
  maxPhotos?: number;
};

export function UploadModalFotoCapture({
  photos,
  onAddFiles,
  onRemove,
  onRetry,
  onPatch,
  convertingLabel,
  retryLabel,
  failedLabel,
  inlineError,
  incompleteIds,
  fichaMessage,
  maxPhotos = SUBIR_PHOTO_MAX,
}: Props) {
  const converting = photos.some((p) => p.converting);

  return (
    <div className={styles.amFotoUploader}>
      <UploadModalFotoGrid
        photos={photos}
        onAddFiles={onAddFiles}
        onRemove={onRemove}
        onRetry={onRetry}
        onPatch={onPatch}
        convertingLabel={convertingLabel}
        retryLabel={retryLabel}
        failedLabel={failedLabel}
        incompleteIds={incompleteIds}
        fichaMessage={fichaMessage}
        maxPhotos={maxPhotos}
        showCounter={false}
      />
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
