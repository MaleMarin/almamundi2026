import "server-only";

import { getAdminBucket } from "@/lib/firebase/admin";

/**
 * Los archivos publicados (published/**) son de lectura pública por las reglas de Storage.
 * Al archivar o rechazar algo ya publicado, cada archivo se mueve a ocultos/published/**, donde
 * nadie puede leerlo: el enlace guardado deja de abrir. Al restaurarlo vuelve a su lugar y los
 * enlaces de siempre funcionan otra vez (la ruta y el token no cambian).
 * El original privado (submissions/**) no se toca.
 */
const OCULTOS = "ocultos/";

type RefPublicada = { path: string; token: string };

const URL_PUBLICADA =
  /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?#\s"']+)\?alt=media(?:&token=([A-Za-z0-9-]+))?/g;

function recolectar(valor: unknown, salida: Map<string, string>, profundidad = 0): void {
  if (profundidad > 6 || valor == null) return;
  if (typeof valor === "string") {
    for (const m of valor.matchAll(URL_PUBLICADA)) {
      const path = decodeURIComponent(m[1]);
      if (path.startsWith("published/")) salida.set(path, m[2] ?? "");
    }
    return;
  }
  if (Array.isArray(valor)) {
    for (const v of valor) recolectar(v, salida, profundidad + 1);
    return;
  }
  if (typeof valor === "object") {
    for (const v of Object.values(valor as Record<string, unknown>)) recolectar(v, salida, profundidad + 1);
  }
}

export function archivosPublicadosDe(doc: Record<string, unknown>): RefPublicada[] {
  const mapa = new Map<string, string>();
  recolectar(doc, mapa);
  return [...mapa].map(([path, token]) => ({ path, token }));
}

async function aplicar(doc: Record<string, unknown>, visible: boolean): Promise<number> {
  const refs = archivosPublicadosDe(doc);
  if (refs.length === 0) return 0;
  const bucket = getAdminBucket();
  let n = 0;
  await Promise.all(
    refs.map(async ({ path }) => {
      const desde = visible ? `${OCULTOS}${path}` : path;
      const hacia = visible ? path : `${OCULTOS}${path}`;
      try {
        const [existe] = await bucket.file(desde).exists();
        if (!existe) return;
        await bucket.file(desde).move(hacia);
        n += 1;
      } catch (e) {
        console.warn("[published-media-visibility]", visible ? "mostrar" : "ocultar", path, e);
      }
    })
  );
  return n;
}

/** Cierra los enlaces públicos de los archivos de este documento. */
export function ocultarArchivosPublicados(doc: Record<string, unknown>): Promise<number> {
  return aplicar(doc, false);
}

/** Vuelve a abrir los enlaces públicos (mismo token que antes). */
export function mostrarArchivosPublicados(doc: Record<string, unknown>): Promise<number> {
  return aplicar(doc, true);
}
