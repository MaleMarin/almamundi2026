import { MAX_AUDIO_VIDEO_DURATION_SECONDS } from "@/lib/media-duration-rules";

/** Audio y video: máximo en minutos (regla de producto). */
export const SUBIR_AV_MAX_MINUTES = MAX_AUDIO_VIDEO_DURATION_SECONDS / 60;

/** Escrito: tope único (validación, contador y textos). */
export const SUBIR_TEXT_MAX_CHARS = 5000;

/** Video subido desde dispositivo. */
export const SUBIR_VIDEO_UPLOAD_MAX_MB = 200;

/** Audio subido desde dispositivo. */
export const SUBIR_AUDIO_UPLOAD_MAX_MB = 50;

/** Por imagen en envío fotográfico. */
export const SUBIR_PHOTO_FILE_MAX_MB = 10;

/** Bytes máximos según MIME para subida directa a Storage. */
export function maxUploadBytesForMime(mime: string): number {
  const t = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (t.startsWith("image/")) return SUBIR_PHOTO_FILE_MAX_MB * 1024 * 1024;
  if (t.startsWith("audio/")) return SUBIR_AUDIO_UPLOAD_MAX_MB * 1024 * 1024;
  if (t.startsWith("video/")) return SUBIR_VIDEO_UPLOAD_MAX_MB * 1024 * 1024;
  return 0;
}

/** Fotografía: entre 1 y 8 imágenes por envío. */
export const SUBIR_PHOTO_MIN = 1;
export const SUBIR_PHOTO_MAX = 8;
