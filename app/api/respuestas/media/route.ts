import "server-only";
import { NextResponse } from "next/server";
import { canonicalizeStoryMediaMime, bufferMatchesDeclaredMime } from "@/lib/file-sniff";
import { getAdminBucket } from "@/lib/firebase/admin";
import { durationSecondsFromMediaBytes } from "@/lib/media-duration-probe";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";
import {
  RESPUESTA_PHOTO_MAX_BYTES,
  RESPUESTA_VOICE_MAX_BYTES,
  RESPUESTA_VOICE_MAX_SECONDS,
} from "@/lib/respuestas/constants";
import { savePrivateSubmissionObject } from "@/lib/server-storage";
import { verifyTurnstileStrict } from "@/lib/security/turnstile-strict";

export const runtime = "nodejs";
export const maxDuration = 60;

const PHOTO_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const VOICE_MIMES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
  "video/webm",
  "video/mp4",
  "video/quicktime",
]);

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** POST /api/respuestas/media — guarda voz o foto en privado. No publica. */
export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const blocked = await enforceRateLimit(getRateLimiter("respuestas-media", 20, 3600), `respuestas-media:${ip}`, {
    max: 20,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("invalid_request", 400);
  }

  const tokenRaw = form.get("captchaToken") ?? form.get("cf-turnstile-response");
  const captcha = await verifyTurnstileStrict(typeof tokenRaw === "string" ? tokenRaw : null, ip);
  if (!captcha.ok) return jsonError("captcha_required", 400);

  const kind = form.get("kind");
  if (kind !== "voz" && kind !== "foto") return jsonError("invalid_kind", 400);

  const file = form.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return jsonError(kind === "foto" ? "photo_required" : "audio_required", 400);
  }

  const maxBytes = kind === "foto" ? RESPUESTA_PHOTO_MAX_BYTES : RESPUESTA_VOICE_MAX_BYTES;
  if (file.size > maxBytes) {
    return jsonError(kind === "foto" ? "photo_too_large" : "audio_too_large", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length <= 0 || buffer.length > maxBytes) {
    return jsonError(kind === "foto" ? "photo_too_large" : "audio_too_large", 413);
  }

  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(new Uint8Array(buffer));
  const mime = canonicalizeStoryMediaMime(detected?.mime ?? "");
  const allowed = kind === "foto" ? PHOTO_MIMES : VOICE_MIMES;
  if (!mime || !allowed.has(mime) || !(await bufferMatchesDeclaredMime(buffer, mime))) {
    return jsonError(kind === "foto" ? "photo_type" : "audio_type", 400);
  }

  let durationSeconds: number | null = null;
  if (kind === "voz") {
    const headLen = Math.min(buffer.length, 512 * 1024);
    const head = buffer.subarray(0, headLen);
    const tail = buffer.length > headLen ? buffer.subarray(buffer.length - headLen) : undefined;
    durationSeconds = durationSecondsFromMediaBytes({
      mime,
      head: new Uint8Array(head),
      tail: tail ? new Uint8Array(tail) : undefined,
      totalSize: buffer.length,
    });
    if (durationSeconds != null && durationSeconds > RESPUESTA_VOICE_MAX_SECONDS) {
      return jsonError("audio_too_long", 400);
    }
  }

  try {
    const saved = await savePrivateSubmissionObject({
      buffer,
      originalName: file.name || (kind === "foto" ? "foto" : "voz"),
      contentType: mime,
    });
    await getAdminBucket().file(saved.storagePath).setMetadata({
      contentType: mime,
      cacheControl: "private, max-age=0, no-store",
        metadata: {
          respuestaKind: kind,
          captchaVerified: "1",
          ...(durationSeconds != null ? { durationSeconds: String(Math.ceil(durationSeconds)) } : {}),
        },
    });
    return NextResponse.json({ ok: true, storagePath: saved.storagePath });
  } catch (e) {
    console.error("[respuestas/media]", e instanceof Error ? e.message : "save");
    return jsonError("send_failed", 500);
  }
}
