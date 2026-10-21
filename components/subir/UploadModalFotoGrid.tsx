'use client';

import styles from '@/components/subir/am-upload-modal.module.css';
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
  maxPhotos?: number;
  showCounter?: boolean;
};

export function UploadModalFotoGrid({
  photos,
  onAddFiles,
  onRemove,
  onRetry,
  convertingLabel,
  retryLabel,
  failedLabel,
  maxPhotos = SUBIR_PHOTO_MAX,
  showCounter = true,
}: Props) {
  const slots = Array.from({ length: maxPhotos }, (_, i) => i);

  return (
    <div>
      <div className={styles.amFotoGrid} role="list" aria-label="Fotos seleccionadas">
        {slots.map((i) => {
          const photo = photos[i];
          if (photo) {
            return (
              <div
                key={photo.id}
                className={`${styles.amFotoSlot} ${styles.amFotoSlotFilled}`}
                role="listitem"
              >
                {photo.previewUrl ? (
                  <img src={photo.previewUrl} alt={photo.name} />
                ) : (
                  <div className={styles.amFotoSlotPlaceholder} aria-hidden />
                )}
                {photo.converting ? (
                  <p className={styles.amFotoSlotStatus} role="status">
                    {convertingLabel}
                  </p>
                ) : null}
                {photo.uploadStatus === 'uploading' ? (
                  <p className={styles.amFotoSlotStatus} role="status">
                    {Math.round(photo.progress * 100)}%
                  </p>
                ) : null}
                {photo.uploadStatus === 'error' ? (
                  <div className={styles.amFotoSlotError}>
                    <p>{photo.error || failedLabel}</p>
                    <button type="button" onClick={() => onRetry(photo.id)}>
                      {retryLabel}
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  className={styles.amFotoSlotRemove}
                  onClick={() => onRemove(i)}
                  aria-label="Eliminar foto"
                >
                  ×
                </button>
              </div>
            );
          }
          if (i === photos.length && photos.length < maxPhotos) {
            return (
              <label
                key={`empty-${i}`}
                className={`${styles.amFotoSlot} ${styles.amFotoSlotEmpty}`}
                role="listitem"
              >
                <span aria-hidden>＋</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    onAddFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            );
          }
          return (
            <div
              key={`placeholder-${i}`}
              className={`${styles.amFotoSlot} ${styles.amFotoSlotEmpty}`}
              style={{ opacity: 0.35, pointerEvents: 'none' }}
              aria-hidden
            >
              <span>＋</span>
            </div>
          );
        })}
      </div>
      {showCounter ? (
        <p className={styles.amFotoCounter}>
          {photos.length} de {maxPhotos} fotos
        </p>
      ) : null}
    </div>
  );
}
