import "server-only";
import {
  bufferMatchesDeclaredMime,
  FILE_TYPE_PROBE_BYTES,
  isImageStoryMime,
} from "@/lib/file-sniff";
import { heicBufferToJpeg, bufferLooksLikeHeic, isDeclaredHeic, isRasterImageCandidate } from "@/lib/heic-jpeg";
import { stripImageExif } from "@/lib/strip-image-exif";
import { MAX_AUDIO_VIDEO_DURATION_SECONDS } from "@/lib/media-duration-rules";
import {
  durationSecondsFromMediaBytes,
  isAudioOrVideoMime,
} from "@/lib/media-duration-probe";
import { getAdminBucket } from "@/lib/firebase/admin";
import { areUploadsPaused } from "@/lib/ops/usage-state";
import { resolveResumableUploadOrigin } from "@/lib/resumable-upload-origin";

const PRIVATE_PREFIX = "submissions/private";
const SIGNED_URL_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 días (límite habitual GCS v4)

/** URL firmada devuelta al cliente tras subida: corta para limitar abuso si filtra. */
const DEFAULT_PRIVATE_READ_URL_MS = 30 * 60 * 1000;

/** Evita path traversal y rutas fuera de submissions/. */
export function assertSafeSubmissionsPath(storagePath: string): void {
  if (!storagePath || typeof storagePath !== "string") {
    throw new Error("invalid_storage_path");
  }
  if (storagePath.includes("\0") || storagePath.startsWith("/")) {
    throw new Error("invalid_storage_path");
  }
  const parts = storagePath.split("/");
  if (parts.some((p) => p === ".." || p === "." || p === "")) {
    throw new Error("invalid_storage_path");
  }
  if (!storagePath.startsWith("submissions/")) {
    throw new Error("invalid_storage_path");
  }
}

export function sanitizeUploadFilename(name: string): string {
  const base = name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 120);
  return base || "file";
}

export function resumableOriginFromRequest(req: Request): string {
  return resolveResumableUploadOrigin({
    requestOrigin: req.headers.get("origin") || "",
    vercelEnv: process.env.VERCEL_ENV,
  });
}

export async function assertUploadsAllowed(): Promise<void> {
  if (await areUploadsPaused()) {
    throw new Error("uploads_paused");
  }
}

/**
 * Sesión resumable en GCS. El cliente sube directo al bucket (las reglas siguen en deny).
 */
export async function createPrivateResumableUpload(opts: {
  originalName: string;
  contentType: string;
  origin: string;
}): Promise<{ storagePath: string; uploadUrl: string }> {
  await assertUploadsAllowed();
  const id = crypto.randomUUID();
  const safe = sanitizeUploadFilename(opts.originalName);
  const ext = pickExtension(opts.contentType, safe);
  const storagePath = `${PRIVATE_PREFIX}/${id}/${safe}${ext}`;
  assertSafeSubmissionsPath(storagePath);

  const bucket = getAdminBucket();
  const file = bucket.file(storagePath);
  const [uploadUrl] = await file.createResumableUpload({
    origin: opts.origin,
    metadata: {
      contentType: opts.contentType,
      cacheControl: "private, max-age=0, no-store",
    },
  });
  return { storagePath, uploadUrl };
}

export async function finalizePrivateSubmissionObject(opts: {
  storagePath: string;
  declaredMime: string;
  maxBytes: number;
  readUrlExpiresMs?: number;
}): Promise<{ storagePath: string; signedReadUrl: string; size: number }> {
  assertSafeSubmissionsPath(opts.storagePath);
  if (!opts.storagePath.startsWith(`${PRIVATE_PREFIX}/`)) {
    throw new Error("invalid_storage_path");
  }

  const bucket = getAdminBucket();
  const file = bucket.file(opts.storagePath);
  const [exists] = await file.exists();
  if (!exists) throw new Error("not_found");

  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size || 0);
  const created = metadata.timeCreated
    ? Date.parse(String(metadata.timeCreated))
    : 0;
  if (created && Date.now() - created > 2 * 60 * 60 * 1000) {
    throw new Error("upload_expired");
  }
  if (!Number.isFinite(size) || size <= 0) {
    await file.delete({ ignoreNotFound: true }).catch(() => undefined);
    throw new Error("empty_object");
  }
  if (size > opts.maxBytes) {
    await file.delete({ ignoreNotFound: true }).catch(() => undefined);
    throw new Error("file_too_large");
  }

  const av = isAudioOrVideoMime(opts.declaredMime);
  const headLen = Math.min(size, av ? 1024 * 1024 : FILE_TYPE_PROBE_BYTES);
  const [head] = await file.download({
    start: 0,
    end: Math.max(0, headLen - 1),
  });
  const headBuf = Buffer.from(head);
  if (!(await bufferMatchesDeclaredMime(headBuf, opts.declaredMime))) {
    await file.delete({ ignoreNotFound: true }).catch(() => undefined);
    throw new Error("content_type_mismatch");
  }

  if (av) {
    let tail: Buffer | undefined;
    if (size > headLen) {
      const tailLen = Math.min(size - headLen, 1024 * 1024);
      const [t] = await file.download({
        start: size - tailLen,
        end: size - 1,
      });
      tail = Buffer.from(t);
    }
    const sec = durationSecondsFromMediaBytes({
      mime: opts.declaredMime,
      head: headBuf,
      tail,
      totalSize: size,
    });
    if (sec != null && sec > MAX_AUDIO_VIDEO_DURATION_SECONDS) {
      await file.delete({ ignoreNotFound: true }).catch(() => undefined);
      throw new Error("duration_too_long");
    }
  }

  let outSize = size;
  if (isImageStoryMime(opts.declaredMime)) {
    const [full] = await file.download();
    const stripped = await stripImageExif(Buffer.from(full), opts.declaredMime);
    await file.save(stripped.buffer, {
      contentType: stripped.contentType,
      resumable: false,
      metadata: {
        cacheControl: "private, max-age=0, no-store",
      },
    });
    outSize = stripped.buffer.length;
  }

  const readMs = Math.min(
    opts.readUrlExpiresMs ?? DEFAULT_PRIVATE_READ_URL_MS,
    SIGNED_URL_MAX_MS
  );
  const [signedReadUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + readMs,
  });
  return { storagePath: opts.storagePath, signedReadUrl, size: outSize };
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
  await assertUploadsAllowed();
  let buffer = opts.buffer;
  let contentType = opts.contentType;
  if (isImageStoryMime(contentType)) {
    const stripped = await stripImageExif(buffer, contentType);
    buffer = stripped.buffer;
    contentType = stripped.contentType;
  }
  const id = crypto.randomUUID();
  const safe = sanitizeUploadFilename(opts.originalName);
  const ext = pickExtension(contentType, safe);
  const storagePath = `${PRIVATE_PREFIX}/${id}/${safe}${ext}`;
  assertSafeSubmissionsPath(storagePath);

  const bucket = getAdminBucket();
  const file = bucket.file(storagePath);
  await file.save(buffer, {
    contentType,
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
  const fromName = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic", ".heif", ".mp4", ".mov", ".webm", ".mp3", ".m4a", ".wav", ".ogg"]
    .find((e) => lower.endsWith(e));
  if (fromName) return "";

  if (contentType === "image/png") return ".png";
  if (contentType === "image/jpeg" || contentType === "image/jpg") return ".jpg";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/gif") return ".gif";
  if (contentType === "image/heic") return ".heic";
  if (contentType === "image/heif") return ".heif";
  if (contentType === "video/mp4") return ".mp4";
  if (contentType === "video/quicktime") return ".mov";
  if (contentType === "video/webm") return ".webm";
  if (contentType === "audio/mpeg") return ".mp3";
  if (contentType === "audio/webm") return ".webm";
  if (contentType === "audio/mp4" || contentType === "audio/x-m4a") return ".m4a";
  if (contentType === "audio/wav" || contentType === "audio/x-wav" || contentType === "audio/wave") {
    return ".wav";
  }
  return "";
}

/** Bytes privados de un envío. Solo rutas submissions/private/. */
export async function readPrivateSubmissionObject(
  storagePath: string
): Promise<{ buffer: Buffer; contentType: string }> {
  assertSafeSubmissionsPath(storagePath);
  if (!storagePath.startsWith(`${PRIVATE_PREFIX}/`)) {
    throw new Error("invalid_storage_path");
  }
  const file = getAdminBucket().file(storagePath);
  const [exists] = await file.exists();
  if (!exists) throw new Error("not_found");
  const [meta] = await file.getMetadata();
  const [buffer] = await file.download();
  return { buffer, contentType: String(meta.contentType || "") };
}

export async function privateObjectContentType(storagePath: string): Promise<string> {
  assertSafeSubmissionsPath(storagePath);
  const [meta] = await getAdminBucket().file(storagePath).getMetadata();
  return String(meta.contentType || "");
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

const PUBLISHED_PREFIX = "published";

export function assertSafePublishedPath(storagePath: string): void {
  if (!storagePath || typeof storagePath !== "string") {
    throw new Error("invalid_storage_path");
  }
  if (storagePath.includes("\0") || storagePath.startsWith("/")) {
    throw new Error("invalid_storage_path");
  }
  const parts = storagePath.split("/");
  if (parts.some((p) => p === ".." || p === "." || p === "")) {
    throw new Error("invalid_storage_path");
  }
  if (!storagePath.startsWith(`${PUBLISHED_PREFIX}/`)) {
    throw new Error("invalid_storage_path");
  }
}

export function assertSafeStoryId(storyId: string): string {
  const id = storyId.trim();
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(id)) {
    throw new Error("invalid_story_id");
  }
  return id;
}

function firebaseDownloadUrl(bucketName: string, storagePath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

async function finalizePublishedObject(storagePath: string): Promise<{
  storagePath: string;
  publicUrl: string;
}> {
  assertSafePublishedPath(storagePath);
  const bucket = getAdminBucket();
  const file = bucket.file(storagePath);
  const token = crypto.randomUUID();
  await file.setMetadata({
    cacheControl: "public, max-age=31536000, immutable",
    metadata: { firebaseStorageDownloadTokens: token },
  });
  try {
    await file.makePublic();
  } catch {
    // Uniform bucket-level access: las reglas de /published/** cubren la lectura.
  }
  return {
    storagePath,
    publicUrl: firebaseDownloadUrl(bucket.name, storagePath, token),
  };
}

/**
 * Copia un objeto privado de envío a /published/{storyId}/… y devuelve
 * una URL pública estable (sin expiración).
 */
export async function copyPrivateSubmissionToPublished(opts: {
  sourcePath: string;
  storyId: string;
}): Promise<{ storagePath: string; publicUrl: string }> {
  assertSafeSubmissionsPath(opts.sourcePath);
  if (!opts.sourcePath.startsWith(`${PRIVATE_PREFIX}/`)) {
    throw new Error("invalid_storage_path");
  }
  const storyId = assertSafeStoryId(opts.storyId);
  const bucket = getAdminBucket();
  const src = bucket.file(opts.sourcePath);
  const [exists] = await src.exists();
  if (!exists) throw new Error("not_found");

  const base = sanitizeUploadFilename(opts.sourcePath.split("/").pop() || "file");
  const [meta] = await src.getMetadata();
  const contentType = String(meta.contentType || "");
  if (isRasterImageCandidate(opts.sourcePath, contentType)) {
    const [buffer] = await src.download();
    let bytes = buffer;
    let mime = contentType || "image/jpeg";
    if (bufferLooksLikeHeic(buffer) || isDeclaredHeic(opts.sourcePath, contentType)) {
      bytes = await heicBufferToJpeg(buffer);
      mime = "image/jpeg";
    }
    const stripped = await stripImageExif(bytes, mime);
    const stem = base.replace(/\.(heic|heif|png|jpe?g|webp|gif)$/i, "") || "foto";
    const ext =
      stripped.contentType === "image/png"
        ? "png"
        : stripped.contentType === "image/webp"
          ? "webp"
          : stripped.contentType === "image/gif"
            ? "gif"
            : "jpg";
    const destPath = `${PUBLISHED_PREFIX}/${storyId}/${crypto.randomUUID()}/${stem}.${ext}`;
    assertSafePublishedPath(destPath);
    return savePublishedMediaObject({
      destPath,
      buffer: stripped.buffer,
      contentType: stripped.contentType,
    });
  }
  const destPath = `${PUBLISHED_PREFIX}/${storyId}/${crypto.randomUUID()}/${base}`;
  assertSafePublishedPath(destPath);
  await src.copy(bucket.file(destPath));
  return finalizePublishedObject(destPath);
}

/** Escribe bytes nuevos en /published/** (p. ej. ecos de audio). */
export async function savePublishedMediaObject(opts: {
  destPath: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ storagePath: string; publicUrl: string }> {
  assertSafePublishedPath(opts.destPath);
  const bucket = getAdminBucket();
  const file = bucket.file(opts.destPath);
  await file.save(opts.buffer, {
    contentType: opts.contentType,
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  return finalizePublishedObject(opts.destPath);
}

/** Path de objeto en este bucket, si la URL es de Firebase o GCS. */
export function storageObjectPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let objectPath = "";
    if (u.hostname === "firebasestorage.googleapis.com") {
      const m = u.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/);
      if (!m?.[1]) return null;
      objectPath = decodeURIComponent(m[1]);
    } else if (u.hostname === "storage.googleapis.com") {
      const parts = u.pathname.replace(/^\//, "").split("/");
      if (parts.length < 2) return null;
      objectPath = decodeURIComponent(parts.slice(1).join("/"));
    } else if (u.hostname.endsWith(".storage.googleapis.com")) {
      objectPath = decodeURIComponent(u.pathname.replace(/^\//, ""));
    } else {
      return null;
    }
    objectPath = objectPath.replace(/^\/+/, "");
    if (!objectPath || objectPath.includes("\0") || objectPath.includes("..")) return null;
    return objectPath;
  } catch {
    return null;
  }
}

/** Solo copias de esta historia, sus ecos, u originales privados citados por ella. */
export function isStoryOwnedStoragePath(storyId: string, storagePath: string): boolean {
  let id = "";
  try {
    id = assertSafeStoryId(storyId);
  } catch {
    return false;
  }
  if (!storagePath || storagePath.includes("\0") || storagePath.includes("..")) return false;
  if (
    storagePath.startsWith(`published/${id}/`) ||
    storagePath.startsWith(`published/ecos/${id}/`)
  ) {
    try {
      assertSafePublishedPath(storagePath);
      return true;
    } catch {
      return false;
    }
  }
  if (storagePath.startsWith(`${PRIVATE_PREFIX}/`)) {
    try {
      assertSafeSubmissionsPath(storagePath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Borra archivos de una historia: `published/{id}/**`, `published/ecos/{id}/**`
 * y paths citados que pasen `isStoryOwnedStoragePath`.
 */
export async function deleteStoryStorageFiles(
  storyId: string,
  referencedPaths: string[]
): Promise<void> {
  const id = assertSafeStoryId(storyId);
  const bucket = getAdminBucket();
  const prefixes = [`published/${id}/`, `published/ecos/${id}/`];
  for (const prefix of prefixes) {
    const [files] = await bucket.getFiles({ prefix });
    for (const file of files) {
      if (!file.name.startsWith(prefix)) continue;
      await file.delete({ ignoreNotFound: true });
    }
  }
  const seen = new Set<string>();
  for (const raw of referencedPaths) {
    const path = raw.trim();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    if (path.startsWith(`published/${id}/`) || path.startsWith(`published/ecos/${id}/`)) continue;
    if (!isStoryOwnedStoragePath(id, path)) continue;
    await bucket.file(path).delete({ ignoreNotFound: true });
  }
}

const RESPUESTA_PUBLISHED_PREFIX = "published/respuestas";

/**
 * Copia la voz o la foto de una respuesta a /published/respuestas/{id}/…
 * El globo y las páginas públicas leen esa copia, no el archivo privado.
 */
export async function copyPrivateSubmissionToPublishedRespuesta(opts: {
  sourcePath: string;
  respuestaId: string;
}): Promise<{ storagePath: string; publicUrl: string }> {
  assertSafeSubmissionsPath(opts.sourcePath);
  if (!opts.sourcePath.startsWith(`${PRIVATE_PREFIX}/`)) {
    throw new Error("invalid_storage_path");
  }
  const respuestaId = assertSafeStoryId(opts.respuestaId);
  const bucket = getAdminBucket();
  const src = bucket.file(opts.sourcePath);
  const [exists] = await src.exists();
  if (!exists) throw new Error("not_found");

  const base = sanitizeUploadFilename(opts.sourcePath.split("/").pop() || "file");
  const [meta] = await src.getMetadata();
  const contentType = String(meta.contentType || "");
  if (isRasterImageCandidate(opts.sourcePath, contentType) || isImageStoryMime(contentType)) {
    const [buffer] = await src.download();
    let bytes = buffer;
    let mime = contentType || "image/jpeg";
    if (bufferLooksLikeHeic(buffer) || isDeclaredHeic(opts.sourcePath, contentType)) {
      bytes = await heicBufferToJpeg(buffer);
      mime = "image/jpeg";
    }
    const stripped = await stripImageExif(bytes, mime);
    const stem = base.replace(/\.(heic|heif|png|jpe?g|webp|gif)$/i, "") || "foto";
    const ext =
      stripped.contentType === "image/png"
        ? "png"
        : stripped.contentType === "image/webp"
          ? "webp"
          : stripped.contentType === "image/gif"
            ? "gif"
            : "jpg";
    const destPath = `${RESPUESTA_PUBLISHED_PREFIX}/${respuestaId}/${crypto.randomUUID()}/${stem}.${ext}`;
    assertSafePublishedPath(destPath);
    return savePublishedMediaObject({
      destPath,
      buffer: stripped.buffer,
      contentType: stripped.contentType,
    });
  }
  const destPath = `${RESPUESTA_PUBLISHED_PREFIX}/${respuestaId}/${crypto.randomUUID()}/${base}`;
  assertSafePublishedPath(destPath);
  await src.copy(bucket.file(destPath));
  return finalizePublishedObject(destPath);
}

/** Borra published/respuestas/{id}/** y los paths privados citados. */
export async function deleteRespuestaStorageFiles(
  respuestaId: string,
  referencedPaths: string[]
): Promise<void> {
  const id = assertSafeStoryId(respuestaId);
  const bucket = getAdminBucket();
  const prefix = `${RESPUESTA_PUBLISHED_PREFIX}/${id}/`;
  const [files] = await bucket.getFiles({ prefix });
  for (const file of files) {
    if (!file.name.startsWith(prefix)) continue;
    await file.delete({ ignoreNotFound: true });
  }
  const seen = new Set<string>();
  for (const raw of referencedPaths) {
    const path = raw.trim();
    if (!path || seen.has(path) || path.includes("..") || path.includes("\0")) continue;
    seen.add(path);
    if (path.startsWith(prefix)) continue;
    if (!path.startsWith(`${PRIVATE_PREFIX}/`)) continue;
    try {
      assertSafeSubmissionsPath(path);
    } catch {
      continue;
    }
    await bucket.file(path).delete({ ignoreNotFound: true });
  }
}
