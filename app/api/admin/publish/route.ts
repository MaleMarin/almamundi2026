import "server-only";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { Resend } from "resend";

export const runtime = "nodejs";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/** POST /api/admin/publish — publicar submission + enviar email al autor. Body: { submissionId }. Header: x-admin-token. */
export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!process.env.ADMIN_PUBLISH_TOKEN || token !== process.env.ADMIN_PUBLISH_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

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
  if (status !== "pending" && status !== "approved") {
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

  const to = sub.authorEmail as string;
  const site = process.env.PUBLIC_SITE_URL || "https://www.almamundi.org";
  const link = `${site}/mapa/historias/${storyRef.id}`;

  let mailSent = false;
  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.MAIL_FROM || "AlmaMundi <hola@almamundi.org>",
        to,
        subject: "Tu historia ya está publicada en AlmaMundi",
        html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.5">
        <p>Hola${sub.authorName ? ` ${String(sub.authorName)}` : ""},</p>
        <p>Tu historia ya fue revisada y publicada en AlmaMundi.</p>
        <p><a href="${link}">Ver tu historia publicada</a></p>
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
