import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { CreateSubmissionBody, type SubmissionDoc } from "@/lib/submissionSchema";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateMap = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let times = rateMap.get(ip) ?? [];
  times = times.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (times.length >= RATE_LIMIT_MAX) return false;
  times.push(now);
  rateMap.set(ip, times);
  return true;
}

/** POST /api/submissions — crear submission (status pending). Validación + rate limit. */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Demasiados envíos. Espera un minuto." }, { status: 429 });
  }

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

  // Validar payload según tipo
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

  try {
    const db = getAdminDb();
    const ref = await db.collection("submissions").add(doc);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error("submissions POST", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al guardar" },
      { status: 500 }
    );
  }
}
