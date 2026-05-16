'use client';

import styles from '@/components/subir/am-upload-modal.module.css';
import { SUBIR_PHOTO_MAX } from '@/lib/subir-limits';

type Props = {
  photoPreviews: string[];
  photoFiles: File[];
  onAddFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  maxPhotos?: number;
  showCounter?: boolean;
};

export function UploadModalFotoGrid({
  photoPreviews,
  photoFiles,
  onAddFiles,
  onRemove,
  maxPhotos = SUBIR_PHOTO_MAX,
  showCounter = true,
}: Props) {
  const slots = Array.from({ length: maxPhotos }, (_, i) => i);

  return (
    <div>
      <div className={styles.amFotoGrid} role="list" aria-label="Fotos seleccionadas">
        {slots.map((i) => {
          const preview = photoPreviews[i];
          if (preview) {
            return (
              <div key={`filled-${i}`} className={`${styles.amFotoSlot} ${styles.amFotoSlotFilled}`} role="listitem">
                <img src={preview} alt={photoFiles[i]?.name ?? `Foto ${i + 1}`} />
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
          if (i === photoPreviews.length && photoPreviews.length < maxPhotos) {
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
          {photoPreviews.length} de {maxPhotos} fotos
        </p>
      ) : null}
    </div>
  );
}
