import { NextRequest, NextResponse } from "next/server";
import { isAllowedStoryMediaMime } from "@/lib/file-sniff";
import { finalizePrivateSubmissionObject } from "@/lib/server-storage";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";
import { noteBytesUploaded } from "@/lib/ops/usage-state";
import { maxUploadBytesForMime } from "@/lib/subir-limits";

export const runtime = "nodejs";

/** POST JSON: { storagePath, contentType }. Comprueba el objeto ya subido a GCS. */
export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter("story-media-complete", 40, 3600);
  const blocked = await enforceRateLimit(rl, `story-media-complete:${ip}`, {
    max: 40,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  let body: { storagePath?: unknown; contentType?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const storagePath =
    typeof body.storagePath === "string" ? body.storagePath : "";
  const mime =
    typeof body.contentType === "string"
      ? body.contentType.split(";")[0]?.trim().toLowerCase() ?? ""
      : "";
  if (!storagePath || !isAllowedStoryMediaMime(mime)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const { signedReadUrl, size } = await finalizePrivateSubmissionObject({
      storagePath,
      declaredMime: mime,
      maxBytes: maxUploadBytesForMime(mime),
    });
    await noteBytesUploaded(size);
    return NextResponse.json({
      ok: true,
      storagePath,
      signedReadUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "complete_failed";
    const known = [
      "not_found",
      "empty_object",
      "file_too_large",
      "content_type_mismatch",
      "invalid_storage_path",
      "upload_expired",
    ];
    if (known.includes(msg)) {
      const status =
        msg === "not_found" ? 404 : msg === "file_too_large" ? 413 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
    console.error("[story-media] complete", e);
    return NextResponse.json({ error: "complete_failed" }, { status: 500 });
  }
}
