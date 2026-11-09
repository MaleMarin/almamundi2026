import "server-only";
import { NextRequest } from "next/server";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { PATCH as aprobarHistoriaRuta } from "@/app/api/admin/stories/[id]/route";
import { PATCH as aprobarRespuestaRuta } from "@/app/api/admin/respuestas/[id]/route";
import { PATCH as aprobarPreguntaRuta } from "@/app/api/admin/me-pregunto/[id]/route";
import { MAX_DESCRIPCION } from "@/lib/api/input-validation";
import { cintasSinModelo, textoParaCintas } from "@/lib/cintas-v2/sin-modelo";
import { idPreguntaHilo, idsPreguntaBanco, textoPreguntaHilo } from "@/lib/hilos";
import { resolveQuestionId } from "@/lib/pregunta-semana";
import { geocodePublicPlace } from "@/lib/respuestas/geocode";
import { RESPUESTAS_COLLECTION } from "@/lib/respuestas/constants";
import {
  esMePreguntaId,
  ME_PREGUNTAS_COLLECTION,
  ME_PREGUNTA_PREFIX,
} from "@/lib/me-pregunto/shared";
import {
  CARGAS_COLLECTION,
  ETIQUETA_TIPO,
  erroresDeCampos,
  huellaContenido,
  normalizarTexto,
  type DatosCarga,
  type EstadoCarga,
  type TipoCarga,
} from "@/lib/cargas/shared";

const LOCALES = ["es", "pt", "en"] as const;

export type ItemCarga = {
  id: string;
  cargaId: string;
  archivo: string;
  fila: number;
  tipo: TipoCarga | null;
  datos: DatosCarga;
  temasDesconocidos: string[];
  idiomaDesconocido: string;
  estado: EstadoCarga;
  createdAt: number;
  updatedAt: number;
  publicadoEn?: { coleccion: string; id: string } | null;
  publicadoAt?: number | null;
  error?: string | null;
};

export type ItemRevisado = ItemCarga & {
  errores: string[];
  duplicado: string | null;
  /** Aviso que no bloquea: misma persona (nombre y lugar) que otro contenido. Ana decide. */
  aviso: string | null;
  /** Texto de la pregunta vinculada (respuestas). */
  preguntaVinculada: string | null;
};

type PreguntaResuelta = {
  questionId: string;
  texto: string;
  mePregunta?: { texto: string; alias: string; city: string; country: string };
};

export type Contexto = {
  banco: Map<string, string>;
  mePreguntas: Map<string, { id: string; texto: string; alias: string; city: string; country: string }>;
  mePreguntasPorTexto: Map<string, string>;
  huellasSitio: Set<string>;
  /** Nombre y lugar de quienes ya tienen contenido publicado o pendiente, con su tipo. */
  personasSitio: Map<string, string>;
};

/** Misma persona: nombre, ciudad y país, sin tildes ni mayúsculas. */
function clavePersona(alias: string, ciudad: string, pais: string): string {
  const n = (v: string) => normalizarTexto(v);
  return alias.trim() ? `${n(alias)}|${n(ciudad)}|${n(pais)}` : "";
}

function txt(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function itemDesdeDoc(id: string, data: Record<string, unknown>): ItemCarga {
  const datos = (data.datos ?? {}) as Partial<DatosCarga>;
  const tipo = data.tipo === "historia" || data.tipo === "respuesta" || data.tipo === "pregunta" ? data.tipo : null;
  const pub = data.publicadoEn as { coleccion?: unknown; id?: unknown } | undefined;
  return {
    id,
    cargaId: txt(data.cargaId),
    archivo: txt(data.archivo),
    fila: typeof data.fila === "number" ? data.fila : 0,
    tipo,
    datos: {
      titulo: txt(datos.titulo),
      texto: txt(datos.texto),
      pregunta: txt(datos.pregunta),
      alias: txt(datos.alias),
      ciudad: txt(datos.ciudad),
      pais: txt(datos.pais),
      temas: Array.isArray(datos.temas) ? datos.temas.filter((t): t is string => typeof t === "string") : [],
      idioma: datos.idioma === "pt" || datos.idioma === "en" ? datos.idioma : "es",
    },
    temasDesconocidos: Array.isArray(data.temasDesconocidos)
      ? data.temasDesconocidos.filter((t): t is string => typeof t === "string")
      : [],
    idiomaDesconocido: txt(data.idiomaDesconocido),
    estado: (["revision", "publicando", "publicado", "descartado"] as const).includes(data.estado as EstadoCarga)
      ? (data.estado as EstadoCarga)
      : "revision",
    createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
    publicadoEn: pub && typeof pub.id === "string" ? { coleccion: txt(pub.coleccion), id: pub.id } : null,
    publicadoAt: typeof data.publicadoAt === "number" ? data.publicadoAt : null,
    error: typeof data.error === "string" ? data.error : null,
  };
}

/** Lo que ya existe en el sitio: preguntas del banco, preguntas de las personas y huellas de contenido. */
export async function cargarContexto(db: Firestore): Promise<Contexto> {
  const banco = new Map<string, string>();
  for (const id of idsPreguntaBanco()) {
    for (const locale of LOCALES) {
      const texto = textoPreguntaHilo(id, locale);
      if (texto) banco.set(normalizarTexto(texto), id);
    }
  }
  const [preguntas, historias, envios, respuestas] = await Promise.all([
    db.collection(ME_PREGUNTAS_COLLECTION).select("texto", "status", "alias", "city", "country").get(),
    db.collection("stories").select("text", "authorName", "city", "country", "status").get(),
    db.collection("submissions").where("status", "==", "pending").select("payload", "alias", "placeLabel", "countryLabel").get(),
    db.collection(RESPUESTAS_COLLECTION).select("questionId", "contenido", "status", "alias", "city", "country").get(),
  ]);
  const mePreguntas: Contexto["mePreguntas"] = new Map();
  const mePreguntasPorTexto = new Map<string, string>();
  const huellasSitio = new Set<string>();
  const personasSitio = new Map<string, string>();
  const persona = (alias: unknown, ciudad: unknown, pais: unknown, tipo: string) => {
    const k = clavePersona(txt(alias), txt(ciudad), txt(pais));
    if (k && !personasSitio.has(k)) personasSitio.set(k, tipo);
  };
  for (const doc of preguntas.docs) {
    const d = doc.data();
    if (d.status !== "rejected") persona(d.alias, d.city, d.country, "una pregunta");
    const texto = txt(d.texto);
    if (d.status !== "rejected") huellasSitio.add(huellaContenido("pregunta", texto));
    if (d.status !== "approved") continue;
    const id = `${ME_PREGUNTA_PREFIX}${doc.id}`;
    if (!esMePreguntaId(id)) continue;
    mePreguntas.set(id, { id, texto, alias: txt(d.alias), city: txt(d.city), country: txt(d.country) });
    mePreguntasPorTexto.set(normalizarTexto(texto), id);
  }
  for (const key of banco.keys()) huellasSitio.add(`pregunta|${key}`);
  for (const doc of historias.docs) {
    huellasSitio.add(huellaContenido("historia", txt(doc.get("text"))));
    if (doc.get("status") !== "rejected") persona(doc.get("authorName"), doc.get("city"), doc.get("country"), "una historia");
  }
  for (const doc of envios.docs) {
    const payload = doc.get("payload") as { textBody?: unknown } | undefined;
    huellasSitio.add(huellaContenido("historia", txt(payload?.textBody)));
    persona(doc.get("alias"), doc.get("placeLabel"), doc.get("countryLabel"), "una historia pendiente");
  }
  for (const doc of respuestas.docs) {
    if (doc.get("status") === "rejected") continue;
    huellasSitio.add(huellaContenido("respuesta", txt(doc.get("contenido")), txt(doc.get("questionId"))));
    persona(doc.get("alias"), doc.get("city"), doc.get("country"), "una respuesta");
  }
  huellasSitio.delete("");
  return { banco, mePreguntas, mePreguntasPorTexto, huellasSitio, personasSitio };
}

/** La pregunta de una respuesta: por identificador o por su texto, igual que el formulario del sitio. */
export function resolverPregunta(valor: string, ctx: Contexto): PreguntaResuelta | null {
  const v = valor.trim();
  if (!v) return null;
  const mp = esMePreguntaId(v) ? ctx.mePreguntas.get(v) : undefined;
  if (mp) return { questionId: mp.id, texto: mp.texto, mePregunta: mp };
  const porId = resolveQuestionId(v) ?? idPreguntaHilo(v);
  if (porId) return { questionId: porId, texto: textoPreguntaHilo(porId, "es") ?? porId };
  const clave = normalizarTexto(v);
  const delBanco = ctx.banco.get(clave);
  if (delBanco) return { questionId: delBanco, texto: textoPreguntaHilo(delBanco, "es") ?? v };
  const mpId = ctx.mePreguntasPorTexto.get(clave);
  const mp2 = mpId ? ctx.mePreguntas.get(mpId) : undefined;
  if (mp2) return { questionId: mp2.id, texto: mp2.texto, mePregunta: mp2 };
  return null;
}

function huellaItem(item: ItemCarga, ctx: Contexto): string {
  if (!item.tipo) return "";
  if (item.tipo === "respuesta") {
    const p = resolverPregunta(item.datos.pregunta, ctx);
    return huellaContenido("respuesta", item.datos.texto, p?.questionId ?? `?${normalizarTexto(item.datos.pregunta)}`);
  }
  return huellaContenido(item.tipo, item.datos.texto);
}

/** Errores y duplicados de cada registro, contra el sitio y contra los demás registros por revisar. */
export function revisarItems(items: ItemCarga[], ctx: Contexto, enRevision: ItemCarga[] = items): ItemRevisado[] {
  const pendientesPorTexto = new Map<string, ItemCarga>();
  for (const it of enRevision) {
    if (it.tipo === "pregunta" && it.estado === "revision") {
      pendientesPorTexto.set(normalizarTexto(it.datos.texto), it);
    }
  }
  const primeraPorHuella = new Map<string, ItemCarga>();
  const primeraPorPersona = new Map<string, ItemCarga>();
  const ordenados = [...enRevision].sort((a, b) => a.createdAt - b.createdAt || a.fila - b.fila);
  for (const it of ordenados) {
    if (it.estado !== "revision") continue;
    const h = huellaItem(it, ctx);
    if (h && !primeraPorHuella.has(h)) primeraPorHuella.set(h, it);
    const kp = clavePersona(it.datos.alias, it.datos.ciudad, it.datos.pais);
    if (kp && !primeraPorPersona.has(kp)) primeraPorPersona.set(kp, it);
  }
  return items.map((item) => {
    if (item.estado !== "revision") {
      return { ...item, errores: [], duplicado: null, aviso: null, preguntaVinculada: null };
    }
    const errores = erroresDeCampos(item.tipo, item.datos, item.temasDesconocidos, item.idiomaDesconocido);
    let preguntaVinculada: string | null = null;
    if (item.tipo === "respuesta" && item.datos.pregunta) {
      const p = resolverPregunta(item.datos.pregunta, ctx);
      if (p) preguntaVinculada = p.texto;
      else if (pendientesPorTexto.has(normalizarTexto(item.datos.pregunta))) {
        errores.push("Esta pregunta viene en la carga: apruébala primero y después esta respuesta.");
      } else {
        errores.push("No encontramos esta pregunta en AlmaMundi. Escríbela igual que en el sitio o usa su identificador.");
      }
    }
    let duplicado: string | null = null;
    const h = huellaItem(item, ctx);
    if (h && ctx.huellasSitio.has(h)) {
      duplicado = `Esta ${ETIQUETA_TIPO[item.tipo!].toLowerCase()} ya existe en el sitio.`;
    } else if (h) {
      const primera = primeraPorHuella.get(h);
      if (primera && primera.id !== item.id) {
        duplicado = `Repetida: es igual a la fila ${primera.fila} de «${primera.archivo}».`;
      }
    }
    let aviso: string | null = null;
    const kp = clavePersona(item.datos.alias, item.datos.ciudad, item.datos.pais);
    if (kp && !duplicado) {
      const enSitio = ctx.personasSitio.get(kp);
      const otra = primeraPorPersona.get(kp);
      if (enSitio) aviso = `${item.datos.alias} (${item.datos.ciudad}) ya tiene ${enSitio} en AlmaMundi. Revisa si es la misma persona.`;
      else if (otra && otra.id !== item.id) aviso = `Mismo nombre y lugar que la fila ${otra.fila} de «${otra.archivo}». Revisa si es la misma persona.`;
    }
    return { ...item, errores, duplicado, aviso, preguntaVinculada };
  });
}

/* ───────────── Publicación ───────────── */

/**
 * ¿Este registro ya llegó al sitio? Sirve si una publicación terminó pero no alcanzó a anotarse
 * (corte de red o del servidor): así no queda como pendiente ni se publica dos veces.
 */
export async function buscarPublicado(
  db: Firestore,
  item: ItemCarga
): Promise<{ coleccion: string; id: string } | null> {
  const porOrigen = (coleccion: string) =>
    db.collection(coleccion).where("origenCarga.itemId", "==", item.id).limit(1).get();
  if (item.tipo === "historia") {
    const snap = await porOrigen("submissions");
    const storyId = snap.empty ? "" : txt(snap.docs[0].get("publishedStoryId"));
    return storyId ? { coleccion: "stories", id: storyId } : null;
  }
  const coleccion = item.tipo === "respuesta" ? RESPUESTAS_COLLECTION : ME_PREGUNTAS_COLLECTION;
  const snap = await porOrigen(coleccion);
  if (snap.empty || snap.docs[0].get("status") !== "approved") return null;
  return { coleccion, id: snap.docs[0].id };
}

type Resultado = { ok: true; coleccion: string; id: string } | { ok: false; error: string };

async function llamarAprobacion(
  ruta: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>,
  request: Request,
  path: string,
  id: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; error: string }> {
  const req = new NextRequest(new URL(`${path}/${id}`, request.url), {
    method: "PATCH",
    headers: { authorization: request.headers.get("authorization") ?? "", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await ruta(req, { params: Promise.resolve({ id }) });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; code?: string };
  if (res.ok && data.ok) return { ok: true, error: "" };
  if (data.code === "location_not_found") {
    return { ok: false, error: "No encontramos la ubicación. Revisa la ciudad y el país." };
  }
  return { ok: false, error: data.error || "No se pudo publicar." };
}

/**
 * Publica un registro aprobado por Ana. Crea el envío igual que el formulario del sitio y lo aprueba con
 * la misma ruta del admin (temas, ubicación con desplazamiento, código corto, cintas y registro editorial).
 * Si la aprobación falla, se borra el envío creado: nada queda a medias en el sitio.
 */
export async function publicarItem(
  db: Firestore,
  item: ItemCarga,
  ctx: Contexto,
  request: Request
): Promise<Resultado> {
  const d = item.datos;
  const origen = { itemId: item.id, cargaId: item.cargaId };
  if (item.tipo === "historia") {
    const ref = db.collection("submissions").doc();
    let huellaUnits: { hex: string; width: number }[] = [];
    try {
      huellaUnits = cintasSinModelo({
        id: ref.id,
        texto: textoParaCintas({ storyTitle: d.titulo, textBody: d.texto }),
        locale: d.idioma,
      });
    } catch {
      huellaUnits = [];
    }
    await ref.set({
      type: "texto",
      status: "pending",
      storyTitle: d.titulo,
      alias: d.alias,
      email: "",
      themeId: "",
      date: "",
      placeLabel: d.ciudad,
      countryLabel: d.pais,
      context: d.texto.slice(0, MAX_DESCRIPCION),
      payload: { textBody: d.texto },
      locale: d.idioma,
      createdAt: Date.now(),
      ...(huellaUnits.length ? { huellaUnits } : {}),
      malwareScanStatus: "skipped",
      origenCarga: origen,
    });
    const r = await llamarAprobacion(aprobarHistoriaRuta, request, "/api/admin/stories", ref.id, {
      action: "approve",
      temas: d.temas,
    });
    const after = await ref.get();
    const storyId = txt(after.get("publishedStoryId"));
    if (!r.ok || !storyId) {
      if (after.exists && after.get("status") === "pending") await ref.delete().catch(() => undefined);
      return { ok: false, error: r.error || "No se pudo publicar." };
    }
    return { ok: true, coleccion: "stories", id: storyId };
  }

  if (item.tipo === "respuesta") {
    const pregunta = resolverPregunta(d.pregunta, ctx);
    if (!pregunta) return { ok: false, error: "No encontramos la pregunta en AlmaMundi." };
    const ref = db.collection(RESPUESTAS_COLLECTION).doc();
    await ref.set({
      questionId: pregunta.questionId,
      ...(pregunta.mePregunta
        ? {
            capa: "me-pregunto",
            questionText: pregunta.mePregunta.texto,
            askerAlias: pregunta.mePregunta.alias,
            askerCity: pregunta.mePregunta.city,
            askerCountry: pregunta.mePregunta.country,
          }
        : {}),
      mode: "tu",
      kind: "texto",
      contenido: d.texto,
      storagePath: null,
      publishedPath: null,
      publishedUrl: null,
      contentType: null,
      alias: d.alias,
      city: d.ciudad,
      country: d.pais,
      status: "pending",
      locale: d.idioma,
      origenCarga: origen,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const r = await llamarAprobacion(aprobarRespuestaRuta, request, "/api/admin/respuestas", ref.id, {
      action: "approve",
      temas: d.temas,
    });
    if (!r.ok) {
      const after = await ref.get();
      if (after.exists && after.get("status") === "pending") await ref.delete().catch(() => undefined);
      return { ok: false, error: r.error };
    }
    return { ok: true, coleccion: RESPUESTAS_COLLECTION, id: ref.id };
  }

  if (item.tipo === "pregunta") {
    const punto = await geocodePublicPlace(d.ciudad, d.pais);
    if (!punto) return { ok: false, error: "No encontramos la ubicación. Revisa la ciudad y el país." };
    const ref = db.collection(ME_PREGUNTAS_COLLECTION).doc();
    await ref.set({
      texto: d.texto,
      alias: d.alias,
      city: d.ciudad,
      country: d.pais,
      locale: d.idioma,
      status: "pending",
      lat: punto.lat,
      lng: punto.lng,
      origenCarga: origen,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const r = await llamarAprobacion(aprobarPreguntaRuta, request, "/api/admin/me-pregunto", ref.id, {
      action: "approve",
    });
    if (!r.ok) {
      const after = await ref.get();
      if (after.exists && after.get("status") === "pending") await ref.delete().catch(() => undefined);
      return { ok: false, error: r.error };
    }
    return { ok: true, coleccion: ME_PREGUNTAS_COLLECTION, id: ref.id };
  }

  return { ok: false, error: "Tipo no reconocido." };
}

export function cargasRef(db: Firestore) {
  return db.collection(CARGAS_COLLECTION);
}
