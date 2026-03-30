import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** GET /api/curate/submissions — lista envíos (solo admin Firebase + allowlist). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as
      | "pending"
      | "needs_changes"
      | "approved"
      | "rejected"
      | "published"
      | null;

    const db = getAdminDb();
    const col = db.collection("story_submissions");
    const snap = status
      ? await col.where("status", "==", status).orderBy("createdAt", "desc").limit(100).get()
      : await col.orderBy("createdAt", "desc").limit(100).get();
    const list = snap.docs.map((d) => {
      const data = d.data();
      const createdAt =
        data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === "function"
          ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
          : null;
      const updatedAt =
        data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function"
          ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
          : null;
      return { id: d.id, ...data, createdAt, updatedAt };
    });

    return NextResponse.json({ submissions: list });
  } catch (e) {
    console.error("curate submissions list", e);
    return NextResponse.json({ error: "List failed" }, { status: 500 });
  }
}
