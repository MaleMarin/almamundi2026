import { NextRequest, NextResponse } from "next/server";
import type { QuerySnapshot } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** GET /api/curate/submissions — envíos desde `story_submissions` (+ `submissions` si status=pending). */

function coerceCreatedMs(raw: Record<string, unknown>): number {
  const c = raw.createdAt;
  if (typeof c === "number" && Number.isFinite(c)) return c;
  if (c && typeof (c as { toMillis?: () => number }).toMillis === "function") {
    try {
      return (c as { toMillis: () => number }).toMillis();
    } catch {
      /* ignore */
    }
  }
  if (typeof c === "string") {
    const t = Date.parse(c);
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

function mapStorySubmissions(snap: QuerySnapshot) {
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const createdAt =
      data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === "function"
        ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
        : null;
    const updatedAt =
      data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function"
        ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
        : null;
    const cms = coerceCreatedMs(data);
    return {
      id: d.id,
      ...data,
      createdAt,
      updatedAt,
      submissionSource: "story_submissions" as const,
      _createdMs: cms,
    };
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam =
      searchParams.get("status") as
        | "pending"
        | "needs_changes"
        | "approved"
        | "rejected"
        | "published"
        | null;

    const db = getAdminDb();
    const col = db.collection("story_submissions");

    const effectiveStatus = statusParam ?? "pending";
    const legacySnap =
      effectiveStatus !== "pending"
        ? await col.where("status", "==", effectiveStatus).orderBy("createdAt", "desc").limit(100).get()
        : await col.where("status", "==", "pending").orderBy("createdAt", "desc").limit(100).get();

    const legacyList = mapStorySubmissions(legacySnap);

    const subirList =
      effectiveStatus === "pending"
        ? (
            await db.collection("submissions").where("status", "==", "pending").limit(100).get()
          ).docs.map((d) => {
            const raw = d.data() as Record<string, unknown>;
            const title =
              typeof raw.storyTitle === "string"
                ? raw.storyTitle
                : typeof raw.title === "string"
                  ? raw.title
                  : "(sin título)";
            const ms = coerceCreatedMs(raw);
            const createdAt = ms > 0 ? new Date(ms).toISOString() : null;
            return {
              id: d.id,
              ...raw,
              title,
              storyTitle: title,
              placeLabel: typeof raw.placeLabel === "string" ? raw.placeLabel : "",
              authorEmail: raw.email ?? raw.authorEmail,
              format: raw.type ?? raw.format ?? "",
              submissionSource: "submissions" as const,
              createdAt,
              updatedAt: null,
              _createdMs: ms,
            };
          })
        : [];

    const merged = [...legacyList, ...subirList].sort((a, b) => b._createdMs - a._createdMs);
    const list = merged.slice(0, 120).map((row) => {
      const cloned = { ...row } as Record<string, unknown>;
      delete cloned._createdMs;
      return cloned;
    });

    return NextResponse.json({ submissions: list });
  } catch (e) {
    console.error("curate submissions list", e);
    return NextResponse.json({ error: "List failed" }, { status: 500 });
  }
}
