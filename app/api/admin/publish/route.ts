import "server-only";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { editorialPublishFromSubmission } from "@/lib/editorial/service";
import { notifyAuthorStoryPublished } from "@/lib/email/notify-author-published";

export const runtime = "nodejs";

/**
 * POST /api/admin/publish — ruta HTTP canónica recomendada para publicar desde un envío
 * (`story_submissions` o `submissions`). Delega en `editorialPublishFromSubmission`.
 *
 * Mantener `/api/curate/publish` y `/api/curate/publish/[submissionId]` por compatibilidad;
 * nueva lógica editorial vive en `lib/editorial/service.ts`.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  let body: { submissionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const { submissionId } = body;
  if (!submissionId) {
    return NextResponse.json({ ok: false, error: "missing submissionId" }, { status: 400 });
  }

  const db = getAdminDb();
  const result = await editorialPublishFromSubmission(db, submissionId, auth.email);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.httpStatus }
    );
  }

  const publicationMail = await notifyAuthorStoryPublished({ db, storyId: result.storyId });
  if (publicationMail.status === "failed") {
    Sentry.captureMessage("publication email failed", {
      level: "error",
      tags: { source: "api.admin.publish.email" },
      extra: { storyId: result.storyId, submissionId, error: publicationMail.error },
    });
  }

  return NextResponse.json({
    ok: true,
    storyId: result.storyId,
    submissionCollection: result.submissionCollection,
    publicationMail,
    mailSent: publicationMail.status === "sent",
    mailSkipped: publicationMail.status === "skipped_no_email" ? publicationMail.error : null,
    archivedOldestStoryId: result.archivedOldestStoryId ?? null,
  });
}
