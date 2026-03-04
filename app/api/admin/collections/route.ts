import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

/** GET /api/admin/collections — lista todas las colecciones. */
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin(_request);
  if (auth instanceof NextResponse) return auth;

  try {
    const db = getAdminDb();
    const snap = await db.collection("collections").orderBy("title").get();
    const list = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title ?? "",
        slug: d.slug ?? "",
        description: d.description ?? "",
        storyIds: Array.isArray(d.storyIds) ? d.storyIds : [],
      };
    });
    return NextResponse.json({ collections: list });
  } catch (e) {
    console.error("[admin/collections GET]", e);
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}

/** POST /api/admin/collections — nueva colección. Body: { title, slug?, description? }. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: { title?: string; slug?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "missing title" }, { status: 400 });
  }

  const slug =
    (body.slug ?? "").trim() ||
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  try {
    const db = getAdminDb();
    const ref = await db.collection("collections").add({
      title,
      slug,
      description: (body.description ?? "").trim(),
      storyIds: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: ref.id, slug });
  } catch (e) {
    console.error("[admin/collections POST]", e);
    return NextResponse.json({ error: "create failed" }, { status: 500 });
  }
}
