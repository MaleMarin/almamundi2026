import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["pending", "needs_changes", "approved", "rejected"] as const;

/** GET /api/curate/submissions/[id] */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const db = getAdminDb();
    const ref = db.collection("story_submissions").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const data = snap.data() ?? {};
    const createdAt =
      data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === "function"
        ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
        : null;
    const updatedAt =
      data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function"
        ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
        : null;
    return NextResponse.json({ id: snap.id, ...data, createdAt, updatedAt });
  } catch (e) {
    console.error("curate submission get", e);
    return NextResponse.json({ error: "Get failed" }, { status: 500 });
  }
}

/** PATCH /api/curate/submissions/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    let body: { status?: string; curatorNotes?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const status = body.status as string | undefined;
    const curatorNotes = body.curatorNotes as string | undefined;

    if (status !== undefined && !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection("story_submissions").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (status !== undefined) update.status = status;
    if (curatorNotes !== undefined) update.curatorNotes = curatorNotes;

    await ref.update(update);

    const updated = await ref.get();
    return NextResponse.json({ id: updated.id, ...updated.data() });
  } catch (e) {
    console.error("curate submission patch", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
