'use client';

import styles from '@/components/subir/am-upload-modal.module.css';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { interpolate } from '@/lib/i18n/locale';
import { PHOTO_DECADE_YEARS, PHOTO_NAME_MAX, PHOTO_PLACE_MAX } from '@/lib/story-photo-ficha';
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
  incompleteIds?: string[];
  fichaMessage?: string;
  maxPhotos?: number;
  showCounter?: boolean;
};

export function UploadModalFotoGrid({
  photos,
  onAddFiles,
  onRemove,
  onRetry,
  onPatch,
  convertingLabel,
  onUnreadable,
  retryLabel,
  failedLabel,
  incompleteIds = [],
  fichaMessage,
  maxPhotos = SUBIR_PHOTO_MAX,
  showCounter = true }: Props) {
  const { t } = useHomeLocale();
  const incomplete = new Set(incompleteIds);

  return (
    <div>
      <div className={styles.amFotoList} role="list" aria-label="Fotos seleccionadas">
        {photos.map((photo, index) => {
          const marked = incomplete.has(photo.id);
          return (
            <div
              key={photo.id}
              className={`${styles.amFotoCard} ${marked ? styles.amFotoCardIncomplete : ''}`}
              role="listitem"
            >
              <div className={styles.amFotoCardMedia}>
                {photo.previewUrl && !photo.converting ? (
                  <img
                    src={photo.previewUrl}
                    alt={photo.titulo.trim()}
                    onError={() => onUnreadable?.(photo.id)}
                  />
                ) : (
                  <div className={styles.amFotoSlotPlaceholder} aria-hidden />
                )}
                {photo.converting ? (
                  <p className={styles.amFotoSlotStatus} role="status">
                    <span className={styles.amFotoSpinner} aria-hidden />
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
                  onClick={() => onRemove(index)}
                  aria-label={t.modalPhotoRemove}
                >
                  ×
                </button>
              </div>

              <div className={styles.amFotoFields}>
                <div className={styles.amFotoField}>
                  <label htmlFor={`story-photo-name-${photo.id}`}>{t.modalPhotoName}</label>
                  <input
                    id={`story-photo-name-${photo.id}`}
                    value={photo.titulo}
                    maxLength={PHOTO_NAME_MAX}
                    aria-invalid={marked && !photo.titulo.trim()}
                    onChange={(e) => onPatch(photo.id, { titulo: e.target.value.slice(0, PHOTO_NAME_MAX) })}
                  />
                </div>

                <div className={styles.amFotoField}>
                  <label htmlFor={photo.anioDesconocido ? `story-photo-decade-${photo.id}` : `story-photo-year-${photo.id}`}>
                    {photo.anioDesconocido ? t.modalPhotoDecade : t.modalPhotoYear}
                  </label>
                  {photo.anioDesconocido ? (
                    <select
                      id={`story-photo-decade-${photo.id}`}
                      value={photo.decada}
                      aria-invalid={marked && !photo.decada}
                      onChange={(e) => onPatch(photo.id, { decada: e.target.value })}
                    >
                      <option value="">{t.modalPhotoDecadeChoose}</option>
                      {PHOTO_DECADE_YEARS.map((year) => (
                        <option key={year} value={String(year)}>
                          {interpolate(t.modalPhotoDecadeOption, { year })}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`story-photo-year-${photo.id}`}
                      inputMode="numeric"
                      value={photo.anio}
                      maxLength={4}
                      aria-invalid={marked && photo.anio.trim().length !== 4}
                      onChange={(e) =>
                        onPatch(photo.id, { anio: e.target.value.replace(/\D/g, '').slice(0, 4) })
                      }
                    />
                  )}
                  <label className={styles.amFotoCheck} htmlFor={`story-photo-year-unknown-${photo.id}`}>
                    <input
                      id={`story-photo-year-unknown-${photo.id}`}
                      type="checkbox"
                      checked={photo.anioDesconocido}
                      onChange={(e) => onPatch(photo.id, { anioDesconocido: e.target.checked })}
                    />
                    <span>{t.modalPhotoYearUnknown}</span>
                  </label>
                </div>

                <div className={styles.amFotoField}>
                  <label htmlFor={`story-photo-place-${photo.id}`}>{t.modalPhotoPlace}</label>
                  <input
                    id={`story-photo-place-${photo.id}`}
                    value={photo.lugar}
                    maxLength={PHOTO_PLACE_MAX}
                    aria-invalid={marked && !photo.lugar.trim()}
                    onChange={(e) => onPatch(photo.id, { lugar: e.target.value.slice(0, PHOTO_PLACE_MAX) })}
                  />
                </div>

                <div className={styles.amFotoField}>
                  <label htmlFor={`story-photo-alt-${photo.id}`}>{t.modalPhotoAltLabel}</label>
                  <input
                    id={`story-photo-alt-${photo.id}`}
                    value={photo.alt}
                    maxLength={300}
                    onChange={(e) => onPatch(photo.id, { alt: e.target.value.slice(0, 300) })}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {photos.length < maxPhotos ? (
          <label
            className={styles.amFotoAdd}
            role="listitem"
            aria-label={photos.length === 0 ? t.modalPhotoChoose : t.modalPhotoAddAnother}
          >
            <span aria-hidden>＋</span>
            <span className={styles.amFotoAddCaption}>
              {photos.length === 0 ? t.modalPhotoChoose : t.modalPhotoAddAnother}
            </span>
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
        ) : null}
      </div>
      {fichaMessage ? (
        <p className={styles.amModalInlineError} role="alert">
          {fichaMessage}
        </p>
      ) : null}
      {showCounter ? (
        <p className={styles.amFotoCounter}>
          {interpolate(t.modalPhotoCount, { n: photos.length, max: maxPhotos })}
        </p>
      ) : null}
    </div>
  );
}
