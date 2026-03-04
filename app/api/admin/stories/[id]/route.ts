import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

type Action = "approve" | "reject" | "feature" | "archive";

/** PATCH /api/admin/stories/[id] — approve, reject, feature o archivar. Body: { action }. */
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
    const currentStatus = data.status as string;

    if (action === "approve") {
      if (currentStatus !== "pending") {
        return NextResponse.json({ error: "story is not pending" }, { status: 400 });
      }
      await ref.update({
        status: "active",
        activeSince: Date.now(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, status: "active" });
    }

    if (action === "reject") {
      if (currentStatus !== "pending") {
        return NextResponse.json({ error: "story is not pending" }, { status: 400 });
      }
      await ref.update({
        status: "rejected",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    if (action === "feature") {
      if (currentStatus !== "active" && currentStatus !== "published") {
        return NextResponse.json({ error: "story must be active to feature" }, { status: 400 });
      }
      await ref.update({
        isFeatured: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, isFeatured: true });
    }

    if (action === "archive") {
      if (currentStatus !== "active" && currentStatus !== "published") {
        return NextResponse.json({ error: "story must be active to archive" }, { status: 400 });
      }
      await ref.update({
        status: "archived",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, status: "archived" });
    }

    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  } catch (e) {
    console.error("[admin/stories PATCH]", e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
