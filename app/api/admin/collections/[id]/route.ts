import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

/** PATCH /api/admin/collections/[id] — agregar historia. Body: { storyId }. */
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

  let body: { storyId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const storyId = (body.storyId ?? "").trim();
  if (!storyId) {
    return NextResponse.json({ error: "missing storyId" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection("collections").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "collection not found" }, { status: 404 });
    }

    const data = snap.data() as { storyIds?: string[] };
    const storyIds = Array.isArray(data.storyIds) ? data.storyIds : [];
    if (storyIds.includes(storyId)) {
      return NextResponse.json({ ok: true, message: "already in collection" });
    }

    await ref.update({
      storyIds: FieldValue.arrayUnion(storyId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/collections PATCH]", e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
