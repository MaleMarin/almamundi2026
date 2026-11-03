import 'server-only';
import type { Firestore } from 'firebase-admin/firestore';
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
  };
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
