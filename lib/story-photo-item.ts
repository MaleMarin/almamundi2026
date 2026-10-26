export type StoryPhotoUploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export type StoryPhotoItem = {
  id: string;
  name: string;
  readyFile: File | null;
  previewUrl: string;
  converting: boolean;
  uploadStatus: StoryPhotoUploadStatus;
  progress: number;
  error: string | null;
  readUrl?: string;
  storagePath?: string;
  /** Nombre de la foto (ficha). */
  titulo: string;
  /** Año exacto, 4 dígitos. */
  anio: string;
  anioDesconocido: boolean;
  /** Inicio de década: 1900…2020. */
  decada: string;
  lugar: string;
  /** Descripción para personas con discapacidad visual. Opcional. */
  alt: string;
};

export function createStoryPhotoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isDisplayableStoryPhoto(file: File): boolean {
  return /^image\/(jpeg|png|webp|jpg)$/i.test(file.type);
}
