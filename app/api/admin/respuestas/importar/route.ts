import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebase/admin";
import { PREGUNTAS_HILO } from "@/lib/hilos";
import { parseAlmaLocale } from "@/lib/i18n/locale";
import { RESPUESTAS_COLLECTION, RESPUESTA_TEXT_MAX } from "@/lib/respuestas/constants";
import { temasGuardados } from "@/lib/temas";

export const runtime = "nodejs";

const MAX_ITEMS = 100;
const VALID_QUESTIONS = new Set(PREGUNTAS_HILO.map((question) => question.id));

type ImportRow = {
  id: string;
  questionId: string;
  alias: string;
  city: string;
  country: string;
  contenido: string;
  locale: "es" | "pt" | "en";
  temas: string[];
  ejes: string[];
  editorialAge?: number;
  editorialOccupation?: string;
};

function line(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().replace(/[\r\n\t]+/g, " ").slice(0, max + 1) : "";
}

function parseRow(value: unknown): ImportRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = line(raw.id, 80);
  const questionId = line(raw.questionId, 64);
  const alias = line(raw.alias, 80);
  const city = line(raw.city, 120);
  const country = line(raw.country, 120);
  const contenido = typeof raw.contenido === "string" ? raw.contenido.trim() : "";
  const locale = raw.locale;
  const themes = temasGuardados(raw.temas);
  if (!/^[a-z0-9][a-z0-9-]{3,79}$/.test(id)) return null;
  if (!VALID_QUESTIONS.has(questionId)) return null;
  if (alias.length < 2 || alias.length > 80 || city.length < 2 || city.length > 120) return null;
  if (country.length < 2 || country.length > 120 || !contenido || contenido.length > RESPUESTA_TEXT_MAX) return null;
  if (locale !== "es" && locale !== "pt" && locale !== "en") return null;
  if (!themes) return null;
  const editorialAge = raw.editorialAge;
  if (editorialAge !== undefined && (!Number.isInteger(editorialAge) || Number(editorialAge) < 18 || Number(editorialAge) > 120)) return null;
  const editorialOccupation = raw.editorialOccupation === undefined ? "" : line(raw.editorialOccupation, 120);
  if (editorialOccupation.length > 120) return null;
  return {
    id, questionId, alias, city, country, contenido,
    locale, temas: themes.temas, ejes: themes.ejes,
    ...(typeof editorialAge === "number" ? { editorialAge } : {}),
    ...(editorialOccupation ? { editorialOccupation } : {}),
  };
}

function documentId(sourceId: string): string {
  return "ed" + createHash("sha256").update("almamundi-editorial-v1:" + sourceId).digest("hex").slice(0, 24);
}

/**
 * POST /api/admin/respuestas/importar
 * Solo admins autenticados; crea registros pendientes, nunca publica.
 * Usa ids estables para que repetir el mismo archivo no duplique ni sobrescriba las revisiones.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || body.version !== 1 || body.tipo !== "respuestas_editoriales" || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Archivo de importación inválido." }, { status: 400 });
  }
  if (body.items.length < 1 || body.items.length > MAX_ITEMS) {
    return NextResponse.json({ error: "El archivo debe contener entre 1 y 100 respuestas." }, { status: 400 });
  }

  const rows: ImportRow[] = [];
  const seen = new Set<string>();
  for (const [index, item] of body.items.entries()) {
    const row = parseRow(item);
    if (!row || seen.has(row.id)) {
      return NextResponse.json({ error: `Respuesta ${index + 1} inválida o duplicada en el archivo.` }, { status: 400 });
    }
    rows.push(row);
    seen.add(row.id);
  }

  try {
    const db = getAdminDb();
    const refs = rows.map((row) => db.collection(RESPUESTAS_COLLECTION).doc(documentId(row.id)));
    const previous = await db.getAll(...refs);
    const batch = db.batch();
    let imported = 0;
    for (let index = 0; index < rows.length; index += 1) {
      if (previous[index]?.exists) continue;
      const row = rows[index]!;
      batch.create(refs[index]!, {
        questionId: row.questionId,
        mode: "tu",
        kind: "texto",
        contenido: row.contenido,
        alias: row.alias,
        city: row.city,
        country: row.country,
        locale: parseAlmaLocale(row.locale),
        temas: row.temas,
        ejes: row.ejes,
        sourceType: "editorial",
        editorialSourceId: row.id,
        ...(row.editorialAge != null ? { editorialAge: row.editorialAge } : {}),
        ...(row.editorialOccupation ? { editorialOccupation: row.editorialOccupation } : {}),
        status: "pending",
        storagePath: null,
        publishedPath: null,
        publishedUrl: null,
        contentType: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      imported += 1;
    }
    if (imported > 0) {
      await batch.commit();
      await db.collection("editorial_audit_log").add({
        event: "import_editorial_answers",
        actorEmail: auth.email,
        imported,
        skippedExisting: rows.length - imported,
        createdAt: new Date().toISOString(),
      }).catch(() => undefined);
    }
    return NextResponse.json({ ok: true, imported, skippedExisting: rows.length - imported });
  } catch (error) {
    console.error("[admin/respuestas/importar]", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo completar la importación." }, { status: 500 });
  }
}
