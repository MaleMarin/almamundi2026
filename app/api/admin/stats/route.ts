import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

/** GET /api/admin/stats — totales y estadísticas simples. */
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin(_request);
  if (auth instanceof NextResponse) return auth;

  try {
    const db = getAdminDb();
    const storiesRef = db.collection("stories");

    const [pendingSnap, activeSnap, archivedSnap, rejectedSnap] = await Promise.all([
      storiesRef.where("status", "==", "pending").count().get(),
      storiesRef.where("status", "==", "active").count().get(),
      storiesRef.where("status", "==", "archived").count().get(),
      storiesRef.where("status", "==", "rejected").count().get(),
    ]);

    // Incluir "published" como activas (compatibilidad con flujo curate)
    const publishedSnap = await storiesRef.where("status", "==", "published").count().get();
    const activeCount = activeSnap.data().count + publishedSnap.data().count;

    // Historia con más resonancias (resonances o resonancesCount)
    const allSnap = await storiesRef
      .where("status", "in", ["active", "published"])
      .limit(500)
      .get();

    let mostResonantId: string | null = null;
    let mostResonantTitle = "";
    let maxResonances = 0;
    let totalResonances = 0;

    allSnap.docs.forEach((doc) => {
      const d = doc.data() as Record<string, unknown>;
      const count =
        typeof d.resonances === "number"
          ? d.resonances
          : typeof d.resonancesCount === "number"
            ? d.resonancesCount
            : 0;
      totalResonances += count;
      if (count > maxResonances) {
        maxResonances = count;
        mostResonantId = doc.id;
        mostResonantTitle = (d.title as string) ?? "";
      }
    });

    return NextResponse.json({
      pending: pendingSnap.data().count,
      active: activeCount,
      archived: archivedSnap.data().count,
      rejected: rejectedSnap.data().count,
      totalResonances,
      mostSharedStory: mostResonantId
        ? { id: mostResonantId, title: mostResonantTitle, resonances: maxResonances }
        : null,
    });
  } catch (e) {
    console.error("[admin/stats GET]", e);
    return NextResponse.json({ error: "stats failed" }, { status: 500 });
  }
}
