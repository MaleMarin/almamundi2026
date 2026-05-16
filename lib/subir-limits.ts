import { MAX_AUDIO_VIDEO_DURATION_SECONDS } from "@/lib/media-duration-rules";

/** Audio y video: máximo en minutos (regla de producto). */
export const SUBIR_AV_MAX_MINUTES = MAX_AUDIO_VIDEO_DURATION_SECONDS / 60;

/** Escrito: ~2 carillas (aprox. folio mecanografiado). */
export const SUBIR_TEXT_MAX_CHARS = 5000;

/** Video subido desde dispositivo (recomendado). */
export const SUBIR_VIDEO_UPLOAD_MAX_MB = 500;

/** Audio subido desde dispositivo. */
export const SUBIR_AUDIO_UPLOAD_MAX_MB = 50;

/** Por imagen en envío fotográfico. */
export const SUBIR_PHOTO_FILE_MAX_MB = 10;

/** Fotografía: entre 1 y 6 imágenes por envío. */
export const SUBIR_PHOTO_MIN = 1;
export const SUBIR_PHOTO_MAX = 6;
