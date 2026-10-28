import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/adminAuth";
import { RESPUESTAS_COLLECTION, isRespuestaStatus } from "@/lib/respuestas/constants";
import { signReadUrlForPath } from "@/lib/server-storage";

export const runtime = "nodejs";

function toMillis(ts: unknown): number | null {
  if (ts == null) return null;
  if (typeof ts === "number" && ts > 0) return ts;
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return null;
}

/** GET /api/admin/respuestas?status=pending|approved|rejected|archived */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const status = request.nextUrl.searchParams.get("status");
  if (!isRespuestaStatus(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection(RESPUESTAS_COLLECTION).where("status", "==", status).get();
    const items = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data() as Record<string, unknown>;
        const publishedUrl = typeof data.publishedUrl === "string" ? data.publishedUrl : "";
        const storagePath = typeof data.storagePath === "string" ? data.storagePath : "";
        let previewUrl = publishedUrl || null;
        if (!previewUrl && storagePath.startsWith("submissions/private/")) {
          try {
            previewUrl = await signReadUrlForPath(storagePath);
          } catch {
            previewUrl = null;
          }
        }
        const lat = typeof data.lat === "number" && Number.isFinite(data.lat) ? data.lat : null;
        const lng = typeof data.lng === "number" && Number.isFinite(data.lng) ? data.lng : null;
        return {
          id: doc.id,
          questionId: typeof data.questionId === "string" ? data.questionId : "",
          mode: data.mode === "alguien" ? "alguien" : "tu",
          kind: data.kind === "voz" || data.kind === "foto" ? data.kind : "texto",
          contenido: typeof data.contenido === "string" ? data.contenido : "",
          alias: typeof data.alias === "string" ? data.alias : "",
          city: typeof data.city === "string" ? data.city : "",
          country: typeof data.country === "string" ? data.country : "",
          status,
          createdAt: toMillis(data.createdAt),
          previewUrl,
          hasLocation: lat != null && lng != null,
        };
      })
    );
    items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return NextResponse.json({ items: items.slice(0, 200) });
  } catch (e) {
    console.error("[admin/respuestas GET]", e instanceof Error ? e.message : "list");
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}
