import { NextRequest, NextResponse } from "next/server";
import {
  bufferMatchesDeclaredMime,
  isAllowedStoryMediaMime,
} from "@/lib/file-sniff";
import { savePrivateSubmissionObject } from "@/lib/server-storage";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";
import { verifyTurnstileIfConfigured } from "@/lib/turnstile";

export const runtime = "nodejs";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_AUDIO = 12 * 1024 * 1024;
const MAX_VIDEO = 60 * 1024 * 1024;

function maxBytesForMime(mime: string): number {
  if (mime.startsWith("image/")) return MAX_IMAGE;
  if (mime.startsWith("audio/")) return MAX_AUDIO;
  if (mime.startsWith("video/")) return MAX_VIDEO;
  return 0;
}

/** POST multipart: file (+ opcional cf-turnstile-response). Subida privada server-side. */
export async function POST(req: NextRequest) {
  // TODO: verificar token con Firebase Admin en v2
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter("story-media", 40, 3600);
  const blocked = await enforceRateLimit(rl, `story-media:${ip}`, {
    max: 40,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const turnstile = form.get("cf-turnstile-response");
  const captcha = await verifyTurnstileIfConfigured(
    typeof turnstile === "string" ? turnstile : null,
    ip
  );
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.reason }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }

  const mime = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!isAllowedStoryMediaMime(mime)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  const maxB = maxBytesForMime(mime);
  if (file.size > maxB) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (!bufferMatchesDeclaredMime(buf, mime)) {
    return NextResponse.json({ error: "content_type_mismatch" }, { status: 400 });
  }

  try {
    const { storagePath, signedReadUrl } = await savePrivateSubmissionObject({
      buffer: buf,
      originalName: file.name || "upload",
      contentType: mime,
    });
    return NextResponse.json({
      ok: true,
      storagePath,
      signedReadUrl,
    });
  } catch (e) {
    console.error("[story-media]", e);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
