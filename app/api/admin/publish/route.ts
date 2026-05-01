import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { Resend } from "resend";
import { editorialPublishFromSubmission } from "@/lib/editorial/service";
import { escapeHtml, safeHrefForEmail, isValidRecipientEmail } from "@/lib/email-html";

export const runtime = "nodejs";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function siteOrigin(): string {
  const u =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.PUBLIC_SITE_URL?.trim() ||
    "https://www.almamundi.org";
  try {
    return new URL(u.endsWith("/") ? u.slice(0, -1) : u).hostname;
  } catch {
    return "www.almamundi.org";
  }
}

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

  const authorEmailCandidate = result.authorEmail?.trim();
  let mailSent = false;
  const to =
    typeof authorEmailCandidate === "string" && isValidRecipientEmail(authorEmailCandidate)
      ? authorEmailCandidate
      : "";

  if (to) {
    const site =
      process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.almamundi.org";
    const rawLink = `${site.replace(/\/$/, "")}/mapa/historias/${result.storyId}`;
    const link = safeHrefForEmail(rawLink, [siteOrigin(), "almamundi.org"]);

    const resend = getResend();
    if (resend) {
      try {
        const displayNameTrim = result.authorDisplayName?.trim();
        const nameHtml =
          displayNameTrim && displayNameTrim.length > 0
            ? escapeHtml(displayNameTrim.slice(0, 120))
            : "";
        await resend.emails.send({
          from: process.env.MAIL_FROM || "AlmaMundi <hola@almamundi.org>",
          to,
          subject: "Tu historia ya está publicada en AlmaMundi",
          html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.5">
        <p>Hola${nameHtml ? ` ${nameHtml}` : ""},</p>
        <p>Tu historia ya fue revisada y publicada en AlmaMundi.</p>
        <p><a href="${link.replace(/"/g, "")}">Ver tu historia publicada</a></p>
        <p style="color:#666;font-size:12px">Gracias por compartir tu mirada del mundo.</p>
      </div>
    `,
        });
        mailSent = true;
      } catch (err) {
        console.error("Resend send failed", err);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    storyId: result.storyId,
    submissionCollection: result.submissionCollection,
    mailSent,
    mailSkipped: !to ? "invalid_author_email" : null,
    archivedOldestStoryId: result.archivedOldestStoryId ?? null,
  });
}
