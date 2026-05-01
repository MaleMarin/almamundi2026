import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { appendEditorialAuditLog } from "@/lib/editorial/audit";
import { nextStatusAfterAdminStoryAction } from "@/lib/editorial/transitions";

export const runtime = "nodejs";

type Action = "approve" | "reject" | "feature" | "archive";

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
      return NextResponse.json({ error: "story not found" }, { status: 404 });
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

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (e) {
    console.error("[admin/stories PATCH]", e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
