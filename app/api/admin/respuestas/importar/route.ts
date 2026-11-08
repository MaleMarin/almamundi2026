import "server-only";

import { createHash } from "node:crypto";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebase/admin";
import { stripHtml } from "@/lib/api/input-validation";
import { idPreguntaHilo } from "@/lib/hilos";
import { RESPUESTA_CONTACTS_COLLECTION, RESPUESTAS_COLLECTION, RESPUESTA_TEXT_MAX } from "@/lib/respuestas/constants";
import { temasGuardados } from "@/lib/temas";

export const runtime = "nodejs";

const MAX_ITEMS = 100;

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

type ImportIssue = { fila: number; campo: string; mensaje: string };
type Action = "new" | "update" | "unchanged" | "locked";

function cleaned(value: unknown): string {
  return typeof value === "string" ? stripHtml(value).trim() : "";
}

function parseRow(value: unknown, fila: number): { row: ImportRow | null; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { row: null, issues: [{ fila, campo: "fila", mensaje: "Debe ser un objeto JSON." }] };
  }
  const raw = value as Record<string, unknown>;
  const check = (field: string, max: number, min = 1) => {
    const result = cleaned(raw[field]);
    if (result.length < min || result.length > max || result.includes("\n")) {
      issues.push({ fila, campo: field, mensaje: `Debe tener entre ${min} y ${max} caracteres.` });
    }
    return result;
  };

  const id = check("id", 80, 4);
  const questionId = check("questionId", 64);
  const alias = check("alias", 80, 2);
  const city = check("city", 120, 2);
  const country = check("country", 120, 2);
  const contenido = cleaned(raw.contenido);
  if (!/^[a-z0-9][a-z0-9-]{3,79}$/.test(id)) {
    issues.push({ fila, campo: "id", mensaje: "Usa letras minúsculas, números y guiones." });
  }
  if (!idPreguntaHilo(questionId)) {
    issues.push({ fila, campo: "questionId", mensaje: "La pregunta no existe en AlmaMundi." });
  }
  if (!contenido || contenido.length > RESPUESTA_TEXT_MAX) {
    issues.push({ fila, campo: "contenido", mensaje: `El texto debe tener entre 1 y ${RESPUESTA_TEXT_MAX} caracteres.` });
  }
  const locale = raw.locale;
  if (locale !== "es" && locale !== "pt" && locale !== "en") {
    issues.push({ fila, campo: "locale", mensaje: "Idioma permitido: es, pt o en." });
  }
  const themes = temasGuardados(raw.temas);
  if (!themes) {
    issues.push({ fila, campo: "temas", mensaje: "Elige de 1 a 3 temas válidos." });
  }
  const age = raw.editorialAge;
  if (age !== undefined && (typeof age !== "number" || !Number.isInteger(age) || age < 18 || age > 120)) {
    issues.push({ fila, campo: "editorialAge", mensaje: "La edad debe ser un entero de 18 a 120 años." });
  }
  const occupation = raw.editorialOccupation === undefined ? "" : cleaned(raw.editorialOccupation);
  if (occupation.length > 120) {
    issues.push({ fila, campo: "editorialOccupation", mensaje: "Máximo 120 caracteres." });
  }
  if (issues.length || !themes || (locale !== "es" && locale !== "pt" && locale !== "en")) {
    return { row: null, issues };
  }
  return {
    row: {
      id, questionId, alias, city, country, contenido, locale,
      temas: themes.temas, ejes: themes.ejes,
      ...(typeof age === "number" ? { editorialAge: age } : {}),
      ...(occupation ? { editorialOccupation: occupation } : {}),
    },
    issues: [],
  };
}

function documentId(sourceId: string): string {
  return "ed" + createHash("sha256").update("almamundi-editorial-v1:" + sourceId).digest("hex").slice(0, 24);
}

function changed(existing: Record<string, unknown>, row: ImportRow): boolean {
  return existing.questionId !== row.questionId ||
    existing.alias !== row.alias || existing.city !== row.city ||
    existing.country !== row.country || existing.contenido !== row.contenido ||
    existing.locale !== row.locale ||
    JSON.stringify(existing.temas ?? []) !== JSON.stringify(row.temas);
}

function dataFor(row: ImportRow) {
  return {
    questionId: row.questionId,
    mode: "tu",
    kind: "texto",
    contenido: row.contenido,
    alias: row.alias,
    city: row.city,
    country: row.country,
    locale: row.locale,
    temas: row.temas,
    ejes: row.ejes,
    sourceType: "editorial",
    editorialSourceId: row.id,
  };
}

function privateMetadata(row: ImportRow) {
  return {
    ...(row.editorialAge !== undefined ? { editorialAge: row.editorialAge } : {}),
    ...(row.editorialOccupation ? { editorialOccupation: row.editorialOccupation } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function classify(data: Record<string, unknown> | undefined, row: ImportRow): Action {
  if (!data) return "new";
  if (data.sourceType !== "editorial" || data.status !== "pending") return "locked";
  return changed(data, row) ? "update" : "unchanged";
}

type Summary = { nuevos: number; actualizados: number; sinCambios: number; bloqueados: number };
function counts() : Summary {
  return { nuevos: 0, actualizados: 0, sinCambios: 0, bloqueados: 0 };
}
function tally(summary: Summary, action: Action) {
  if (action === "new") summary.nuevos += 1;
  else if (action === "update") summary.actualizados += 1;
  else if (action === "locked") summary.bloqueados += 1;
  else summary.sinCambios += 1;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || body.version !== 1 ||
      body.tipo !== "respuestas_editoriales" || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Archivo de importación inválido." }, { status: 400 });
  }
  if (body.items.length < 1 || body.items.length > MAX_ITEMS) {
    return NextResponse.json({ error: "El archivo debe contener entre 1 y 100 respuestas." }, { status: 400 });
  }

  const rows: ImportRow[] = [];
  const issues: ImportIssue[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < body.items.length; index += 1) {
    const parsed = parseRow(body.items[index], index + 1);
    issues.push(...parsed.issues);
    if (parsed.row) {
      if (seen.has(parsed.row.id)) {
        issues.push({ fila: index + 1, campo: "id", mensaje: "ID duplicado dentro del archivo." });
      } else {
        seen.add(parsed.row.id);
        rows.push(parsed.row);
      }
    }
  }
  if (issues.length) {
    return NextResponse.json({ error: "Hay errores en el archivo.", issues }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const refs = rows.map((row) => db.collection(RESPUESTAS_COLLECTION).doc(documentId(row.id)));
    const dryRun = body.preview === true;
    if (dryRun) {
      const previous = await db.getAll(...refs);
      const summary = counts();
      for (let i = 0; i < rows.length; i += 1) {
        tally(summary, classify(previous[i]?.exists ? previous[i]?.data() : undefined, rows[i]!));
      }
      return NextResponse.json({ ok: true, preview: true, summary, issues: [] });
    }

    // Lecturas y escrituras dentro de una misma transacción: nunca sobrescribir una aprobación concurrente.
    const summary = await db.runTransaction(async (transaction) => {
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
      const result = counts();
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i]!;
        const ref = refs[i] as DocumentReference;
        const existing = snapshots[i];
        const action = classify(existing?.exists ? existing?.data() : undefined, row);
        tally(result, action);
        if (action === "locked" || action === "unchanged") continue;
        if (action === "new") {
          transaction.create(ref, {
            ...dataFor(row), status: "pending", storagePath: null,
            publishedPath: null, publishedUrl: null, contentType: null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          transaction.update(ref, { ...dataFor(row), updatedAt: FieldValue.serverTimestamp() });
        }
        const contactRef = db.collection(RESPUESTA_CONTACTS_COLLECTION).doc(ref.id);
        transaction.set(contactRef, privateMetadata(row), { merge: true });
      }
      return result;
    });

    if (summary.nuevos + summary.actualizados > 0) {
      await db.collection("editorial_audit_log").add({
        actorEmail: auth.email, event: "import_editorial_answers",
        ...summary, createdAt: new Date().toISOString(),
      }).catch(() => undefined);
    }
    return NextResponse.json({ ok: true, preview: false, summary });
  } catch (error) {
    console.error("[admin/respuestas/importar]", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo completar la importación." }, { status: 500 });
  }
}
