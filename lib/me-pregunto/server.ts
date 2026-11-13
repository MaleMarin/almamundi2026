import 'server-only';
import type { Firestore } from 'firebase-admin/firestore';
import { anioDe } from '@/lib/anio-publico';
import {
  docIdDeMePregunta,
  esMePreguntaId,
  ME_PREGUNTAS_COLLECTION,
  ME_PREGUNTA_PREFIX,
  type MePreguntaPublica,
} from '@/lib/me-pregunto/shared';

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function mePreguntaPublica(docId: string, data: Record<string, unknown>): MePreguntaPublica {
  return {
    id: `${ME_PREGUNTA_PREFIX}${docId}`,
    texto: str(data.texto),
    alias: str(data.alias),
    city: str(data.city),
    country: str(data.country),
    lat: typeof data.lat === 'number' && Number.isFinite(data.lat) ? data.lat : null,
    lng: typeof data.lng === 'number' && Number.isFinite(data.lng) ? data.lng : null,
    anio: anioDe(data.createdAt),
  };
}

function toMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/** Tope de la lista pública de preguntas. */
export const ME_PREGUNTAS_TOPE = 80;

/** Consulta de las preguntas aprobadas: la misma para /api/me-pregunto y la página. Solo lectura. */
export function consultaMePreguntasAprobadas(db: Firestore) {
  return db.collection(ME_PREGUNTAS_COLLECTION).where('status', '==', 'approved');
}

/** Lista pública a partir de los documentos aprobados: más recientes primero, con tope y solo campos públicos. */
export function listaMePreguntasPublicas(
  docs: readonly { id: string; data: () => unknown }[]
): MePreguntaPublica[] {
  const items = docs.map((doc) => {
    const data = (doc.data() ?? {}) as Record<string, unknown>;
    return { item: mePreguntaPublica(doc.id, data), t: toMillis(data.approvedAt) || toMillis(data.createdAt) };
  });
  items.sort((a, b) => b.t - a.t);
  return items.slice(0, ME_PREGUNTAS_TOPE).map(({ item }) => item);
}

/** Pregunta aprobada por su id `mp-…`, o null. */
export async function mePreguntaAprobada(db: Firestore, id: unknown): Promise<MePreguntaPublica | null> {
  if (!esMePreguntaId(id)) return null;
  const snap = await db.collection(ME_PREGUNTAS_COLLECTION).doc(docIdDeMePregunta(id)).get();
  if (!snap.exists) return null;
  const data = (snap.data() ?? {}) as Record<string, unknown>;
  if (data.status !== 'approved') return null;
  return mePreguntaPublica(snap.id, data);
}
