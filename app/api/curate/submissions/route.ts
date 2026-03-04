import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const ADMIN_TOKEN = process.env.ADMIN_PUBLISH_TOKEN ?? "";

function checkAuth(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token") ?? "";
  return Boolean(ADMIN_TOKEN && token === ADMIN_TOKEN);
}

/** GET /api/curate/submissions — lista envíos (curador). Query: status=pending. Header: x-admin-token. */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
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
      const createdAt = data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === "function"
        ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
        : null;
      const updatedAt = data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function"
        ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
        : null;
      return { id: d.id, ...data, createdAt, updatedAt };
    });

    return NextResponse.json({ submissions: list });
  } catch (e) {
    console.error("curate submissions list", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "List failed" },
      { status: 500 }
    );
  }
}
