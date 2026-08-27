import { NextRequest, NextResponse } from "next/server";
import { isAllowedStoryMediaMime } from "@/lib/file-sniff";
import {
  createPrivateResumableUpload,
  resumableOriginFromRequest,
} from "@/lib/server-storage";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";
import { maxUploadBytesForMime } from "@/lib/subir-limits";

export const runtime = "nodejs";

/**
 * POST JSON: { filename, contentType, size }
 * Devuelve URL resumable de GCS. El archivo NO pasa por Vercel.
 * El captcha Turnstile se verifica en POST /api/submissions (token de un solo uso).
 * Aquí el límite es rate-limit (40/hora por IP).
 */
export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter("story-media", 40, 3600);
  const blocked = await enforceRateLimit(rl, `story-media:${ip}`, {
    max: 40,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  const contentTypeHeader = req.headers.get("content-type") || "";
  if (contentTypeHeader.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "use_direct_upload" },
      { status: 400 }
    );
  }

  let body: {
    filename?: unknown;
    contentType?: unknown;
    size?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const mime =
    typeof body.contentType === "string"
      ? body.contentType.split(";")[0]?.trim().toLowerCase() ?? ""
      : "";
  if (!isAllowedStoryMediaMime(mime)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  const size = typeof body.size === "number" ? body.size : Number(body.size);
  const maxB = maxUploadBytesForMime(mime);
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "invalid_size" }, { status: 400 });
  }
  if (size > maxB) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const filename =
    typeof body.filename === "string" && body.filename.trim()
      ? body.filename.trim()
      : "media";

  try {
    const { storagePath, uploadUrl } = await createPrivateResumableUpload({
      originalName: filename,
      contentType: mime,
      origin: resumableOriginFromRequest(req),
    });
    return NextResponse.json({
      ok: true,
      storagePath,
      uploadUrl,
      maxBytes: maxB,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "uploads_paused") {
      return NextResponse.json(
        { error: "uploads_paused" },
        { status: 503 }
      );
    }
    console.error("[story-media] init", e);
    return NextResponse.json({ error: "upload_init_failed" }, { status: 500 });
  }
}
