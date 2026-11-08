import "server-only";
import { anioDe } from "@/lib/anio-publico";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { idPreguntaHilo, idsPreguntaBanco } from "@/lib/hilos";
import { resolveQuestionId } from "@/lib/pregunta-semana";
import { clientIpFromRequest, enforceRateLimit, getRateLimiter } from "@/lib/rate-limit";
import { RESPUESTAS_COLLECTION } from "@/lib/respuestas/constants";
import { isShortCode } from "@/lib/short-code";
import type { RespuestaPublica } from "@/lib/respuestas/public";

import { esMePreguntaId } from "@/lib/me-pregunto/shared";

export const runtime = "nodejs";

function toMillis(ts: unknown): number {
  if (typeof ts === "number" && ts > 0) return ts;
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

const BANCO_TOPE = 500;

function filaPublica(
  docId: string,
  data: Record<string, unknown>,
  questionId: string
): (RespuestaPublica & { createdAt: number }) | null {
  if (data.status !== "approved") return null;
  if (data.malwareScanStatus === "infected") return null;
  const itemMode = data.mode === "alguien" ? "alguien" : "tu";
  const lat = typeof data.lat === "number" && Number.isFinite(data.lat) ? data.lat : null;
  const lng = typeof data.lng === "number" && Number.isFinite(data.lng) ? data.lng : null;
  const code = typeof data.shortCode === "string" ? data.shortCode : "";
  return {
    id: docId,
    ...(isShortCode(code) ? { shortCode: code } : {}),
    questionId,
    ...(data.sourceType === "editorial" ? { editorial: true } : {}),
    mode: itemMode,
    kind: data.kind === "voz" || data.kind === "foto" ? data.kind : "texto",
    contenido: typeof data.contenido === "string" ? data.contenido : "",
    alias: typeof data.alias === "string" ? data.alias : "",
    city: typeof data.city === "string" ? data.city : "",
    country: typeof data.country === "string" ? data.country : "",
    previewUrl: typeof data.publishedUrl === "string" ? data.publishedUrl : null,
    lat,
    lng,
    ...(typeof data.questionText === "string" && data.questionText
      ? {
          questionText: data.questionText,
          askerAlias: typeof data.askerAlias === "string" ? data.askerAlias : "",
          askerCity: typeof data.askerCity === "string" ? data.askerCity : "",
          askerCountry: typeof data.askerCountry === "string" ? data.askerCountry : "",
        }
      : {}),
    anio: anioDe(data.createdAt),
    createdAt: toMillis(data.createdAt),
  };
}

function pagina(
  items: (RespuestaPublica & { createdAt: number })[],
  offset: number,
  limit: number
) {
  items.sort((a, b) => b.createdAt - a.createdAt);
  const page = items.slice(offset, offset + limit).map((item) => {
    const { createdAt: _created, ...publicItem } = item;
    void _created;
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
    const permitidas = new Set(idsPreguntaBanco());
    try {
      const snap = await getAdminDb().collection(RESPUESTAS_COLLECTION).get();
      const items: (RespuestaPublica & { createdAt: number })[] = [];
      for (const doc of snap.docs) {
        const data = doc.data() as Record<string, unknown>;
        const qid = typeof data.questionId === "string" ? data.questionId : "";
        if (!permitidas.has(qid)) continue;
        const item = filaPublica(doc.id, data, qid);
        if (item) items.push(item);
      }
      return pagina(items, offset, limit);
    } catch (e) {
      console.error("[respuestas/public]", e instanceof Error ? e.message : "list");
      return NextResponse.json({ error: "list failed" }, { status: 500 });
    }
  }
  if (banco === "me-pregunto") {
    try {
      const snap = await getAdminDb().collection(RESPUESTAS_COLLECTION).where("capa", "==", "me-pregunto").get();
      const items: (RespuestaPublica & { createdAt: number })[] = [];
      for (const doc of snap.docs) {
        const data = doc.data() as Record<string, unknown>;
        const qid = typeof data.questionId === "string" ? data.questionId : "";
        if (!esMePreguntaId(qid)) continue;
        const item = filaPublica(doc.id, data, qid);
        if (item) items.push(item);
      }
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
    const items: (RespuestaPublica & { createdAt: number })[] = [];
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
