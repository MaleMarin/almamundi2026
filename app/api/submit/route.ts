import { NextRequest, NextResponse } from "next/server";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import {
  isValidMediaUrl,
  MAX_DESCRIPCION,
  MAX_TEXTO,
  MAX_TITULO,
  stripHtml,
} from "@/lib/api/input-validation";
import { getAdminDb } from "@/lib/firebase/admin";
import type { StorySubmission, StoryFormat, StoryMood, Consent } from "@/lib/firebase/types";
import { analyzeStory } from "@/lib/huella/analyze";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";
import { verifyTurnstileIfConfigured } from "@/lib/turnstile";
import { appendEditorialAuditLog } from "@/lib/editorial/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

const FORMATS: StoryFormat[] = ["text", "audio", "video", "image"];
const MOODS: StoryMood[] = [
  "mar",
  "ciudad",
  "bosque",
  "animales",
  "universo",
  "personas",
  "radio",
  "lluvia",
  "mercado",
];

function validConsent(c: unknown): c is Consent {
  return (
    typeof c === "object" &&
    c !== null &&
    (c as Consent).termsAccepted === true &&
    (c as Consent).license === "allow_publish"
  );
}

/** POST /api/submit — crear story_submission (envío desde formulario). */
export async function POST(request: NextRequest) {
  // TODO: verificar token con Firebase Admin en v2
  const ip = clientIpFromRequest(request);
  const rl = getRateLimiter("submit-story", 5, 3600);
  const blocked = await enforceRateLimit(rl, `submit:${ip}`, {
    max: 5,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const captcha = await verifyTurnstileIfConfigured(
    typeof body.captchaToken === "string" ? body.captchaToken : undefined,
    ip
  );
  if (!captcha.ok) {
    return NextResponse.json({ error: "Verificación anti-bot requerida." }, { status: 400 });
  }

  const authorEmail = typeof body.authorEmail === "string" ? body.authorEmail.trim() : "";
  const authorNameRaw = typeof body.authorName === "string" ? body.authorName : "";
  const authorNameSan = authorNameRaw
    ? stripHtml(authorNameRaw).slice(0, 120).trim()
    : "";
  const authorName = authorNameSan || undefined;
  const title = stripHtml(
    typeof body.title === "string" ? body.title : ""
  ).slice(0, MAX_TITULO);
  const placeLabel = stripHtml(
    typeof body.placeLabel === "string" ? body.placeLabel : ""
  ).slice(0, MAX_DESCRIPCION);
  const lat = typeof body.lat === "number" ? body.lat : Number(body.lat);
  const lng = typeof body.lng === "number" ? body.lng : Number(body.lng);
  const format = FORMATS.includes(body.format as StoryFormat) ? (body.format as StoryFormat) : "text";
  const textRaw = typeof body.text === "string" ? body.text : "";
  const text = textRaw.trim()
    ? stripHtml(textRaw).slice(0, MAX_TEXTO)
    : undefined;
  const tags = body.tags as Record<string, unknown> | undefined;
  const consent = body.consent;

  if (!title) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  if (!authorEmail || !placeLabel || Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "Missing or invalid: authorEmail, title, placeLabel, lat, lng" },
      { status: 400 }
    );
  }
  if (!validConsent(consent)) {
    return NextResponse.json(
      { error: "consent.termsAccepted and consent.license required" },
      { status: 400 }
    );
  }

  const themes = Array.isArray(tags?.themes)
    ? tags.themes
        .filter((t: unknown) => typeof t === "string")
        .map((t) => stripHtml(t as string).slice(0, 80).trim())
        .filter(Boolean)
    : [];
  const moods = Array.isArray(tags?.moods)
    ? tags.moods.filter((m: unknown) => MOODS.includes(m as StoryMood))
    : [];
  const keywords = Array.isArray(tags?.keywords)
    ? tags.keywords
        .filter((k: unknown) => typeof k === "string")
        .map((k) => stripHtml(k as string).slice(0, 80).trim())
        .filter(Boolean)
    : [];

  const media: StorySubmission["media"] = {};
  if (typeof body.media === "object" && body.media !== null) {
    const m = body.media as Record<string, unknown>;
    if (typeof m.audioUrl === "string") media.audioUrl = m.audioUrl.trim();
    if (typeof m.videoUrl === "string") media.videoUrl = m.videoUrl.trim();
    if (typeof m.coverImageUrl === "string")
      media.coverImageUrl = m.coverImageUrl.trim();
    if (typeof m.imageUrl === "string") media.imageUrl = m.imageUrl.trim();
  }

  if (media.audioUrl && !isValidMediaUrl(media.audioUrl)) {
    return NextResponse.json({ error: "URL de audio no permitida" }, { status: 400 });
  }
  if (media.videoUrl && !isValidMediaUrl(media.videoUrl)) {
    return NextResponse.json({ error: "URL de video no permitida" }, { status: 400 });
  }
  if (media.imageUrl && !isValidMediaUrl(media.imageUrl)) {
    return NextResponse.json({ error: "URL de imagen no permitida" }, { status: 400 });
  }
  if (media.coverImageUrl && !isValidMediaUrl(media.coverImageUrl)) {
    return NextResponse.json({ error: "URL de imagen no permitida" }, { status: 400 });
  }

  const now = FieldValue.serverTimestamp();
  const doc: Omit<StorySubmission, "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof FieldValue.serverTimestamp>;
    updatedAt: ReturnType<typeof FieldValue.serverTimestamp>;
  } = {
    status: "pending",
    createdAt: now,
    updatedAt: now,
    authorEmail,
    title,
    placeLabel,
    lat,
    lng,
    format,
    tags: { themes, moods, keywords },
    consent: { termsAccepted: true, license: "allow_publish" },
  };
  if (authorName) doc.authorName = authorName;
  if (text) doc.text = text;
  if (Object.keys(media).length) doc.media = media;

  let ref: DocumentReference;
  try {
    const db = getAdminDb();
    ref = await db.collection("story_submissions").add(doc);
  } catch (dbError) {
    console.error("[submit] Firestore error", dbError);
    return NextResponse.json(
      { error: "No pudimos guardar tu historia. Intenta más tarde." },
      { status: 503 }
    );
  }

  try {
    const dbAudit = getAdminDb();
    await appendEditorialAuditLog(dbAudit, "anonymous:web", "submit", {
      submissionId: ref.id,
      submissionCollection: "story_submissions",
      toStatus: "pending",
    });
  } catch (auditErr) {
    console.warn("[submit POST] audit log omitido:", auditErr);
  }

  let visualParams: unknown = undefined;
  let transcription: string | undefined = undefined;
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await analyzeStory({
        text,
        audioUrl: media.audioUrl,
        videoUrl: media.videoUrl,
        format,
      });
      visualParams = result.visualParams;
      transcription = result.transcription;
      if (ref && (visualParams != null || transcription != null)) {
        const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
        if (visualParams != null) update.huellaVisualParams = visualParams;
        if (transcription != null) update.transcription = transcription;
        await ref.update(update);
      }
    } catch (e) {
      console.warn("[submit] Análisis resonancia visual (Whisper/GPT) falló:", e);
    }
  }

  return NextResponse.json({
    ok: true,
    id: ref.id,
    ...(visualParams != null && { visualParams }),
    ...(transcription != null && { transcription }),
  });
}
