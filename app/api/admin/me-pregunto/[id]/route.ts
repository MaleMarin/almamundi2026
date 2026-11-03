import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { writeCoordsIfMissing } from "@/lib/respuestas/geocode";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { appendEditorialAuditLog } from "@/lib/editorial/audit";
import { parseAlmaLocale } from "@/lib/i18n/locale";
import { sendMePreguntaEmail } from "@/lib/email/me-pregunto-mail";
import { ME_PREGUNTAS_COLLECTION, ME_PREGUNTA_CONTACTS_COLLECTION } from "@/lib/me-pregunto/shared";

export const runtime = "nodejs";

function validId(id: string): boolean {
  return /^[A-Za-z0-9]{8,40}$/.test(id);
}

/** PATCH /api/admin/me-pregunto/[id] { action: "approve" | "reject", texto? } */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; texto?: string };
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    const ref = db.collection(ME_PREGUNTAS_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
    const data = (snap.data() ?? {}) as Record<string, unknown>;
    const from = String(data.status ?? "");
    const texto =
      typeof body.texto === "string" && body.texto.trim() ? body.texto.trim().slice(0, 160) : String(data.texto ?? "");
    if (body.action === "approve") {
      await ref.update({ status: "approved", texto, approvedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      // Punto multicolor en el globo: ciudad y país, nunca el lugar exacto.
      await writeCoordsIfMissing(ref, String(data.city ?? ""), String(data.country ?? "")).catch((err) => {
        console.error("[admin/me-pregunto] geocode", err instanceof Error ? err.message : "geo");
      });
      if (from !== "approved") {
        const contact = await db.collection(ME_PREGUNTA_CONTACTS_COLLECTION).doc(id).get();
        const to = contact.exists ? String((contact.data() ?? {}).email ?? "") : "";
        if (to) {
          const mailed = await sendMePreguntaEmail({
            tipo: "publicada",
            to,
            alias: String(data.alias ?? ""),
            pregunta: texto,
            preguntaId: `mp-${id}`,
            locale: parseAlmaLocale(typeof data.locale === "string" ? data.locale : undefined),
          });
          await ref.update({ publishedMail: { status: mailed.ok ? "sent" : "failed", at: new Date().toISOString() } }).catch(() => undefined);
        }
      }
    } else {
      await ref.update({ status: "rejected", updatedAt: FieldValue.serverTimestamp() });
    }
    await appendEditorialAuditLog(db, auth.email, body.action, { fromStatus: from, extras: { mePreguntaId: id } }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/me-pregunto PATCH]", e instanceof Error ? e.message : "update");
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}

/** DELETE /api/admin/me-pregunto/[id] — borra la pregunta y su contacto. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  try {
    const db = getAdminDb();
    const batch = db.batch();
    batch.delete(db.collection(ME_PREGUNTAS_COLLECTION).doc(id));
    batch.delete(db.collection(ME_PREGUNTA_CONTACTS_COLLECTION).doc(id));
    await batch.commit();
    await appendEditorialAuditLog(db, auth.email, "delete_respuesta", { note: "me-pregunto", extras: { mePreguntaId: id } }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/me-pregunto DELETE]", e instanceof Error ? e.message : "delete");
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
