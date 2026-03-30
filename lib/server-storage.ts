import "server-only";
import { getAdminBucket } from "@/lib/firebase/admin";

const PRIVATE_PREFIX = "submissions/private";
const SIGNED_URL_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 días (límite habitual GCS v4)

/** URL firmada devuelta al cliente tras subida: corta para limitar abuso si filtra. */
const DEFAULT_PRIVATE_READ_URL_MS = 30 * 60 * 1000;

/** Evita path traversal y rutas fuera de submissions/. */
export function assertSafeSubmissionsPath(storagePath: string): void {
  if (!storagePath || typeof storagePath !== "string") {
    throw new Error("invalid_storage_path");
  }
  if (storagePath.includes("..") || storagePath.includes("\0")) {
    throw new Error("invalid_storage_path");
  }
  if (!storagePath.startsWith("submissions/")) {
    throw new Error("invalid_storage_path");
  }
}

export function sanitizeUploadFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return base || "file";
}

/**
 * Guarda bytes en Storage sin hacer el objeto público.
 * Devuelve path interno y URL firmada temporal para previsualización / envío inmediato.
 */
export async function savePrivateSubmissionObject(opts: {
  buffer: Buffer;
  originalName: string;
  contentType: string;
  /** TTL lectura firmada (capado a SIGNED_URL_MAX_MS). Por defecto 30 min. */
  readUrlExpiresMs?: number;
}): Promise<{ storagePath: string; signedReadUrl: string }> {
  const id = crypto.randomUUID();
  const safe = sanitizeUploadFilename(opts.originalName);
  const ext = pickExtension(opts.contentType, safe);
  const storagePath = `${PRIVATE_PREFIX}/${id}/${safe}${ext}`;
  assertSafeSubmissionsPath(storagePath);

  const bucket = getAdminBucket();
  const file = bucket.file(storagePath);
  await file.save(opts.buffer, {
    contentType: opts.contentType,
    resumable: false,
    metadata: {
      cacheControl: "private, max-age=0, no-store",
    },
  });

  const readMs = Math.min(
    opts.readUrlExpiresMs ?? DEFAULT_PRIVATE_READ_URL_MS,
    SIGNED_URL_MAX_MS
  );
  const [signedReadUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + readMs,
  });

  return { storagePath, signedReadUrl };
}

function pickExtension(contentType: string, filename: string): string {
  const lower = filename.toLowerCase();
  const fromName = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm", ".mp3", ".m4a", ".wav", ".ogg"]
    .find((e) => lower.endsWith(e));
  if (fromName) return "";

  if (contentType === "image/png") return ".png";
  if (contentType === "image/jpeg" || contentType === "image/jpg") return ".jpg";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/gif") return ".gif";
  if (contentType === "video/mp4") return ".mp4";
  if (contentType === "video/webm") return ".webm";
  if (contentType === "audio/mpeg") return ".mp3";
  if (contentType === "audio/webm") return ".webm";
  if (contentType === "audio/mp4" || contentType === "audio/x-m4a") return ".m4a";
  return "";
}

/** URL firmada de lectura para curadores (vida corta). */
export async function signReadUrlForPath(
  storagePath: string,
  expiresMs: number = 15 * 60 * 1000
): Promise<string> {
  assertSafeSubmissionsPath(storagePath);
  const capped = Math.min(expiresMs, SIGNED_URL_MAX_MS);
  const bucket = getAdminBucket();
  const file = bucket.file(storagePath);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + capped,
  });
  return url;
}
