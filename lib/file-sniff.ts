/**
 * Tipo real del archivo (magic bytes) vs Content-Type declarado.
 * Usa `file-type`; no se confía en la extensión ni en el MIME del navegador.
 */

export const FILE_TYPE_PROBE_BYTES = 4100;

const ALLOWED_DETECTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/vnd.wave",
]);

/** Familias ISO-BMFF: MP4/MOV/M4A comparten caja `ftyp`. */
const DECLARED_TO_DETECTED: Record<string, readonly string[]> = {
  "image/jpeg": ["image/jpeg"],
  "image/png": ["image/png"],
  "image/webp": ["image/webp"],
  "image/gif": ["image/gif"],
  "image/heic": ["image/heic", "image/heif"],
  "image/heif": ["image/heic", "image/heif"],
  "video/mp4": ["video/mp4", "video/quicktime"],
  "video/quicktime": ["video/mp4", "video/quicktime"],
  "video/webm": ["video/webm"],
  "audio/mpeg": ["audio/mpeg"],
  "audio/webm": ["audio/webm", "video/webm"],
  "audio/mp4": ["audio/mp4", "audio/x-m4a", "video/mp4", "video/quicktime"],
  "audio/wav": ["audio/wav", "audio/vnd.wave", "audio/x-wav"],
};

/** Alias de navegador → MIME canónico de esta lista. */
export function canonicalizeStoryMediaMime(declaredMime: string): string {
  const m = declaredMime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (m === "audio/x-wav" || m === "audio/wave" || m === "audio/vnd.wave") return "audio/wav";
  if (m === "audio/x-m4a" || m === "audio/m4a") return "audio/mp4";
  if (m === "audio/mp3") return "audio/mpeg";
  if (m === "video/x-quicktime") return "video/quicktime";
  if (m === "image/jpg") return "image/jpeg";
  return m;
}

export function isImageStoryMime(m: string): boolean {
  const c = canonicalizeStoryMediaMime(m);
  return c.startsWith("image/");
}

export async function bufferMatchesDeclaredMime(
  buffer: Buffer,
  declaredMime: string
): Promise<boolean> {
  const normalized = canonicalizeStoryMediaMime(declaredMime);
  const allowed = DECLARED_TO_DETECTED[normalized];
  if (!allowed) return false;

  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(new Uint8Array(buffer));
  if (!detected?.mime) return false;
  const mime = detected.mime.toLowerCase();
  if (!ALLOWED_DETECTED.has(mime)) return false;
  return allowed.includes(mime);
}

export const ALLOWED_STORY_MEDIA_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/webm",
  "audio/mp4",
  "audio/wav",
] as const;

export type AllowedStoryMediaMime = (typeof ALLOWED_STORY_MEDIA_MIMES)[number];

export function isAllowedStoryMediaMime(m: string): m is AllowedStoryMediaMime {
  const canonical = canonicalizeStoryMediaMime(m);
  return (ALLOWED_STORY_MEDIA_MIMES as readonly string[]).includes(canonical);
}
