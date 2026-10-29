'use client';

import styles from '@/components/subir/am-upload-modal.module.css';
import { UploadModalFotoGrid } from '@/components/subir/UploadModalFotoGrid';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { interpolate } from '@/lib/i18n/locale';
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
  onUnreadable?: (id: string) => void;
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
  onUnreadable,
  retryLabel,
  failedLabel,
  inlineError,
  incompleteIds,
  fichaMessage,
  maxPhotos = SUBIR_PHOTO_MAX }: Props) {
  const { t } = useHomeLocale();

  return (
    <div className={styles.amFotoUploader}>
      <UploadModalFotoGrid
        photos={photos}
        onAddFiles={onAddFiles}
        onRemove={onRemove}
        onRetry={onRetry}
        onPatch={onPatch}
        convertingLabel={convertingLabel}
        onUnreadable={onUnreadable}
        retryLabel={retryLabel}
        failedLabel={failedLabel}
        incompleteIds={incompleteIds}
        fichaMessage={fichaMessage}
        maxPhotos={maxPhotos}
        showCounter={false}
      />
      {inlineError ? <p className={styles.amModalInlineError}>{inlineError}</p> : null}
      {photos.length > 0 ? (
        <p className={styles.amFotoCounter}>
          {interpolate(t.modalPhotoCount, { n: photos.length, max: maxPhotos })}
        </p>
      ) : null}
    </div>
  );
}
