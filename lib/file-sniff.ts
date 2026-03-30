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
    check: (b) => {
      if (b.length < 12) return false;
      for (let i = 0; i <= Math.min(b.length - 12, 32); i++) {
        if (b[i] === 0 && b[i + 1] === 0 && b[i + 2] === 0 && b[i + 3] === 0x18 && b[i + 4] === 0x66 && b[i + 5] === 0x74 && b[i + 6] === 0x79 && b[i + 7] === 0x70)
          return true;
        if (b[i] === 0 && b[i + 1] === 0 && b[i + 2] === 0 && b[i + 3] === 0x20 && b[i + 4] === 0x66 && b[i + 5] === 0x74 && b[i + 6] === 0x79 && b[i + 7] === 0x70)
          return true;
      }
      return false;
    },
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
    check: (b) => {
      if (b.length < 12) return false;
      for (let i = 0; i <= Math.min(b.length - 12, 24); i++) {
        if (b[i] === 0 && b[i + 1] === 0 && b[i + 2] === 0 && b[i + 3] === 0x18 && b[i + 4] === 0x66 && b[i + 5] === 0x74 && b[i + 6] === 0x79 && b[i + 7] === 0x70)
          return true;
      }
      return false;
    },
  },
];

export function bufferMatchesDeclaredMime(buffer: Buffer, declaredMime: string): boolean {
  const normalized = declaredMime.split(";")[0]?.trim().toLowerCase() ?? "";
  const entry = SIGS.find((s) => s.mime === normalized);
  if (!entry) return false;
  return entry.check(buffer);
}

export const ALLOWED_STORY_MEDIA_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/webm",
  "audio/mp4",
] as const;

export type AllowedStoryMediaMime = (typeof ALLOWED_STORY_MEDIA_MIMES)[number];

export function isAllowedStoryMediaMime(m: string): m is AllowedStoryMediaMime {
  return (ALLOWED_STORY_MEDIA_MIMES as readonly string[]).includes(m.split(";")[0]?.trim().toLowerCase() ?? "");
}
