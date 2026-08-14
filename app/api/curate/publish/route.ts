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
import { notifyAuthorStoryPublished } from "@/lib/email/notify-author-published";

export const runtime = "nodejs";

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

    const publicationMail = await notifyAuthorStoryPublished({ db, storyId });

    return NextResponse.json({
      ok: true,
      storyId,
      temas,
      publicationMail,
      message: `Historia visible (approved) para audiencia público en flujo español`,
    });
  } catch (err) {
    console.error("[curate/publish]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
