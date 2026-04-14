import { NextResponse } from "next/server";
import {
  MAX_DESCRIPCION,
  MAX_TITULO,
  stripHtml,
} from "@/lib/api/input-validation";
import { getAdminDb } from "@/lib/firebase/admin";
import { randomUUID } from "crypto";
import { bufferMatchesDeclaredMime } from "@/lib/file-sniff";
import { savePrivateSubmissionObject } from "@/lib/server-storage";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";
import { verifyTurnstileIfConfigured } from "@/lib/turnstile";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  // TODO: verificar token con Firebase Admin en v2
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter("submissions-photo", 20, 3600);
  const blocked = await enforceRateLimit(rl, `photo:${ip}`, {
    max: 20,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  try {
    const form = await req.formData();

    const turnstile = form.get("cf-turnstile-response");
    const captcha = await verifyTurnstileIfConfigured(
      typeof turnstile === "string" ? turnstile : null,
      ip
    );
    if (!captcha.ok) {
      return NextResponse.json({ error: "captcha_required" }, { status: 400 });
    }

    const alias = stripHtml(String(form.get("alias") || "")).slice(0, 120).trim();
    const email = String(form.get("email") || "").trim().slice(0, 254);
    const topic = stripHtml(String(form.get("topic") || ""))
      .slice(0, MAX_TITULO)
      .trim();
    const context = stripHtml(String(form.get("context") || ""))
      .slice(0, MAX_DESCRIPCION)
      .trim();
    const dateTaken = stripHtml(String(form.get("dateTaken") || ""))
      .slice(0, 80)
      .trim();

    const file = form.get("file");

    if (!alias) return NextResponse.json({ error: "alias_required" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });
    if (!topic) return NextResponse.json({ error: "topic_required" }, { status: 400 });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }

    const mime = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (!bufferMatchesDeclaredMime(buf, mime)) {
      return NextResponse.json({ error: "content_type_mismatch" }, { status: 400 });
    }

    const submissionId = randomUUID();
    const ext = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
    const { storagePath, signedReadUrl } = await savePrivateSubmissionObject({
      buffer: buf,
      originalName: `${submissionId}${ext}`,
      contentType: mime,
    });

    const db = getAdminDb();
    await db.collection("submissions").doc(submissionId).set({
      type: "photo",
      alias,
      email,
      topic,
      context,
      dateTaken,
      storagePath,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, submissionId, readUrl: signedReadUrl, storagePath });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
