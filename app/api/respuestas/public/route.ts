import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { resolveQuestionId, isQuestionMode } from "@/lib/pregunta-semana";
import { clientIpFromRequest, enforceRateLimit, getRateLimiter } from "@/lib/rate-limit";
import { RESPUESTAS_COLLECTION } from "@/lib/respuestas/constants";
import type { RespuestaPublica } from "@/lib/respuestas/public";

export const runtime = "nodejs";

function toMillis(ts: unknown): number {
  if (typeof ts === "number" && ts > 0) return ts;
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

/** GET /api/respuestas/public?questionId=&mode=&offset=&limit= — solo aprobadas, sin correo. */
export async function GET(request: NextRequest) {
  const ip = clientIpFromRequest(request);
  const blocked = await enforceRateLimit(
    getRateLimiter("respuestas-public", 120, 60),
    `respuestas-public:${ip}`,
    { max: 120, windowMs: 60_000 }
  );
  if (blocked) return blocked;

  const questionId = resolveQuestionId(request.nextUrl.searchParams.get("questionId"));
  if (!questionId) return NextResponse.json({ error: "invalid_question" }, { status: 400 });
  const modeRaw = request.nextUrl.searchParams.get("mode");
  const mode = modeRaw && isQuestionMode(modeRaw) ? modeRaw : null;
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 24);
  const offsetRaw = Number(request.nextUrl.searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(limitRaw) ? Math.min(40, Math.max(1, Math.floor(limitRaw))) : 24;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0;

  try {
    const snap = await getAdminDb().collection(RESPUESTAS_COLLECTION).where("questionId", "==", questionId).get();
    const items: RespuestaPublica[] = [];
    let total = 0;
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      if (data.status !== "approved") continue;
      if (data.malwareScanStatus === "infected") continue;
      total += 1;
      const itemMode = data.mode === "alguien" ? "alguien" : "tu";
      if (mode && itemMode !== mode) continue;
      const lat = typeof data.lat === "number" && Number.isFinite(data.lat) ? data.lat : null;
      const lng = typeof data.lng === "number" && Number.isFinite(data.lng) ? data.lng : null;
      items.push({
        id: doc.id,
        questionId,
        mode: itemMode,
        kind: data.kind === "voz" || data.kind === "foto" ? data.kind : "texto",
        contenido: typeof data.contenido === "string" ? data.contenido : "",
        alias: typeof data.alias === "string" ? data.alias : "",
        city: typeof data.city === "string" ? data.city : "",
        previewUrl: typeof data.publishedUrl === "string" ? data.publishedUrl : null,
        lat,
        lng,
        createdAt: toMillis(data.createdAt),
      } as RespuestaPublica & { createdAt: number });
    }
    items.sort((a, b) => ((b as { createdAt?: number }).createdAt ?? 0) - ((a as { createdAt?: number }).createdAt ?? 0));
    const page = items.slice(offset, offset + limit).map((item) => {
      const { createdAt: _created, ...publicItem } = item as RespuestaPublica & { createdAt?: number };
      void _created;
      return publicItem;
    });
    const nextOffset = offset + page.length < items.length ? offset + page.length : null;
    return NextResponse.json({ items: page, nextOffset, total });
  } catch (e) {
    console.error("[respuestas/public]", e instanceof Error ? e.message : "list");
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}
