/**
 * POST /api/curate/publish — compatibilidad: publica borrador español (`titulo`, `pending`) en colección `stories`.
 *
 * Preferencia nueva: crear historias públicas desde envíos mediante **POST `/api/admin/publish`**
 * (delega en `editorialPublishFromSubmission`).
 *
 * Este endpoint delega en `editorialPublishSpanishDraftInPlace` (`lib/editorial/service.ts`).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebase/admin";
import type { StoryData } from "@/lib/story-schema";
import { editorialPublishSpanishDraftInPlace } from "@/lib/editorial/service";
import { TEMAS_MAP } from "@/lib/temas";
import { sendPublicationEmail } from "@/lib/email/send-publication-email";

export const runtime = "nodejs";

/** Campos opcionales que pueden existir en Firestore aunque no estén en StoryData tipado. */
type StoryPublishExtras = StoryData & {
  autorName?: string;
  title?: string;
  email?: string;
  autorEmail?: string;
  placeLabel?: string;
  city?: string;
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const actorEmail = auth.email;

  try {
    const body = (await req.json()) as {
      storyId: string;
      temas: string[];
      curadorNota?: string;
      ubicacion?: StoryData["ubicacion"];
      quote?: string;
    };

    const { storyId, temas, curadorNota, ubicacion, quote } = body;

    if (!storyId) {
      return NextResponse.json({ error: "storyId es requerido" }, { status: 400 });
    }
    if (!Array.isArray(temas) || temas.length === 0) {
      return NextResponse.json({ error: "Debes asignar al menos un tema" }, { status: 400 });
    }

    const temasInvalidos = temas.filter((t) => !TEMAS_MAP[t]);
    if (temasInvalidos.length > 0) {
      return NextResponse.json(
        { error: `Temas no reconocidos: ${temasInvalidos.join(", ")}` },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const editorial = await editorialPublishSpanishDraftInPlace({
      db,
      storyId,
      actorEmail,
      body: { temas, curadorNota, ubicacion, quote },
    });
    if (!editorial.ok) {
      const code = editorial.httpStatus ?? 400;
      return NextResponse.json({ error: editorial.error }, { status: code });
    }

    try {
      const ref = db.collection("stories").doc(storyId);
      const refreshed = await ref.get();
      const story = (refreshed.exists ? refreshed.data() : {}) as StoryData;

      const submissionSnap = await db.collection("story_submissions").doc(storyId).get();
      const submissionData = submissionSnap.exists ? submissionSnap.data() : null;

      const storyX = story as StoryPublishExtras;
      const autorWithEmail = story.autor as StoryData["autor"] & { email?: string };
      const authorEmail =
        (submissionData?.email as string | undefined) ||
        (submissionData?.autorEmail as string | undefined) ||
        autorWithEmail?.email ||
        storyX.autorEmail ||
        storyX.email ||
        null;

      if (authorEmail) {
        const ubic = story.ubicacion as (NonNullable<StoryData["ubicacion"]> & { nombre?: string }) | undefined;
        await sendPublicationEmail({
          authorName: story.autor?.nombre || storyX.autorName || "Autor",
          authorEmail,
          storyTitle: story.titulo || storyX.title || "Tu historia",
          storyId,
          placeName:
            ubic?.nombre || ubic?.label || ubic?.ciudad || storyX.placeLabel || storyX.city || "el mundo",
        });
      }
    } catch (emailErr) {
      console.error("[curate/publish] Error enviando correo:", emailErr);
    }

    return NextResponse.json({
      ok: true,
      storyId,
      temas,
      message: `Historia visible (approved) para audiencia público en flujo español`,
    });
  } catch (err) {
    console.error("[curate/publish]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
