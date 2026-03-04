import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

type StoryStatus = "pending" | "active" | "archived" | "rejected";

function toMillis(ts: unknown): number | null {
  if (ts == null) return null;
  if (typeof ts === "number" && ts > 0) return ts;
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return null;
}

/** GET /api/admin/stories?status=pending|active|archived|rejected */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const status = request.nextUrl.searchParams.get("status") as StoryStatus | null;
  if (!status || !["pending", "active", "archived", "rejected"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection("stories")
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const list = snap.docs.map((doc) => {
      const d = doc.data();
      const createdAt = toMillis(d.createdAt);
      const activeSince = toMillis(d.activeSince);
      return {
        id: doc.id,
        title: d.title ?? "",
        alias: d.alias ?? "",
        place: d.place ?? d.placeLabel ?? "",
        lat: d.lat ?? null,
        lng: d.lng ?? null,
        format: d.format ?? "text",
        mediaUrl: d.mediaUrl ?? (d.media as { videoUrl?: string; audioUrl?: string })?.videoUrl ?? (d.media as { videoUrl?: string; audioUrl?: string })?.audioUrl ?? "",
        topic: Array.isArray(d.topic) ? d.topic : (d.tags as { themes?: string[] })?.themes ?? [],
        status: d.status ?? "pending",
        activeSince,
        isFeatured: Boolean(d.isFeatured),
        resonances: typeof d.resonances === "number" ? d.resonances : 0,
        createdAt,
        authorEmail: d.authorEmail ?? null,
        rightsAccepted: Boolean(d.rightsAccepted),
      };
    });

    return NextResponse.json({ stories: list });
  } catch (e) {
    console.error("[admin/stories GET]", e);
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}
