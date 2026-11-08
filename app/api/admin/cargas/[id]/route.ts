import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizarEdicion, TIPOS_CARGA, type TipoCarga } from "@/lib/cargas/shared";
import { cargarContexto, cargasRef, itemDesdeDoc, publicarItem, revisarItems } from "@/lib/cargas/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Accion = "editar" | "descartar" | "restaurar" | "aprobar";

/**
 * PATCH /api/admin/cargas/[id]
 * - editar { tipo, datos }: corrige un registro por revisar.
 * - descartar / restaurar: lo saca o lo devuelve a la revisión.
 * - aprobar: lo publica en su sección (solo si no tiene errores ni es duplicado).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!/^[A-Za-z0-9]{8,40}$/.test(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { accion?: string; tipo?: unknown; datos?: unknown };
  const accion = body.accion as Accion | undefined;
  if (!accion || !["editar", "descartar", "restaurar", "aprobar"].includes(accion)) {
    return NextResponse.json({ error: "acción inválida" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = cargasRef(db).doc(id);

  try {
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "No existe este registro." }, { status: 404 });
    const item = itemDesdeDoc(snap.id, snap.data() ?? {});

    if (accion === "editar") {
      if (item.estado !== "revision") {
        return NextResponse.json({ error: "Este registro ya no se puede editar." }, { status: 409 });
      }
      const tipo = (TIPOS_CARGA as readonly string[]).includes(String(body.tipo))
        ? (body.tipo as TipoCarga)
        : item.tipo;
      if (!tipo) return NextResponse.json({ error: "Elige el tipo." }, { status: 400 });
      const datos = normalizarEdicion(
        tipo,
        body.datos && typeof body.datos === "object" ? (body.datos as Record<string, unknown>) : {}
      );
      await ref.update({
        tipo,
        datos,
        temasDesconocidos: [],
        idiomaDesconocido: "",
        updatedAt: Date.now(),
        editadoPor: auth.email,
      });
      return NextResponse.json({ ok: true });
    }

    if (accion === "descartar" || accion === "restaurar") {
      const desde = accion === "descartar" ? "revision" : "descartado";
      // Una publicación interrumpida (más de 3 minutos en «publicando») se puede devolver a revisión.
      const trabada =
        accion === "restaurar" && item.estado === "publicando" && Date.now() - Number(snap.get("updatedAt") ?? 0) > 180_000;
      if (item.estado !== desde && !trabada) {
        return NextResponse.json({ error: "Este registro cambió. Actualiza la lista." }, { status: 409 });
      }
      await ref.update({ estado: accion === "descartar" ? "descartado" : "revision", updatedAt: Date.now() });
      return NextResponse.json({ ok: true });
    }

    // aprobar: se revisa otra vez con los datos actuales del sitio.
    if (item.estado !== "revision") {
      return NextResponse.json({ error: "Este registro ya no está por revisar." }, { status: 409 });
    }
    const ctx = await cargarContexto(db);
    const otros = await cargasRef(db).where("estado", "==", "revision").get();
    const enRevision = otros.docs.map((doc) => itemDesdeDoc(doc.id, doc.data()));
    const [revisado] = revisarItems([item], ctx, enRevision.some((it) => it.id === item.id) ? enRevision : [...enRevision, item]);
    if (revisado.errores.length) {
      return NextResponse.json({ error: revisado.errores[0] }, { status: 400 });
    }
    if (revisado.duplicado) {
      return NextResponse.json({ error: revisado.duplicado }, { status: 409 });
    }

    // Bloqueo: dos clics seguidos no publican dos veces.
    const tomado = await db.runTransaction(async (tx) => {
      const actual = await tx.get(ref);
      if (actual.get("estado") !== "revision") return false;
      tx.update(ref, { estado: "publicando", updatedAt: Date.now() });
      return true;
    });
    if (!tomado) return NextResponse.json({ error: "Este registro ya se está publicando." }, { status: 409 });

    let resultado: Awaited<ReturnType<typeof publicarItem>>;
    try {
      resultado = await publicarItem(db, item, ctx, request);
    } catch (err) {
      console.error("[admin/cargas aprobar]", err instanceof Error ? err.message : "publish");
      resultado = { ok: false, error: "No se pudo publicar." };
    }
    if (!resultado.ok) {
      await ref.update({ estado: "revision", error: resultado.error, updatedAt: Date.now() });
      return NextResponse.json({ error: resultado.error }, { status: 422 });
    }
    await ref.update({
      estado: "publicado",
      error: null,
      publicadoEn: { coleccion: resultado.coleccion, id: resultado.id },
      publicadoAt: Date.now(),
      publicadoPor: auth.email,
      updatedAt: Date.now(),
    });
    return NextResponse.json({ ok: true, publicadoEn: { coleccion: resultado.coleccion, id: resultado.id } });
  } catch (e) {
    console.error("[admin/cargas PATCH]", e instanceof Error ? e.message : "update");
    // Si quedó tomado, se libera para poder reintentar.
    await ref
      .get()
      .then((s) => (s.get("estado") === "publicando" ? ref.update({ estado: "revision" }) : undefined))
      .catch(() => undefined);
    return NextResponse.json({ error: "No se pudo completar la acción." }, { status: 500 });
  }
}
