import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { ME_PREGUNTAS_COLLECTION, ME_PREGUNTA_CONTACTS_COLLECTION } from "@/lib/me-pregunto/shared";

export const runtime = "nodejs";

const STATUSES = new Set(["pending", "approved", "rejected"]);

function toMillis(ts: unknown): number | null {
  if (typeof (ts as { toDate?: () => Date } | null)?.toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return null;
}

/** GET /api/admin/me-pregunto?status=pending|approved|rejected */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const status = request.nextUrl.searchParams.get("status") ?? "pending";
  if (!STATUSES.has(status)) return NextResponse.json({ error: "invalid status" }, { status: 400 });
  try {
    const db = getAdminDb();
    const snap = await db.collection(ME_PREGUNTAS_COLLECTION).where("status", "==", status).get();
    const contacts = snap.docs.length
      ? await db.getAll(...snap.docs.map((doc) => db.collection(ME_PREGUNTA_CONTACTS_COLLECTION).doc(doc.id)))
      : [];
    const emailById = new Map(contacts.map((c) => [c.id, c.exists ? String((c.data() ?? {}).email ?? "") : ""]));
    const items = snap.docs
      .map((doc) => {
        const d = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          texto: String(d.texto ?? ""),
          alias: String(d.alias ?? ""),
          city: String(d.city ?? ""),
          country: String(d.country ?? ""),
          locale: String(d.locale ?? "es"),
          email: emailById.get(doc.id) ?? "",
          createdAt: toMillis(d.createdAt),
          approvedAt: toMillis(d.approvedAt),
        };
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[admin/me-pregunto GET]", e instanceof Error ? e.message : "list");
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}
