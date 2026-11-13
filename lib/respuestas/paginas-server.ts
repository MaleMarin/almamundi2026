import "server-only";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { consultaMePreguntasAprobadas, listaMePreguntasPublicas } from "@/lib/me-pregunto/server";
import type { MePreguntaPublica } from "@/lib/me-pregunto/shared";
import { comoTarjetas, respuestasPublicasHilos, respuestasPublicasMePregunto } from "@/lib/respuestas/public-server";
import type { RespuestaTarjeta } from "@/lib/respuestas/public";

/**
 * Datos de las páginas internas de preguntas y respuestas, leídos en el servidor para que
 * el HTML traiga el contenido (los buscadores no pueden leer /api/*).
 * Mismas reglas de publicación que /api/respuestas/public y /api/me-pregunto, caché 60 s como ellas.
 * Solo lectura: aquí no se ubica ni se escribe nada.
 */

/** Lo que muestra la tarjeta de una pregunta de las personas (sin el punto del mapa). */
export type MePreguntaTarjeta = Pick<MePreguntaPublica, "id" | "texto" | "alias" | "city" | "country" | "anio">;

export type MePreguntoInicial = { preguntas: MePreguntaTarjeta[]; respuestas: RespuestaTarjeta[] };

const respuestasHilos = unstable_cache(
  async (): Promise<RespuestaTarjeta[]> => comoTarjetas(await respuestasPublicasHilos(getAdminDb())),
  ["pagina-respuestas-hilos"],
  { revalidate: 60 }
);

const mePregunto = unstable_cache(
  async (): Promise<MePreguntoInicial> => {
    const db = getAdminDb();
    const [snap, respuestas] = await Promise.all([
      consultaMePreguntasAprobadas(db).get(),
      respuestasPublicasMePregunto(db),
    ]);
    return {
      preguntas: listaMePreguntasPublicas(snap.docs).map((p) => ({
        id: p.id,
        texto: p.texto,
        alias: p.alias,
        city: p.city,
        country: p.country,
        ...(p.anio ? { anio: p.anio } : {}),
      })),
      respuestas: comoTarjetas(respuestas),
    };
  },
  ["pagina-me-pregunto"],
  { revalidate: 60 }
);

/** Null si no se pudo leer: la página carga entonces desde el navegador, como antes. */
export async function respuestasHilosParaPagina(): Promise<RespuestaTarjeta[] | null> {
  return respuestasHilos().catch((e) => {
    console.error("[pagina respuestas]", e instanceof Error ? e.message : "list");
    return null;
  });
}

export async function mePreguntoParaPagina(): Promise<MePreguntoInicial | null> {
  return mePregunto().catch((e) => {
    console.error("[pagina me-pregunto]", e instanceof Error ? e.message : "list");
    return null;
  });
}
