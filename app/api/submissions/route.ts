import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  isValidMediaUrl,
  MAX_DESCRIPCION,
  MAX_TEXTO,
  MAX_TITULO,
  stripHtml,
} from "@/lib/api/input-validation";
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
  // TODO: verificar token con Firebase Admin en v2
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

  const storyTitle = stripHtml(data.storyTitle).slice(0, MAX_TITULO);
  if (!storyTitle.trim()) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  if (storyTitle.trim().length < 2) {
    return NextResponse.json({ error: "Título mínimo 2 caracteres" }, { status: 400 });
  }

  const context = stripHtml(data.context).slice(0, MAX_DESCRIPCION);
  if (context.trim().length < 30) {
    return NextResponse.json(
      { error: "Contexto mínimo 30 caracteres" },
      { status: 400 }
    );
  }
  const alias = stripHtml(data.alias).slice(0, 120);
  if (alias.trim().length < 2) {
    return NextResponse.json({ error: "Nombre mínimo 2 caracteres" }, { status: 400 });
  }
  const placeLabel = stripHtml(data.placeLabel).slice(0, 200);
  if (!placeLabel.trim()) {
    return NextResponse.json({ error: "Ciudad o lugar requerido" }, { status: 400 });
  }
  const date = stripHtml(data.date).slice(0, 200);
  const countryLabel = data.countryLabel?.trim()
    ? stripHtml(data.countryLabel).slice(0, 120)
    : undefined;
  const birthDate = data.birthDate?.trim()
    ? stripHtml(data.birthDate).slice(0, 80)
    : undefined;

  const textBodyRaw = data.payload.textBody?.trim();
  const textBody =
    textBodyRaw !== undefined && textBodyRaw !== ""
      ? stripHtml(textBodyRaw).slice(0, MAX_TEXTO)
      : undefined;

  const videoUrl = data.payload.videoUrl?.trim() ?? "";
  if (videoUrl && !isValidMediaUrl(videoUrl)) {
    return NextResponse.json({ error: "URL de video no permitida" }, { status: 400 });
  }
  const audioUrl = data.payload.audioUrl?.trim() ?? "";
  if (audioUrl && !isValidMediaUrl(audioUrl)) {
    return NextResponse.json({ error: "URL de audio no permitida" }, { status: 400 });
  }
  const photoUrl = data.payload.photoUrl?.trim() ?? "";
  if (photoUrl && !isValidMediaUrl(photoUrl)) {
    return NextResponse.json({ error: "URL de imagen no permitida" }, { status: 400 });
  }
  if (data.payload.photoUrls?.length) {
    for (const u of data.payload.photoUrls) {
      const t = u.trim();
      if (t && !isValidMediaUrl(t)) {
        return NextResponse.json({ error: "URL de imagen no permitida" }, { status: 400 });
      }
    }
  }
  const profilePhotoUrl = data.profilePhotoUrl?.trim() ?? "";
  if (profilePhotoUrl && !isValidMediaUrl(profilePhotoUrl)) {
    return NextResponse.json({ error: "URL de imagen no permitida" }, { status: 400 });
  }
  if (data.extraAttachmentUrls?.length) {
    for (const u of data.extraAttachmentUrls) {
      const t = u.trim();
      if (t && !isValidMediaUrl(t)) {
        return NextResponse.json(
          { error: "URL de adjunto no permitida" },
          { status: 400 }
        );
      }
    }
  }

  const captcha = await verifyTurnstileIfConfigured(data.captchaToken, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: "Verificación anti-bot requerida." }, { status: 400 });
  }

  const { type } = data;
  if (type === "video" && !videoUrl) {
    return NextResponse.json({ error: "URL de video requerida (YouTube/Vimeo)" }, { status: 400 });
  }
  if (type === "texto" && !(textBody?.trim())) {
    return NextResponse.json({ error: "Texto requerido" }, { status: 400 });
  }
  if (
    type === "foto" &&
    !photoUrl &&
    !(data.payload.photoUrls && data.payload.photoUrls.length > 0)
  ) {
    return NextResponse.json({ error: "Al menos una imagen requerida" }, { status: 400 });
  }
  if (type === "audio" && !audioUrl) {
    return NextResponse.json({ error: "Audio requerido (sube archivo o indica URL)" }, { status: 400 });
  }

  const now = Date.now();
  const doc: Omit<SubmissionDoc, "id"> = {
    type,
    status: "pending",
    storyTitle,
    alias,
    email: data.email.trim(),
    themeId: data.themeId,
    date,
    placeLabel,
    context,
    payload: {
      ...(textBody !== undefined && textBody !== "" && { textBody }),
      ...(photoUrl && { photoUrl }),
      ...(data.payload.photoUrls?.length
        ? {
            photoUrls: data.payload.photoUrls.map((u) => u.trim()).filter(Boolean),
          }
        : {}),
      ...(audioUrl && { audioUrl }),
      ...(videoUrl && { videoUrl }),
    },
    createdAt: now,
  };
  if (data.dateApprox) (doc as SubmissionDoc).dateApprox = true;
  if (profilePhotoUrl) {
    (doc as SubmissionDoc).profilePhotoUrl = profilePhotoUrl;
  }
  if (countryLabel) {
    (doc as SubmissionDoc).countryLabel = countryLabel;
  }
  if (birthDate) {
    (doc as SubmissionDoc).birthDate = birthDate;
  }
  if (data.sex) {
    (doc as SubmissionDoc).sex = data.sex;
  }
  if (data.extraAttachmentUrls?.length) {
    (doc as SubmissionDoc).extraAttachmentUrls = data.extraAttachmentUrls
      .map((u) => u.trim())
      .filter(Boolean);
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
