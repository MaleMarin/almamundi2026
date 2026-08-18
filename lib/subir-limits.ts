import { MAX_AUDIO_VIDEO_DURATION_SECONDS } from "@/lib/media-duration-rules";

/** Audio y video: máximo en minutos (regla de producto). */
export const SUBIR_AV_MAX_MINUTES = MAX_AUDIO_VIDEO_DURATION_SECONDS / 60;

/** Escrito: ~1800 caracteres. */
export const SUBIR_TEXT_MAX_CHARS = 1800;

/** Tope único por archivo en todas las rutas de subida. */
export const SUBIR_FILE_MAX_MB = 15;
export const SUBIR_FILE_MAX_BYTES = SUBIR_FILE_MAX_MB * 1024 * 1024;

/** Video, audio o imagen: mismo tope de 15 MB. */
export const SUBIR_VIDEO_UPLOAD_MAX_MB = SUBIR_FILE_MAX_MB;
export const SUBIR_AUDIO_UPLOAD_MAX_MB = SUBIR_FILE_MAX_MB;
export const SUBIR_PHOTO_FILE_MAX_MB = SUBIR_FILE_MAX_MB;

/** Fotografía: entre 1 y 6 imágenes por envío. */
export const SUBIR_PHOTO_MIN = 1;
export const SUBIR_PHOTO_MAX = 6;
