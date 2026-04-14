/**
 * Validación y saneamiento de entrada para APIs de envío de historias (/subir y afines).
 */

export const MAX_TITULO = 200;
export const MAX_DESCRIPCION = 500;
export const MAX_TEXTO = 50000;

export const ALLOWED_MEDIA_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "soundcloud.com",
  "storage.googleapis.com",
  "firebasestorage.googleapis.com",
] as const;

export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

export function isValidMediaUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      ALLOWED_MEDIA_DOMAINS.some(
        (d) => u.hostname === d || u.hostname.endsWith("." + d)
      )
    );
  } catch {
    return false;
  }
}
