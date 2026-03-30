import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { Resend } from "resend";
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

/** POST /api/admin/publish — publicar submission + email al autor. Requiere Firebase ID token (admin). */
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
  const subRef = db.collection("story_submissions").doc(submissionId);
  const subSnap = await subRef.get();
  if (!subSnap.exists) {
    return NextResponse.json({ ok: false, error: "submission not found" }, { status: 404 });
  }

  const sub = subSnap.data() as Record<string, unknown>;
  if (sub.publishedStoryId) {
    return NextResponse.json({ ok: false, error: "already published" }, { status: 400 });
  }
  const status = sub.status as string;
  if (status !== "pending" && status !== "approved" && status !== "needs_changes") {
    return NextResponse.json({ ok: false, error: "bad status" }, { status: 400 });
  }
  const lat = sub.lat != null ? Number(sub.lat) : null;
  const lng = sub.lng != null ? Number(sub.lng) : null;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { ok: false, error: "Falta ciudad/país o ubicación. Añade lat y lng al envío en Firestore." },
      { status: 400 }
    );
  }

  const now = FieldValue.serverTimestamp();
  const storyRef = db.collection("stories").doc();

  const story: Record<string, unknown> = {
    status: "published",
    sourceSubmissionId: submissionId,
    createdAt: sub.createdAt ?? now,
    updatedAt: now,
    publishedAt: now,
    title: sub.title,
    placeLabel: sub.placeLabel,
    lat: sub.lat,
    lng: sub.lng,
    format: sub.format,
    text: sub.text ?? null,
    media: sub.media ?? {},
    tags: sub.tags ?? { themes: [], moods: [], keywords: [] },
    excerpt: typeof sub.title === "string" ? sub.title.slice(0, 160) : undefined,
  };
  if (sub.authorName) story.authorName = sub.authorName;
  if (sub.city) story.city = sub.city;
  if (sub.country) story.country = sub.country;

  await storyRef.set(story);
  const publishedSnap = await db
    .collection("stories")
    .where("status", "==", "published")
    .orderBy("publishedAt", "asc")
    .limit(31)
    .get();
  if (publishedSnap.docs.length > 30) {
    const oldest = publishedSnap.docs[0];
    await oldest.ref.update({ status: "archived", updatedAt: now });
  }
  await subRef.update({
    status: "approved",
    updatedAt: now,
    publishedStoryId: storyRef.id,
  });

  const to = String(sub.authorEmail ?? "").trim();
  if (!isValidRecipientEmail(to)) {
    return NextResponse.json({ ok: true, storyId: storyRef.id, mailSent: false, mailSkipped: "invalid_author_email" });
  }

  const site = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.almamundi.org";
  const rawLink = `${site.replace(/\/$/, "")}/mapa/historias/${storyRef.id}`;
  const link = safeHrefForEmail(rawLink, [siteOrigin(), "almamundi.org"]);

  let mailSent = false;
  const resend = getResend();
  if (resend) {
    try {
      const nameHtml =
        sub.authorName && typeof sub.authorName === "string"
          ? escapeHtml(String(sub.authorName).slice(0, 120))
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

  return NextResponse.json({ ok: true, storyId: storyRef.id, mailSent });
}
