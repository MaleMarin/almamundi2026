/**
 * lib/almamundi/queries.ts
 *
 * Funciones para consultar historias publicadas desde Firestore.
 * Úsalas en tus Server Components de Next.js.
 *
 * REQUISITO: tener estos índices compuestos en Firestore:
 *   stories: status + formato       (para /historias/[formato])
 *   stories: status + temas         (para /temas/[slug])
 *   stories: status + ubicacion.pais (para /mapa)
 *   stories: status + publishedAt   (para ordenar por fecha)
 *
 * Puedes crearlos en Firebase Console → Firestore → Indexes
 * o con el archivo firestore.indexes.json al final de este archivo.
 */

import 'server-only';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  FIRESTORE_COLLECTION,
  type StoryData,
  type Formato,
} from '@/lib/story-schema';

type QueryOptions = {
  limit?: number;
  orderBy?: 'publishedAt' | 'views' | 'resonances';
  direction?: 'asc' | 'desc';
};

// ─── Por formato ─────────────────────────────────────────────────────────────
/**
 * Trae todas las historias publicadas de un formato dado.
 * Usada en: /historias/videos, /historias/audios, etc.
 */
export async function getStoriesByFormato(
  formato: Formato,
  opts: QueryOptions = {}
): Promise<StoryData[]> {
  const { limit = 50, orderBy = 'publishedAt', direction = 'desc' } = opts;
  const db = getAdminDb();

  const snap = await db
    .collection(FIRESTORE_COLLECTION)
    .where('status', '==', 'published')
    .where('formato', '==', formato)
    .orderBy(orderBy, direction)
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoryData));
}

// ─── Por tema ─────────────────────────────────────────────────────────────────
/**
 * Trae todas las historias publicadas de un tema dado.
 * Usada en: /temas/[slug]
 */
export async function getStoriesByTema(
  temaSlug: string,
  opts: QueryOptions = {}
): Promise<StoryData[]> {
  const { limit = 50, orderBy = 'publishedAt', direction = 'desc' } = opts;
  const db = getAdminDb();

  const snap = await db
    .collection(FIRESTORE_COLLECTION)
    .where('status', '==', 'published')
    .where('temas', 'array-contains', temaSlug)
    .orderBy(orderBy, direction)
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoryData));
}

// ─── Pendientes de curación ───────────────────────────────────────────────────
/**
 * Trae las historias pendientes de revisión.
 * Usada en: /admin
 */
export async function getStoriesPendientes(limit = 30): Promise<StoryData[]> {
  const db = getAdminDb();

  const snap = await db
    .collection(FIRESTORE_COLLECTION)
    .where('status', 'in', ['pending', 'reviewing'])
    .orderBy('createdAt', 'asc') // más antiguas primero
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoryData));
}

// ─── Una historia por id ──────────────────────────────────────────────────────
export async function getStoryById(id: string): Promise<StoryData | null> {
  const db = getAdminDb();
  const snap = await db.collection(FIRESTORE_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as StoryData;
}

// ─── Para el mapa ─────────────────────────────────────────────────────────────
/**
 * Trae historias publicadas que tienen ubicación (lat/lng).
 * Usada en: /mapa
 */
export async function getStoriesParaMapa(limit = 200): Promise<StoryData[]> {
  const db = getAdminDb();
  // Firestore no tiene "where field exists", filtramos por pais o lat
  const snap = await db
    .collection(FIRESTORE_COLLECTION)
    .where('status', '==', 'published')
    .orderBy('publishedAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as StoryData))
    .filter((s) => s.ubicacion?.lat != null || (s.ubicacion?.pais ?? '').length > 0);
}

/*
──────────────────────────────────────────────────────────────────────────────
ÍNDICES REQUERIDOS EN FIRESTORE (firestore.indexes.json)
Pega esto en tu archivo firestore.indexes.json en la raíz del proyecto
y despliega con: firebase deploy --only firestore:indexes
──────────────────────────────────────────────────────────────────────────────

{
  "indexes": [
    {
      "collectionGroup": "stories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status",      "order": "ASCENDING" },
        { "fieldPath": "formato",     "order": "ASCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status",      "order": "ASCENDING" },
        { "fieldPath": "temas",       "arrayConfig": "CONTAINS" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status",      "order": "ASCENDING" },
        { "fieldPath": "createdAt",   "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status",      "order": "ASCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
*/
