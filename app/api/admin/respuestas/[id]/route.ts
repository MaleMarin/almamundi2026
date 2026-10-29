import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/adminAuth";
import { appendEditorialAuditLog } from "@/lib/editorial/audit";
import { isValidRecipientEmail } from "@/lib/email-html";
import {
  sendRespuestaPublishedEmail,
  sendRespuestaRejectedEmail,
} from "@/lib/email/respuesta-mail";
import { getAdminDb } from "@/lib/firebase/admin";
import { publishBlockedByMalware } from "@/lib/malware-scan";
import {
  RESPUESTA_CONTACTS_COLLECTION,
  RESPUESTAS_COLLECTION,
} from "@/lib/respuestas/constants";
import {
  copyPrivateSubmissionToPublishedRespuesta,
  deleteRespuestaStorageFiles,
} from "@/lib/server-storage";
import { geocodePublicPlace } from "@/lib/respuestas/geocode";
import { temasGuardados } from "@/lib/temas";

export const runtime = "nodejs";
export const maxDuration = 60;

type Action = "approve" | "reject" | "archive" | "themes";

function cleanPlace(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 120);
}

function storedPoint(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function contactEmail(id: string): Promise<string | null> {
  const snap = await getAdminDb().collection(RESPUESTA_CONTACTS_COLLECTION).doc(id).get();
  const email = snap.data()?.email;
  if (typeof email !== "string" || !isValidRecipientEmail(email)) return null;
  return email.trim();
}

/** PATCH /api/admin/respuestas/[id] — aprobar, rechazar o archivar. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!id || !/^[A-Za-z0-9_-]{8,128}$/.test(id)) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  let body: { action?: string; city?: string; country?: string; temas?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const action = body.action as Action | undefined;
  if (!action || !["approve", "reject", "archive", "themes"].includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }
  const temas = action === "approve" || action === "themes" ? temasGuardados(body.temas) : null;
  if ((action === "approve" || action === "themes") && !temas) {
    return NextResponse.json({ error: "Elige de 1 a 3 temas" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection(RESPUESTAS_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
    const data = snap.data() as Record<string, unknown>;
    const current = String(data.status ?? "");
    if (action === "themes") {
      if (current !== "approved") {
        return NextResponse.json({ error: "transición inválida" }, { status: 400 });
      }
      await ref.update({
        temas: temas?.temas ?? [],
        ejes: temas?.ejes ?? [],
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "approve" && current !== "pending") {
      return NextResponse.json({ error: "transición inválida" }, { status: 400 });
    }
    if (action === "reject" && current !== "pending") {
      return NextResponse.json({ error: "transición inválida" }, { status: 400 });
    }
    if (action === "archive" && !["pending", "approved", "rejected"].includes(current)) {
      return NextResponse.json({ error: "transición inválida" }, { status: 400 });
    }

    if (action === "approve") {
      const cityFix = cleanPlace(body.city);
      const countryFix = cleanPlace(body.country);
      let city = typeof data.city === "string" ? data.city : "";
      let country = typeof data.country === "string" ? data.country : "";
      let point = storedPoint(data.lat, data.lng);
      if (cityFix && countryFix) {
        city = cityFix;
        country = countryFix;
        point = null;
        await ref.update({
          city,
          country,
          lat: FieldValue.delete(),
          lng: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      if (!point) {
        point = await geocodePublicPlace(city, country);
        if (!point) {
          return NextResponse.json(
            { error: "No encontramos esta ubicación", code: "location_not_found" },
            { status: 422 }
          );
        }
        await ref.update({ lat: point.lat, lng: point.lng });
      }
      const malware = publishBlockedByMalware(data);
      if (malware.blocked) {
        return NextResponse.json({ error: malware.error }, { status: 400 });
      }
      const kind = data.kind === "voz" || data.kind === "foto" ? data.kind : "texto";
      const storagePath = typeof data.storagePath === "string" ? data.storagePath : "";
      let publishedPath: string | null = null;
      let publishedUrl: string | null = null;
      if (kind !== "texto") {
        if (!storagePath) {
          return NextResponse.json({ error: "falta el archivo" }, { status: 400 });
        }
        try {
          const copied = await copyPrivateSubmissionToPublishedRespuesta({
            sourcePath: storagePath,
            respuestaId: id,
          });
          publishedPath = copied.storagePath;
          publishedUrl = copied.publicUrl;
        } catch (err) {
          console.error("[admin/respuestas approve copy]", err instanceof Error ? err.message : "copy");
          return NextResponse.json({ error: "no se pudo publicar el archivo" }, { status: 500 });
        }
      }

      const ageRange = typeof data.ageRange === "string" ? data.ageRange.trim() : "";
      const sex = typeof data.sex === "string" ? data.sex.trim() : "";
      const antecedentes = typeof data.antecedentes === "string" ? data.antecedentes.trim().slice(0, 2000) : "";
      if (ageRange || sex || antecedentes) {
        await db.collection(RESPUESTA_CONTACTS_COLLECTION).doc(id).set(
          {
            ...(ageRange ? { ageRange } : {}),
            ...(sex ? { sex } : {}),
            ...(antecedentes ? { antecedentes } : {}),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      try {
        await ref.update({
          status: "approved",
          publishedPath,
          publishedUrl,
          publishedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          temas: temas?.temas ?? [],
          ejes: temas?.ejes ?? [],
          ...(data.ageRange != null ? { ageRange: FieldValue.delete() } : {}),
          ...(data.sex != null ? { sex: FieldValue.delete() } : {}),
          ...(data.age != null ? { age: FieldValue.delete() } : {}),
          ...(data.gender != null ? { gender: FieldValue.delete() } : {}),
          ...(data.antecedentes != null ? { antecedentes: FieldValue.delete() } : {}),
        });
      } catch (err) {
        if (publishedPath) {
          await deleteRespuestaStorageFiles(id, []).catch(() => undefined);
        }
        throw err;
      }

      const email = await contactEmail(id);
      const alias = typeof data.alias === "string" ? data.alias : "";
      const questionId = typeof data.questionId === "string" ? data.questionId : "";
      const mailed =
        email && questionId
          ? await sendRespuestaPublishedEmail({ to: email, alias, questionId })
          : { ok: false as const };
      await ref
        .update({
          publishedMail: {
            status: email ? (mailed.ok ? "sent" : "failed") : "skipped_no_email",
            at: new Date().toISOString(),
          },
        })
        .catch(() => undefined);
    } else if (action === "reject") {
      await ref.update({
        status: "rejected",
        updatedAt: FieldValue.serverTimestamp(),
      });
      const email = await contactEmail(id);
      const alias = typeof data.alias === "string" ? data.alias : "";
      const mailed = email
        ? await sendRespuestaRejectedEmail({ to: email, alias })
        : { ok: false as const };
      await ref
        .update({
          rejectedMail: {
            status: email ? (mailed.ok ? "sent" : "failed") : "skipped_no_email",
            at: new Date().toISOString(),
          },
        })
        .catch(() => undefined);
    } else {
      await ref.update({
        status: "archived",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const nextStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "archived";
    await appendEditorialAuditLog(db, auth.email, action, {
      fromStatus: current,
      toStatus: nextStatus,
      extras: { respuestaId: id },
    });
    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (e) {
    console.error("[admin/respuestas PATCH]", e instanceof Error ? e.message : "update");
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}

/** DELETE /api/admin/respuestas/[id] — borra el documento, el contacto y los archivos. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!id || !/^[A-Za-z0-9_-]{8,128}$/.test(id)) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection(RESPUESTAS_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
    const data = snap.data() as Record<string, unknown>;
    const storagePath = typeof data.storagePath === "string" ? data.storagePath : "";
    await deleteRespuestaStorageFiles(id, storagePath ? [storagePath] : []);
    const batch = db.batch();
    batch.delete(ref);
    batch.delete(db.collection(RESPUESTA_CONTACTS_COLLECTION).doc(id));
    await batch.commit();
    await appendEditorialAuditLog(db, auth.email, "delete_respuesta", {
      extras: { respuestaId: id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/respuestas DELETE]", e instanceof Error ? e.message : "delete");
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
