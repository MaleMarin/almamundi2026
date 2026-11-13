import { preguntaHiloPorId, type PreguntaHilo } from "@/lib/hilos";
import { esMePreguntaId } from "@/lib/me-pregunto/shared";

/**
 * Qué vista de una pregunta (?p=id) es una página propia.
 * Una sola regla para la dirección canónica de la página y para el sitemap: no pueden contradecirse.
 */

export const RUTA_RESPUESTAS = "/respuestas-a-almamundi";
export const RUTA_PREGUNTAS_PERSONAS = "/preguntas-de-las-personas";

export type RutaDePreguntas = typeof RUTA_RESPUESTAS | typeof RUTA_PREGUNTAS_PERSONAS;

/** Dirección propia de una pregunta: solo `p`, sin `r` ni `responder`. */
export function rutaDePregunta(ruta: RutaDePreguntas, id: string): string {
  return `${ruta}?p=${encodeURIComponent(id)}`;
}

/** ¿Hay al menos una respuesta publicada de esa pregunta en la lista pública? */
export function tieneRespuestasPublicas(
  id: string,
  respuestas: readonly { questionId: string }[] | null | undefined
): boolean {
  return Boolean(respuestas?.some((item) => item.questionId === id));
}

/** Pregunta de las cintas con página propia: existe en el banco y ya tiene respuestas publicadas. */
export function preguntaHiloConPaginaPropia(
  id: string | null | undefined,
  respuestas: readonly { questionId: string }[] | null | undefined
): PreguntaHilo | null {
  const pregunta = preguntaHiloPorId(id);
  if (!pregunta) return null;
  return tieneRespuestasPublicas(pregunta.id, respuestas) ? pregunta : null;
}

/** Pregunta de una persona con página propia: aprobada y en la lista pública. */
export function preguntaDePersonaConPaginaPropia<T extends { id: string }>(
  id: string | null | undefined,
  preguntas: readonly T[] | null | undefined
): T | null {
  if (!esMePreguntaId(id)) return null;
  return preguntas?.find((p) => p.id === id) ?? null;
}
