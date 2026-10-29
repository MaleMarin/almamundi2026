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

export const runtime = "nodejs";

type Action = "approve" | "reject" | "feature" | "archive";

const PENDING_COLLECTIONS = ["submissions", "story_submissions"] as const;

/** Aprobar publica el envío. Rechazar solo cambia el envío, no crea una historia. */
async function moderatePendingSubmission(
  db: Firestore,
  id: string,
  action: Action,
  actorEmail: string
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
  if (action === "reject") {
    await ref.update({ status: "rejected", reviewedAt: Date.now() });
    await appendEditorialAuditLog(db, actorEmail, "reject", {
      submissionId: id,
      submissionCollection: collection,
      fromStatus: "pending",
      toStatus: "rejected",
    });
    return NextResponse.json({ ok: true, status: "rejected" });
  }
  const result = await editorialPublishFromSubmission(db, id, actorEmail);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
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

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const action = body.action as Action | undefined;
  if (!action || !["approve", "reject", "feature", "archive"].includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection("stories").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return moderatePendingSubmission(db, id, action, auth.email);
    }

    const data = snap.data() as Record<string, unknown>;
    const currentStatus = String(data.status ?? "");

    const nextStatus = nextStatusAfterAdminStoryAction(currentStatus, action);
    if (!nextStatus) {
      return NextResponse.json(
        { error: `transición inválida desde '${currentStatus}' con action '${action}'` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (action === "approve") {
      updates.publishedAt = FieldValue.serverTimestamp();
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
    });

    let publicationMail = null;
    if (action === "approve") {
      publicationMail = await notifyAuthorStoryPublished({ db, storyId: id });
    }

    return NextResponse.json({ ok: true, status: nextStatus, publicationMail });
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
