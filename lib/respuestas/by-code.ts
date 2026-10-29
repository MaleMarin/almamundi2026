import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { RESPUESTAS_COLLECTION } from "@/lib/respuestas/constants";
import type { RespuestaPublica } from "@/lib/respuestas/public";
import { isShortCode } from "@/lib/short-code";

export type RespuestaCorta = {
  id: string;
  shortCode: string;
  questionId: string;
  mode: "tu" | "alguien";
  kind: "texto" | "voz" | "foto";
  city: string;
  country: string;
  previewUrl: string | null;
};

function approvedPublic(data: Record<string, unknown>): boolean {
  return data.status === "approved" && data.malwareScanStatus !== "infected";
}

/** Respuesta aprobada por código corto. Sin correo ni datos internos. */
export async function getRespuestaByShortCode(code: string): Promise<RespuestaCorta | null> {
  if (!isShortCode(code)) return null;
  try {
    const snap = await getAdminDb()
      .collection(RESPUESTAS_COLLECTION)
      .where("shortCode", "==", code)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data() as Record<string, unknown>;
    if (!approvedPublic(data)) return null;
    const questionId = typeof data.questionId === "string" ? data.questionId.trim() : "";
    if (!questionId) return null;
    return {
      id: doc.id,
      shortCode: code,
      questionId,
      mode: data.mode === "alguien" ? "alguien" : "tu",
      kind: data.kind === "voz" || data.kind === "foto" ? data.kind : "texto",
      city: typeof data.city === "string" ? data.city : "",
      country: typeof data.country === "string" ? data.country : "",
      previewUrl: typeof data.publishedUrl === "string" ? data.publishedUrl : null,
    };
  } catch (err) {
    console.error("[getRespuestaByShortCode]", err);
    return null;
  }
}

/** Una respuesta aprobada, para abrirla en el globo si no está entre las 40. */
export async function getRespuestaPublicById(id: string): Promise<RespuestaPublica | null> {
  if (!id || id.length > 128) return null;
  try {
    const doc = await getAdminDb().collection(RESPUESTAS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as Record<string, unknown>;
    if (!approvedPublic(data)) return null;
    const questionId = typeof data.questionId === "string" ? data.questionId.trim() : "";
    if (!questionId) return null;
    const code = typeof data.shortCode === "string" ? data.shortCode : "";
    const lat = typeof data.lat === "number" && Number.isFinite(data.lat) ? data.lat : null;
    const lng = typeof data.lng === "number" && Number.isFinite(data.lng) ? data.lng : null;
    return {
      id: doc.id,
      ...(isShortCode(code) ? { shortCode: code } : {}),
      questionId,
      mode: data.mode === "alguien" ? "alguien" : "tu",
      kind: data.kind === "voz" || data.kind === "foto" ? data.kind : "texto",
      contenido: typeof data.contenido === "string" ? data.contenido : "",
      alias: typeof data.alias === "string" ? data.alias : "",
      city: typeof data.city === "string" ? data.city : "",
      country: typeof data.country === "string" ? data.country : "",
      previewUrl: typeof data.publishedUrl === "string" ? data.publishedUrl : null,
      lat,
      lng,
    };
  } catch (err) {
    console.error("[getRespuestaPublicById]", err);
    return null;
  }
}
