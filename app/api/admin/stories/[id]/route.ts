import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { appendEditorialAuditLog } from "@/lib/editorial/audit";
import { editorialDeleteStory, editorialDeleteSubmission, editorialPublishFromSubmission } from "@/lib/editorial/service";
import { nextStatusAfterAdminStoryAction } from "@/lib/editorial/transitions";
import { notifyAuthorStoryPublished } from "@/lib/email/notify-author-published";
import { authorEmailOnStory, saveAuthorContact } from "@/lib/author-contacts";
import { isShortCode } from "@/lib/short-code";
import { allocateShortCode } from "@/lib/short-code-store";
import { temasGuardados } from "@/lib/temas";
import { resolvePublicRejectionText } from "@/lib/editorial/rejection-reasons";
import { parseAlmaLocale } from "@/lib/i18n/locale";
import { notifyAuthorStoryRejected } from "@/lib/email/notify-author-rejected";

export const runtime = "nodejs";

type Action = "approve" | "reject" | "feature" | "unfeature" | "archive" | "themes";

const PENDING_COLLECTIONS = ["submissions", "story_submissions"] as const;

/** Aprobar publica el envío. Rechazar solo cambia el envío, no crea una historia. */
function cleanPlace(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 120);
}

async function moderatePendingSubmission(
  db: Firestore,
  id: string,
  action: Action,
  actorEmail: string,
  place?: { city: string; country: string },
  temas?: { temas: string[]; ejes: string[] },
  reasonInput?: { reasonId?: unknown; reasonDetail?: unknown }
) {
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "story not found" }, { status: 404 });
  }
  let ref: DocumentReference | null = null;
  let collection: (typeof PENDING_COLLECTIONS)[number] | null = null;
  for (const name of PENDING_COLLECTIONS) {
    const candidate = db.collection(name).doc(id);
    const found = await candidate.get();
    if (!found.exists) continue;
    ref = candidate;
    collection = name;
    if (String(found.get("status") ?? "") !== "pending") {
      return NextResponse.json({ error: "Este envío ya no está pendiente" }, { status: 409 });
    }
    break;
  }
  if (!ref || !collection) {
    return NextResponse.json({ error: "story not found" }, { status: 404 });
  }
  if (action === "approve" && place?.city && place.country) {
    await ref.update(
      collection === "submissions"
        ? {
            placeLabel: place.city,
            countryLabel: place.country,
            lat: FieldValue.delete(),
            lng: FieldValue.delete(),
          }
        : {
            city: place.city,
            placeLabel: place.city,
            country: place.country,
            lat: FieldValue.delete(),
            lng: FieldValue.delete(),
          }
    );
  }
  if (action === "reject") {
    const current = await ref.get();
    const data = (current.data() ?? {}) as Record<string, unknown>;
    const reason = resolvePublicRejectionText(
      reasonInput?.reasonId,
      reasonInput?.reasonDetail,
      parseAlmaLocale(typeof data.locale === "string" ? data.locale : undefined)
    );
    if (!reason.ok) return NextResponse.json({ error: reason.error }, { status: 400 });
    await ref.update({
      status: "rejected",
      reviewedAt: Date.now(),
      rejectionReasonId: reason.reasonId,
      rejectionReason: reason.publicText,
      rejectionReasonDetail: reason.detail || null,
    });
    await appendEditorialAuditLog(db, actorEmail, "reject", {
      submissionId: id,
      submissionCollection: collection,
      fromStatus: "pending",
      toStatus: "rejected",
      extras: { reasonId: reason.reasonId, rejectionReason: reason.publicText },
    });
    const rejectionMail = await notifyAuthorStoryRejected({
      db,
      collection,
      docId: id,
      publicReason: reason.publicText,
    });
    return NextResponse.json({ ok: true, status: "rejected", rejectionMail });
  }
  const result = await editorialPublishFromSubmission(db, id, actorEmail, temas);
  if (!result.ok) {
    const missingPlace = result.error === "location_not_found";
    return NextResponse.json(
      {
        error: missingPlace ? "No encontramos esta ubicación" : result.error,
        code: result.error,
      },
      { status: result.httpStatus }
    );
  }
  const publicationMail = await notifyAuthorStoryPublished({ db, storyId: result.storyId });
  return NextResponse.json({ ok: true, status: "approved", publicationMail });
}

/** PATCH /api/admin/stories/[id] — acciones moderación anglo sobre `stories`. Delegadas a transiciones canónicas. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  let body: {
    action?: string;
    city?: string;
    country?: string;
    temas?: unknown;
    reasonId?: unknown;
    reasonDetail?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const action = body.action as Action | undefined;
  if (!action || !["approve", "reject", "feature", "unfeature", "archive", "themes"].includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }
  const temas = action === "approve" || action === "themes" ? temasGuardados(body.temas) : null;
  if ((action === "approve" || action === "themes") && !temas) {
    return NextResponse.json({ error: "Elige de 1 a 3 temas" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection("stories").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return moderatePendingSubmission(
        db,
        id,
        action,
        auth.email,
        {
          city: cleanPlace(body.city),
          country: cleanPlace(body.country),
        },
        temas ?? undefined,
        { reasonId: body.reasonId, reasonDetail: body.reasonDetail }
      );
    }

    const data = snap.data() as Record<string, unknown>;
    const currentStatus = String(data.status ?? "");
    const destacada = currentStatus === "featured" || data.isFeatured === true;

    if (action === "themes") {
      if (!temas) return NextResponse.json({ error: "Elige de 1 a 3 temas" }, { status: 400 });
      await ref.update({
        temas: temas.temas,
        ejes: temas.ejes,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, status: currentStatus });
    }

    if (action === "unfeature") {
      if (!destacada) {
        return NextResponse.json({ error: "Esta historia no está destacada." }, { status: 400 });
      }
      await ref.update({
        status: currentStatus === "featured" ? "approved" : currentStatus,
        isFeatured: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await appendEditorialAuditLog(db, auth.email, "feature", {
        storyId: id,
        fromStatus: currentStatus,
        toStatus: currentStatus === "featured" ? "approved" : currentStatus,
        extras: { destacada: false },
      });
      return NextResponse.json({ ok: true, status: currentStatus === "featured" ? "approved" : currentStatus });
    }

    if (action === "feature" && !destacada) {
      const [byStatus, byFlag] = await Promise.all([
        db.collection("stories").where("status", "==", "featured").select("status").get(),
        db.collection("stories").where("isFeatured", "==", true).select("isFeatured").get(),
      ]);
      const ids = new Set<string>();
      for (const doc of byStatus.docs) ids.add(doc.id);
      for (const doc of byFlag.docs) ids.add(doc.id);
      ids.delete(id);
      if (ids.size >= 3) {
        return NextResponse.json(
          { error: "Ya hay 3 historias destacadas. Quita una para marcar esta.", code: "featured_cap" },
          { status: 409 }
        );
      }
    }

    const nextStatus = nextStatusAfterAdminStoryAction(currentStatus, action);
    if (!nextStatus) {
      return NextResponse.json(
        { error: `transición inválida desde '${currentStatus}' con action '${action}'` },
        { status: 400 }
      );
    }

    let rejectionText = "";
    const updates: Record<string, unknown> = {
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (action === "reject") {
      const reason = resolvePublicRejectionText(
        body.reasonId,
        body.reasonDetail,
        parseAlmaLocale(typeof data.locale === "string" ? data.locale : undefined)
      );
      if (!reason.ok) return NextResponse.json({ error: reason.error }, { status: 400 });
      updates.rejectionReasonId = reason.reasonId;
      updates.rejectionReason = reason.publicText;
      updates.rejectionReasonDetail = reason.detail || null;
      rejectionText = reason.publicText;
    }
    if (action === "approve" && temas) {
      updates.temas = temas.temas;
      updates.ejes = temas.ejes;
      updates.publishedAt = FieldValue.serverTimestamp();
      if (!isShortCode(typeof data.shortCode === "string" ? data.shortCode : "")) {
        updates.shortCode = await allocateShortCode(db, "stories");
      }
      const email = authorEmailOnStory(data);
      if (email) {
        await saveAuthorContact(db, id, email);
        updates.authorEmail = FieldValue.delete();
      }
    }
    if (action === "feature") {
      updates.isFeatured = true;
    }

    await ref.update(updates);

    const auditEvent =
      action === "approve"
        ? "approve"
        : action === "reject"
          ? "reject"
          : action === "feature"
            ? "feature"
            : "archive";
    await appendEditorialAuditLog(db, auth.email, auditEvent, {
      storyId: id,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      ...(action === "reject" ? { extras: { rejectionReason: rejectionText } } : {}),
    });

    let publicationMail = null;
    if (action === "approve") {
      publicationMail = await notifyAuthorStoryPublished({ db, storyId: id });
    }
    const rejectionMail =
      action === "reject"
        ? await notifyAuthorStoryRejected({
            db,
            collection: "stories",
            docId: id,
            publicReason: rejectionText,
          })
        : null;

    return NextResponse.json({ ok: true, status: nextStatus, publicationMail, rejectionMail });
  } catch (e) {
    console.error("[admin/stories PATCH]", e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}

/** DELETE /api/admin/stories/[id] — borra el documento y sus archivos. Solo administradoras. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const result = await editorialDeleteStory({ db, storyId: id, deletedBy: auth.uid });
    if (!result.ok && result.httpStatus === 404) {
      const submission = await editorialDeleteSubmission({
        db,
        submissionId: id,
        deletedBy: auth.email,
      });
      if (!submission.ok) {
        return NextResponse.json({ error: submission.error }, { status: submission.httpStatus });
      }
      return NextResponse.json({ ok: true });
    }
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/stories DELETE]", e);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
