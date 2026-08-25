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

export const SUBIR_VIDEO_FILE_ACCEPT =
  "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";
export const SUBIR_AUDIO_FILE_ACCEPT =
  "audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a,audio/webm,.mp3,.wav,.m4a";
export const SUBIR_EXTRA_FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

const VIDEO_UPLOAD_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const AUDIO_UPLOAD_MIMES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
]);
const EXTRA_UPLOAD_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function isAllowedVideoUploadFile(file: { type: string; name: string }): boolean {
  const t = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (VIDEO_UPLOAD_MIMES.has(t)) return true;
  const ext = fileExt(file.name);
  return ext === ".mp4" || ext === ".webm" || ext === ".mov";
}

export function isAllowedAudioUploadFile(file: { type: string; name: string }): boolean {
  const t = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (AUDIO_UPLOAD_MIMES.has(t)) return true;
  const ext = fileExt(file.name);
  return ext === ".mp3" || ext === ".wav" || ext === ".m4a" || ext === ".mp4" || ext === ".webm";
}

export function isAllowedExtraAttachmentFile(file: { type: string; name: string }): boolean {
  const t = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (EXTRA_UPLOAD_MIMES.has(t)) return true;
  const ext = fileExt(file.name);
  return (
    ext === ".jpg" ||
    ext === ".jpeg" ||
    ext === ".png" ||
    ext === ".webp" ||
    ext === ".gif" ||
    ext === ".heic" ||
    ext === ".heif"
  );
}
