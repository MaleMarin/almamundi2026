import { NextRequest, NextResponse } from "next/server";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { StorySubmission, StoryFormat, StoryMood, Consent } from "@/lib/firebase/types";
import { analyzeStory } from "@/lib/huella/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

const FORMATS: StoryFormat[] = ["text", "audio", "video", "image"];
const MOODS: StoryMood[] = ["mar", "ciudad", "bosque", "animales", "universo", "personas", "radio", "lluvia", "mercado"];

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
  try {
    const body = await request.json();

    const authorEmail = typeof body.authorEmail === "string" ? body.authorEmail.trim() : "";
    const authorName = typeof body.authorName === "string" ? body.authorName.trim() : undefined;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const placeLabel = typeof body.placeLabel === "string" ? body.placeLabel.trim() : "";
    const lat = typeof body.lat === "number" ? body.lat : Number(body.lat);
    const lng = typeof body.lng === "number" ? body.lng : Number(body.lng);
    const format = FORMATS.includes(body.format) ? body.format : "text";
    const text = typeof body.text === "string" ? body.text.trim() : undefined;
    const tags = body.tags;
    const consent = body.consent;

    if (!authorEmail || !title || !placeLabel || Number.isNaN(lat) || Number.isNaN(lng)) {
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

    const themes = Array.isArray(tags?.themes) ? tags.themes.filter((t: unknown) => typeof t === "string") : [];
    const moods = Array.isArray(tags?.moods) ? tags.moods.filter((m: unknown) => MOODS.includes(m as StoryMood)) : [];
    const keywords = Array.isArray(tags?.keywords) ? tags.keywords.filter((k: unknown) => typeof k === "string") : [];

    const media: StorySubmission["media"] = {};
    if (typeof body.media?.audioUrl === "string") media.audioUrl = body.media.audioUrl;
    if (typeof body.media?.videoUrl === "string") media.videoUrl = body.media.videoUrl;
    if (typeof body.media?.coverImageUrl === "string") media.coverImageUrl = body.media.coverImageUrl;
    if (typeof body.media?.imageUrl === "string") media.imageUrl = body.media.imageUrl;

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
      console.log("[submit] Historia guardada en Firestore:", ref.id, "|", title);
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : "";
      if (/Firebase Admin|FIREBASE_|config/i.test(msg)) {
        console.warn("submit: Firebase no configurado; respuesta de desarrollo. Configura FIREBASE_* en .env.local para guardar en Firestore.");
        return NextResponse.json({ ok: true, id: `dev-${Date.now()}` });
      }
      throw dbError;
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
        console.warn("[submit] Análisis huella (Whisper/GPT) falló:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      id: ref.id,
      ...(visualParams != null && { visualParams }),
      ...(transcription != null && { transcription }),
    });
  } catch (e) {
    console.error("submit", e);
    return NextResponse.json(
      { error: "No pudimos guardar tu historia. Intenta más tarde o revisa tu conexión." },
      { status: 500 }
    );
  }
}
