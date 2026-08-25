/**
 * Comprobación mínima de tipo real (magic bytes) frente al Content-Type declarado.
 */

const SIGS: { mime: string; check: (b: Buffer) => boolean }[] = [
  {
    mime: "image/jpeg",
    check: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    check: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    mime: "image/gif",
    check: (b) =>
      b.length >= 6 &&
      b[0] === 0x47 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x38 &&
      (b[4] === 0x37 || b[4] === 0x39) &&
      b[5] === 0x61,
  },
  {
    mime: "image/webp",
    check: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
  {
    mime: "video/mp4",
    check: isIsoBmffNotHeic,
  },
  {
    mime: "video/quicktime",
    check: isIsoBmffNotHeic,
  },
  {
    mime: "video/webm",
    check: (b) =>
      b.length >= 4 &&
      b[0] === 0x1a &&
      b[1] === 0x45 &&
      b[2] === 0xdf &&
      b[3] === 0xa3,
  },
  {
    mime: "audio/mpeg",
    check: (b) =>
      b.length >= 3 &&
      ((b[0] === 0xff && (b[1] & 0xe0) === 0xe0) || (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33)),
  },
  {
    mime: "audio/webm",
    check: (b) =>
      b.length >= 4 &&
      b[0] === 0x1a &&
      b[1] === 0x45 &&
      b[2] === 0xdf &&
      b[3] === 0xa3,
  },
  {
    mime: "audio/mp4",
    check: isIsoBmffNotHeic,
  },
  {
    mime: "audio/wav",
    check: isRiffWave,
  },
  {
    mime: "image/heic",
    check: isHeicLike,
  },
  {
    mime: "image/heif",
    check: isHeicLike,
  },
];

function isHeicLike(b: Buffer): boolean {
  if (b.length < 12) return false;
  const ftypAt = b.indexOf("ftyp", 0, "ascii");
  if (ftypAt < 0 || ftypAt > 16) return false;
  const brand = b.subarray(ftypAt + 4, ftypAt + 8).toString("ascii").toLowerCase();
  return (
    brand.startsWith("hei") ||
    brand === "mif1" ||
    brand === "msf1" ||
    brand === "hevc"
  );
}

/** MP4 / MOV / M4A: caja `ftyp` (iPhone usa tamaño 0x14, no solo 0x18/0x20). */
function isIsoBmffNotHeic(b: Buffer): boolean {
  if (b.length < 12) return false;
  const ftypAt = b.indexOf("ftyp", 0, "ascii");
  if (ftypAt < 4 || ftypAt > 32) return false;
  return !isHeicLike(b);
}

function isRiffWave(b: Buffer): boolean {
  return (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x41 &&
    b[10] === 0x56 &&
    b[11] === 0x45
  );
}

/** Alias de navegador → MIME canónico de esta lista. */
export function canonicalizeStoryMediaMime(declaredMime: string): string {
  const m = declaredMime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (m === "audio/x-wav" || m === "audio/wave" || m === "audio/vnd.wave") return "audio/wav";
  if (m === "audio/x-m4a" || m === "audio/m4a") return "audio/mp4";
  if (m === "audio/mp3") return "audio/mpeg";
  if (m === "video/x-quicktime") return "video/quicktime";
  return m;
}

export function bufferMatchesDeclaredMime(buffer: Buffer, declaredMime: string): boolean {
  const normalized = canonicalizeStoryMediaMime(declaredMime);
  const entry = SIGS.find((s) => s.mime === normalized);
  if (!entry) return false;
  return entry.check(buffer);
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
