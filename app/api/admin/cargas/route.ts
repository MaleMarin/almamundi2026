import "server-only";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { appendEditorialAuditLog } from "@/lib/editorial/audit";
import { getAdminDb } from "@/lib/firebase/admin";
import { CARGA_MAX_FILAS, normalizarFila, tipoDesde } from "@/lib/cargas/shared";
import { cargarContexto, cargasRef, itemDesdeDoc, revisarItems } from "@/lib/cargas/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET /api/admin/cargas?estado=revision|publicado|descartado — registros con errores y duplicados. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const estado = request.nextUrl.searchParams.get("estado") ?? "revision";
  if (!["revision", "publicado", "descartado"].includes(estado)) {
    return NextResponse.json({ error: "estado inválido" }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    const consultas = estado === "revision" ? ["revision", "publicando"] : [estado];
    const snaps = await Promise.all(consultas.map((e) => cargasRef(db).where("estado", "==", e).get()));
    const items = snaps.flatMap((snap) => snap.docs.map((doc) => itemDesdeDoc(doc.id, doc.data())));
    items.sort((a, b) => b.createdAt - a.createdAt || a.fila - b.fila);
    const [conteoRevision, conteoPublicado, conteoDescartado] = await Promise.all(
      ["revision", "publicado", "descartado"].map((e) =>
        cargasRef(db).where("estado", "==", e).count().get().then((s) => s.data().count)
      )
    );
    const lista = estado === "revision" ? items : items.slice(0, 300);
    const revisados = estado === "revision" ? revisarItems(lista, await cargarContexto(db)) : revisarItems(lista, {
      banco: new Map(),
      mePreguntas: new Map(),
      mePreguntasPorTexto: new Map(),
      huellasSitio: new Set(),
      personasSitio: new Map(),
    });
    return NextResponse.json({
      items: revisados,
      conteo: { revision: conteoRevision, publicado: conteoPublicado, descartado: conteoDescartado },
    });
  } catch (e) {
    console.error("[admin/cargas GET]", e instanceof Error ? e.message : "list");
    return NextResponse.json({ error: "No se pudo leer la lista." }, { status: 500 });
  }
}

/**
 * POST /api/admin/cargas { archivo, filas: [{ fila, tipo, datos }] }
 * Guarda los registros para revisión. No publica nada: solo se publica al aprobar cada registro.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json().catch(() => null)) as { archivo?: unknown; filas?: unknown } | null;
  const archivo = typeof body?.archivo === "string" ? body.archivo.replace(/[\r\n\t]+/g, " ").trim().slice(0, 160) : "";
  if (!archivo || !Array.isArray(body?.filas)) {
    return NextResponse.json({ error: "Archivo inválido." }, { status: 400 });
  }
  const filas = body.filas as Array<{ fila?: unknown; tipo?: unknown; datos?: unknown }>;
  if (filas.length < 1) return NextResponse.json({ error: "El archivo no tiene registros." }, { status: 400 });
  if (filas.length > CARGA_MAX_FILAS) {
    return NextResponse.json({ error: `Máximo ${CARGA_MAX_FILAS} registros por archivo.` }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    const cargaId = randomUUID();
    const ahora = Date.now();
    let total = 0;
    for (let i = 0; i < filas.length; i += 400) {
      const batch = db.batch();
      for (const [j, raw] of filas.slice(i, i + 400).entries()) {
        const datosRaw =
          raw && typeof raw.datos === "object" && raw.datos && !Array.isArray(raw.datos)
            ? (raw.datos as Record<string, unknown>)
            : {};
        const norm = normalizarFila(datosRaw, tipoDesde(raw?.tipo));
        const fila = typeof raw?.fila === "number" && Number.isFinite(raw.fila) ? raw.fila : i + j + 1;
        batch.set(cargasRef(db).doc(), {
          cargaId,
          archivo,
          fila,
          tipo: norm.tipo,
          datos: norm.datos,
          temasDesconocidos: norm.temasDesconocidos,
          idiomaDesconocido: norm.idiomaDesconocido,
          estado: "revision",
          creadoPor: auth.email,
          createdAt: ahora,
          updatedAt: ahora,
        });
        total += 1;
      }
      await batch.commit();
    }
    await appendEditorialAuditLog(db, auth.email, "carga_archivo", {
      note: archivo,
      extras: { cargaId, registros: total },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, cargaId, total });
  } catch (e) {
    console.error("[admin/cargas POST]", e instanceof Error ? e.message : "save");
    return NextResponse.json({ error: "No se pudo guardar el archivo." }, { status: 500 });
  }
}
