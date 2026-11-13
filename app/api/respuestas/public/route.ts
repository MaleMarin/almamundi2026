import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { idPreguntaHilo } from "@/lib/hilos";
import { resolveQuestionId } from "@/lib/pregunta-semana";
import { clientIpFromRequest, enforceRateLimit, getRateLimiter } from "@/lib/rate-limit";
import { RESPUESTAS_COLLECTION } from "@/lib/respuestas/constants";
import {
  BANCO_TOPE,
  filaPublica,
  recientesPrimero,
  respuestasPublicasHilos,
  respuestasPublicasMePregunto,
  type RespuestaPublicaFechada,
} from "@/lib/respuestas/public-server";

export const runtime = "nodejs";

function pagina(items: RespuestaPublicaFechada[], offset: number, limit: number) {
  recientesPrimero(items);
  const page = items.slice(offset, offset + limit).map((item) => {
    const { createdAt: _created, publishedAt: _published, ...publicItem } = item;
    void _created;
    void _published;
    return publicItem;
  });
  const nextOffset = offset + page.length < items.length ? offset + page.length : null;
  // Caché en la red de Vercel: una lectura de Firestore sirve a todas las visitas durante un minuto (5 nov 2026).
  return NextResponse.json(
    { items: page, nextOffset, total: items.length },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}

/** GET /api/respuestas/public?questionId= o ?banco=hilos — solo aprobadas, sin correo. */
export async function GET(request: NextRequest) {
  const ip = clientIpFromRequest(request);
  const blocked = await enforceRateLimit(
    getRateLimiter("respuestas-public", 120, 60),
    `respuestas-public:${ip}`,
    { max: 120, windowMs: 60_000 }
  );
  if (blocked) return blocked;

  const banco = request.nextUrl.searchParams.get("banco");
  if (banco === "hilos") {
    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? BANCO_TOPE);
    const offsetRaw = Number(request.nextUrl.searchParams.get("offset") ?? 0);
    const limit = Number.isFinite(limitRaw) ? Math.min(BANCO_TOPE, Math.max(1, Math.floor(limitRaw))) : BANCO_TOPE;
    const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0;
    try {
      const items = await respuestasPublicasHilos(getAdminDb());
      return pagina(items, offset, limit);
    } catch (e) {
      console.error("[respuestas/public]", e instanceof Error ? e.message : "list");
      return NextResponse.json({ error: "list failed" }, { status: 500 });
    }
  }
  if (banco === "me-pregunto") {
    try {
      const items = await respuestasPublicasMePregunto(getAdminDb());
      return pagina(items, 0, BANCO_TOPE);
    } catch (e) {
      console.error("[respuestas/public me-pregunto]", e instanceof Error ? e.message : "list");
      return NextResponse.json({ error: "list failed" }, { status: 500 });
    }
  }
  if (banco) return NextResponse.json({ error: "invalid_question" }, { status: 400 });

  const preguntaPedida = request.nextUrl.searchParams.get("questionId");
  const questionId = resolveQuestionId(preguntaPedida) ?? idPreguntaHilo(preguntaPedida);
  if (!questionId) return NextResponse.json({ error: "invalid_question" }, { status: 400 });
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 24);
  const offsetRaw = Number(request.nextUrl.searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(limitRaw) ? Math.min(40, Math.max(1, Math.floor(limitRaw))) : 24;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0;

  try {
    const snap = await getAdminDb().collection(RESPUESTAS_COLLECTION).where("questionId", "==", questionId).get();
    const items: RespuestaPublicaFechada[] = [];
    for (const doc of snap.docs) {
      const item = filaPublica(doc.id, doc.data() as Record<string, unknown>, questionId);
      if (item) items.push(item);
    }
    return pagina(items, offset, limit);
  } catch (e) {
    console.error("[respuestas/public]", e instanceof Error ? e.message : "list");
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}
