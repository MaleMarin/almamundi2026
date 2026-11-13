import "server-only";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { idsPreguntaBanco } from "@/lib/hilos";
import { getPublicStoryUrlsAsync } from "@/lib/map-data/stories-server";
import { consultaMePreguntasAprobadas, listaMePreguntasPublicas } from "@/lib/me-pregunto/server";
import {
  preguntaDePersonaConPaginaPropia,
  preguntaHiloConPaginaPropia,
  rutaDePregunta,
  RUTA_PREGUNTAS_PERSONAS,
  RUTA_RESPUESTAS,
  tieneRespuestasPublicas,
} from "@/lib/respuestas/paginas-indexables";
import {
  enTope,
  respuestasPublicasHilos,
  respuestasPublicasMePregunto,
  type RespuestaPublicaFechada,
} from "@/lib/respuestas/public-server";

/**
 * Contenido público que el sitemap lista además de las rutas fijas: historias y preguntas con respuestas.
 * Mismas lecturas y filtros que las páginas y las API públicas. Solo lectura.
 *
 * Se lee todo junto: si una lectura falla, falla el conjunto y no se publica una lista a medias.
 */

/** Cada cuánto se vuelve a leer Firestore para el sitemap. */
export const SITEMAP_REVALIDATE_SECONDS = 3600;

/** Ruta del sitio y fecha (ISO) de su último cambio conocido. */
export type EntradaSitemap = { path: string; lastModified: string | null };

export type ContenidoSitemap = { historias: EntradaSitemap[]; preguntas: EntradaSitemap[] };

/** Acepta Firestore Timestamp, milisegundos, ISO string, Date o nada. Devuelve ISO o null. */
export function fechaIso(value: unknown): string | null {
  if (!value) return null;
  let date: Date | null = null;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    try {
      date = (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number" && value > 0) {
    date = new Date(value);
  } else if (typeof value === "string" && value.trim()) {
    date = new Date(value);
  }
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

/** Fecha de la respuesta publicada más reciente de cada pregunta. */
function ultimaPublicacionPorPregunta(respuestas: RespuestaPublicaFechada[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of respuestas) {
    const t = item.publishedAt || item.createdAt;
    if (t > (map.get(item.questionId) ?? 0)) map.set(item.questionId, t);
  }
  return map;
}

/**
 * Preguntas con página propia y al menos una respuesta publicada.
 * Parte de las mismas listas que muestran las páginas (mismo orden y topes) y aplica la misma regla
 * que su dirección canónica: lo que entra aquí declara esta misma dirección como canónica.
 */
export async function leerPreguntasParaSitemap(): Promise<EntradaSitemap[]> {
  const db = getAdminDb();
  const [hilos, mePregunto, snapPreguntas] = await Promise.all([
    respuestasPublicasHilos(db),
    respuestasPublicasMePregunto(db),
    consultaMePreguntasAprobadas(db).get(),
  ]);
  const out: EntradaSitemap[] = [];

  const respuestasHilos = enTope(hilos);
  const fechasHilos = ultimaPublicacionPorPregunta(respuestasHilos);
  for (const id of idsPreguntaBanco()) {
    const pregunta = preguntaHiloConPaginaPropia(id, respuestasHilos);
    if (!pregunta) continue;
    out.push({ path: rutaDePregunta(RUTA_RESPUESTAS, pregunta.id), lastModified: fechaIso(fechasHilos.get(pregunta.id)) });
  }

  const preguntas = listaMePreguntasPublicas(snapPreguntas.docs);
  const respuestasPersonas = enTope(mePregunto);
  const fechasPersonas = ultimaPublicacionPorPregunta(respuestasPersonas);
  for (const { id } of preguntas) {
    const pregunta = preguntaDePersonaConPaginaPropia(id, preguntas);
    // En el sitemap, solo las que ya tienen respuestas publicadas.
    if (!pregunta || !tieneRespuestasPublicas(pregunta.id, respuestasPersonas)) continue;
    out.push({
      path: rutaDePregunta(RUTA_PREGUNTAS_PERSONAS, pregunta.id),
      lastModified: fechaIso(fechasPersonas.get(pregunta.id)),
    });
  }
  return out;
}

async function leerHistoriasParaSitemap(): Promise<EntradaSitemap[]> {
  // Dirección canónica de cada historia (las de texto, /texto), sin pasar por redirecciones.
  const items = await getPublicStoryUrlsAsync();
  return items.map((item) => ({
    path: item.path,
    lastModified: fechaIso(item.updatedAt) ?? fechaIso(item.publishedAt) ?? fechaIso(item.createdAt),
  }));
}

/**
 * Última lectura completa, en caché: se renueva cada hora. Si no hay ninguna lectura guardada
 * y Firestore falla, lanza el error (el sitemap responde con error en vez de publicarse incompleto).
 */
export const contenidoPublicoParaSitemap = unstable_cache(
  async (): Promise<ContenidoSitemap> => {
    const [historias, preguntas] = await Promise.all([leerHistoriasParaSitemap(), leerPreguntasParaSitemap()]);
    return { historias, preguntas };
  },
  ["sitemap-contenido-publico-v1"],
  { revalidate: SITEMAP_REVALIDATE_SECONDS }
);
