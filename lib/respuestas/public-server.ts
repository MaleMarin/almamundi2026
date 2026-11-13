import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { anioDe } from "@/lib/anio-publico";
import { comillasTipograficas } from "@/lib/comillas";
import { idsPreguntaBanco } from "@/lib/hilos";
import { esMePreguntaId } from "@/lib/me-pregunto/shared";
import { RESPUESTAS_COLLECTION } from "@/lib/respuestas/constants";
import { isShortCode } from "@/lib/short-code";
import type { RespuestaPublica, RespuestaTarjeta } from "@/lib/respuestas/public";

/**
 * Respuestas públicas: la única regla de qué se publica y con qué campos.
 * La usan /api/respuestas/public y las páginas que entregan las respuestas en el HTML.
 */

/** `createdAt` ordena la lista; `publishedAt` (0 si no consta) fecha el sitemap. Ninguna de las dos sale al navegador. */
export type RespuestaPublicaFechada = RespuestaPublica & { createdAt: number; publishedAt: number };

/** Tope de los bancos completos (cintas y «Me pregunto…»). */
export const BANCO_TOPE = 500;

function toMillis(ts: unknown): number {
  if (typeof ts === "number" && ts > 0) return ts;
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

/** Solo aprobadas y sin archivo infectado; solo los campos públicos, sin correo. */
export function filaPublica(
  docId: string,
  data: Record<string, unknown>,
  questionId: string
): RespuestaPublicaFechada | null {
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
    mode: itemMode,
    kind: data.kind === "voz" || data.kind === "foto" ? data.kind : "texto",
    contenido: typeof data.contenido === "string" ? comillasTipograficas(data.contenido) : "",
    alias: typeof data.alias === "string" ? data.alias : "",
    city: typeof data.city === "string" ? data.city : "",
    country: typeof data.country === "string" ? data.country : "",
    previewUrl: typeof data.publishedUrl === "string" ? data.publishedUrl : null,
    lat,
    lng,
    ...(typeof data.questionText === "string" && data.questionText
      ? {
          questionText: comillasTipograficas(data.questionText),
          askerAlias: typeof data.askerAlias === "string" ? data.askerAlias : "",
          askerCity: typeof data.askerCity === "string" ? data.askerCity : "",
          askerCountry: typeof data.askerCountry === "string" ? data.askerCountry : "",
        }
      : {}),
    anio: anioDe(data.createdAt),
    createdAt: toMillis(data.createdAt),
    publishedAt: data.publishedAt ? toMillis(data.publishedAt) : 0,
  };
}

/** Las más recientes primero (ordena la lista recibida). */
export function recientesPrimero(items: RespuestaPublicaFechada[]): RespuestaPublicaFechada[] {
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

/** Respuestas publicadas a las preguntas de las cintas (?banco=hilos). Solo lectura. */
export async function respuestasPublicasHilos(db: Firestore): Promise<RespuestaPublicaFechada[]> {
  const permitidas = new Set(idsPreguntaBanco());
  const snap = await db.collection(RESPUESTAS_COLLECTION).get();
  const items: RespuestaPublicaFechada[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const qid = typeof data.questionId === "string" ? data.questionId : "";
    if (!permitidas.has(qid)) continue;
    const item = filaPublica(doc.id, data, qid);
    if (item) items.push(item);
  }
  return items;
}

/** Respuestas publicadas a las preguntas de las personas (?banco=me-pregunto). Solo lectura. */
export async function respuestasPublicasMePregunto(db: Firestore): Promise<RespuestaPublicaFechada[]> {
  const snap = await db.collection(RESPUESTAS_COLLECTION).where("capa", "==", "me-pregunto").get();
  const items: RespuestaPublicaFechada[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const qid = typeof data.questionId === "string" ? data.questionId : "";
    if (!esMePreguntaId(qid)) continue;
    const item = filaPublica(doc.id, data, qid);
    if (item) items.push(item);
  }
  return items;
}

/** Las que muestran las páginas: más recientes primero, hasta el tope del banco. */
export function enTope(items: RespuestaPublicaFechada[]): RespuestaPublicaFechada[] {
  return recientesPrimero(items).slice(0, BANCO_TOPE);
}

/**
 * Para las páginas: el mismo orden y tope que la API, y solo lo que muestra la tarjeta
 * (sin punto en el mapa, código corto ni fecha exacta).
 */
export function comoTarjetas(items: RespuestaPublicaFechada[]): RespuestaTarjeta[] {
  return enTope(items)
    .map((item) => ({
      id: item.id,
      questionId: item.questionId,
      kind: item.kind,
      contenido: item.contenido,
      alias: item.alias,
      city: item.city,
      country: item.country,
      previewUrl: item.previewUrl,
      ...(item.anio ? { anio: item.anio } : {}),
    }));
}
