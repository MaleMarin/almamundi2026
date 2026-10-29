import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { bufferLooksLikeHeic, heicBufferToJpeg, isDeclaredHeic } from "@/lib/heic-jpeg";
import { readPrivateSubmissionObject } from "@/lib/server-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

/** JPEG de una foto HEIC/HEIF ya guardada, solo para el admin. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const storagePath = request.nextUrl.searchParams.get("path")?.trim() ?? "";
  if (!storagePath.startsWith("submissions/private/")) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  try {
    const object = await readPrivateSubmissionObject(storagePath);
    const heic = isDeclaredHeic(storagePath, object.contentType) || bufferLooksLikeHeic(object.buffer);
    if (!heic) {
      return NextResponse.json({ error: "not heic" }, { status: 415 });
    }
    const jpeg = await heicBufferToJpeg(object.buffer);
    return new NextResponse(new Uint8Array(jpeg), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[admin/stories/heic]", err instanceof Error ? err.message : "convert failed");
    return NextResponse.json({ error: "heic preview failed" }, { status: 422 });
  }
}
