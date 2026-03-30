import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { CreateSubmissionBody, type SubmissionDoc } from "@/lib/submissionSchema";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";
import { verifyTurnstileIfConfigured } from "@/lib/turnstile";

export const runtime = "nodejs";

/** POST /api/submissions — crear submission (status pending). Rate limit + validación. */
export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter("submissions-post", 8, 3600);
  const blocked = await enforceRateLimit(rl, `submissions:${ip}`, {
    max: 8,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  const parsed = CreateSubmissionBody.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const msg = first?.message ?? "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;

  const captcha = await verifyTurnstileIfConfigured(data.captchaToken, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: "Verificación anti-bot requerida." }, { status: 400 });
  }

  const { type, payload } = data;
  if (type === "video" && !payload.videoUrl) {
    return NextResponse.json({ error: "URL de video requerida (YouTube/Vimeo)" }, { status: 400 });
  }
  if (type === "texto" && !(payload.textBody?.trim())) {
    return NextResponse.json({ error: "Texto requerido" }, { status: 400 });
  }
  if (type === "foto" && !payload.photoUrl && !(payload.photoUrls && payload.photoUrls.length > 0)) {
    return NextResponse.json({ error: "Al menos una imagen requerida" }, { status: 400 });
  }
  if (type === "audio" && !payload.audioUrl) {
    return NextResponse.json({ error: "Audio requerido (sube archivo o indica URL)" }, { status: 400 });
  }

  const now = Date.now();
  const doc: Omit<SubmissionDoc, "id"> = {
    type,
    status: "pending",
    storyTitle: data.storyTitle.trim(),
    alias: data.alias.trim(),
    email: data.email.trim(),
    themeId: data.themeId,
    date: data.date.trim(),
    placeLabel: data.placeLabel.trim(),
    context: data.context.trim(),
    payload: {
      ...(payload.textBody && { textBody: payload.textBody.trim() }),
      ...(payload.photoUrl && { photoUrl: payload.photoUrl }),
      ...(payload.photoUrls?.length ? { photoUrls: payload.photoUrls } : {}),
      ...(payload.audioUrl && { audioUrl: payload.audioUrl }),
      ...(payload.videoUrl && { videoUrl: payload.videoUrl }),
    },
    createdAt: now,
  };
  if (data.dateApprox) (doc as SubmissionDoc).dateApprox = true;
  if (data.profilePhotoUrl?.trim()) {
    (doc as SubmissionDoc).profilePhotoUrl = data.profilePhotoUrl.trim();
  }
  if (data.countryLabel?.trim()) {
    (doc as SubmissionDoc).countryLabel = data.countryLabel.trim();
  }
  if (data.birthDate?.trim()) {
    (doc as SubmissionDoc).birthDate = data.birthDate.trim();
  }
  if (data.sex) {
    (doc as SubmissionDoc).sex = data.sex;
  }
  if (data.extraAttachmentUrls?.length) {
    (doc as SubmissionDoc).extraAttachmentUrls = data.extraAttachmentUrls;
  }
  if (data.privateMediaPaths?.length) {
    (doc as SubmissionDoc).privateMediaPaths = data.privateMediaPaths;
  }

  try {
    const db = getAdminDb();
    const ref = await db.collection("submissions").add(doc);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error("submissions POST", e);
    return NextResponse.json(
      { error: "Error al guardar" },
      { status: 500 }
    );
  }
}
