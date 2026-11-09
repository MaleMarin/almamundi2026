import "server-only";

import type { Firestore } from "firebase-admin/firestore";
import { getAdminBucket } from "@/lib/firebase/admin";

/** Subidas privadas sin terminar: se borran pasadas 48 horas si ningún envío las usa. */
export const HORAS_ABANDONO = 48;
/** Tope por pasada, para que un error nunca borre de más. */
const MAX_BORRADOS = 300;
const PREFIJO = "submissions/private/";
const RUTA_PRIVADA = /submissions(?:\/|%2F)private(?:\/|%2F)[^\s"'?#&]+/gi;

function rutasEn(valor: unknown, salida: Set<string>, profundidad = 0): void {
  if (profundidad > 8 || valor == null) return;
  if (typeof valor === "string") {
    if (!/submissions(\/|%2F)private/i.test(valor)) return;
    for (const m of valor.matchAll(RUTA_PRIVADA)) salida.add(decodeURIComponent(m[0]));
    return;
  }
  if (Array.isArray(valor)) {
    for (const v of valor) rutasEn(v, salida, profundidad + 1);
    return;
  }
  if (typeof valor === "object") {
    for (const v of Object.values(valor as Record<string, unknown>)) rutasEn(v, salida, profundidad + 1);
  }
}

/** Rutas privadas que algún documento todavía usa (envíos, respuestas, historias, preguntas). */
async function rutasEnUso(db: Firestore): Promise<Set<string>> {
  const usadas = new Set<string>();
  for (const coleccion of ["submissions", "respuestas", "stories", "preguntas_comunidad"]) {
    const snap = await db.collection(coleccion).get();
    for (const doc of snap.docs) rutasEn(doc.data(), usadas);
  }
  return usadas;
}

export type ResultadoLimpieza = {
  revisados: number;
  antiguos: number;
  enUso: number;
  borrados: string[];
  simulacion: boolean;
};

export async function limpiarSubidasAbandonadas(db: Firestore, simulacion: boolean): Promise<ResultadoLimpieza> {
  const limite = Date.now() - HORAS_ABANDONO * 3600_000;
  const [archivos] = await getAdminBucket().getFiles({ prefix: PREFIJO, autoPaginate: true });
  const antiguos = archivos.filter((f) => {
    const creado = Date.parse(String(f.metadata?.timeCreated ?? ""));
    return Number.isFinite(creado) && creado < limite;
  });
  const res: ResultadoLimpieza = { revisados: archivos.length, antiguos: antiguos.length, enUso: 0, borrados: [], simulacion };
  if (antiguos.length === 0) return res;
  const usadas = await rutasEnUso(db);
  for (const f of antiguos) {
    if (usadas.has(f.name)) {
      res.enUso += 1;
      continue;
    }
    if (res.borrados.length >= MAX_BORRADOS) break;
    if (!simulacion) await f.delete({ ignoreNotFound: true });
    res.borrados.push(f.name);
  }
  return res;
}
