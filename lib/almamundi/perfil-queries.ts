/**
 * Queries de perfil de usuario: usuarios, muestras, historias guardadas y propias.
 * Usar en Server Components (getAdminDb). Para crear muestra desde cliente usar POST /api/muestras.
 */

import 'server-only';
import { getAdminDb } from '@/lib/firebase/admin';
import type { StoryData } from '@/lib/story-schema';
import { FIRESTORE_COLLECTION } from '@/lib/story-schema';

export type UserProfile = {
  uid: string;
  username: string;
  nombre: string;
  avatar?: string;
  frase?: string;
  bio?: string;
  ubicacion?: string;
  storiesCount: number;
  muestrasCount: number;
  guardadasCount: number;
  joinedAt: string;
  isPublic: boolean;
  ageGroup: 'adult' | 'minor';
};

export type Muestra = {
  id: string;
  autorId: string;
  autorNombre: string;
  titulo: string;
  sentido: string;
  portadaUrl?: string;
  historias: string[];
  historiasCount: number;
  createdAt: string;
  isPublic: boolean;
};

function docToUserProfile(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: id,
    username: typeof data.username === 'string' ? data.username : '',
    nombre: typeof data.nombre === 'string' ? data.nombre : '',
    avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
    frase: typeof data.frase === 'string' ? data.frase : undefined,
    bio: typeof data.bio === 'string' ? data.bio : undefined,
    ubicacion: typeof data.ubicacion === 'string' ? data.ubicacion : undefined,
    storiesCount: typeof data.storiesCount === 'number' ? data.storiesCount : 0,
    muestrasCount: typeof data.muestrasCount === 'number' ? data.muestrasCount : 0,
    guardadasCount: typeof data.guardadasCount === 'number' ? data.guardadasCount : 0,
    joinedAt: typeof data.joinedAt === 'string' ? data.joinedAt : '',
    isPublic: data.isPublic !== false,
    ageGroup: data.ageGroup === 'minor' ? 'minor' : 'adult',
  };
}

/**
 * Obtiene el perfil público de un usuario por username.
 */
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const db = getAdminDb();
  const snap = await db.collection('users').where('username', '==', username).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return docToUserProfile(doc.id, doc.data());
}

/**
 * Muestras curadas por un usuario.
 */
export async function getMuestrasByUser(uid: string, limit = 12): Promise<Muestra[]> {
  const db = getAdminDb();
  const snap = await db
    .collection('muestras')
    .where('autorId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      autorId: data.autorId ?? '',
      autorNombre: data.autorNombre ?? '',
      titulo: data.titulo ?? '',
      sentido: data.sentido ?? '',
      portadaUrl: data.portadaUrl,
      historias: Array.isArray(data.historias) ? data.historias : [],
      historiasCount: data.historiasCount ?? 0,
      createdAt: data.createdAt ?? '',
      isPublic: data.isPublic !== false,
    };
  });
}

/**
 * Historias guardadas por el usuario (subcolección guardadas → stories).
 */
export async function getHistoriasGuardadas(uid: string, limit = 24): Promise<StoryData[]> {
  const db = getAdminDb();
  const guardadasSnap = await db
    .collection('users')
    .doc(uid)
    .collection('guardadas')
    .orderBy('savedAt', 'desc')
    .limit(limit)
    .get();
  const storyIds = guardadasSnap.docs.map((d) => d.data().storyId).filter(Boolean);
  if (storyIds.length === 0) return [];
  const storiesRef = db.collection(FIRESTORE_COLLECTION);
  const chunks: string[][] = [];
  for (let i = 0; i < storyIds.length; i += 10) chunks.push(storyIds.slice(i, i + 10));
  const out: StoryData[] = [];
  for (const chunk of chunks) {
    const refs = chunk.map((id) => storiesRef.doc(id));
    const snaps = await db.getAll(...refs);
    for (const s of snaps) {
      if (s.exists) out.push({ id: s.id, ...s.data() } as StoryData);
    }
  }
  return out;
}

/**
 * Historias propias del usuario (autor.id === uid).
 */
export async function getHistoriasPropias(uid: string): Promise<StoryData[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(FIRESTORE_COLLECTION)
    .where('autor.id', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoryData));
}

/**
 * Crea una muestra y devuelve su id. Usar desde servidor (p. ej. API route).
 */
export async function createMuestra(
  data: Omit<Muestra, 'id' | 'createdAt'>
): Promise<string> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const ref = await db.collection('muestras').add({
    ...data,
    createdAt: now,
  });
  const userRef = db.collection('users').doc(data.autorId);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    const muestrasCount = (userSnap.data()?.muestrasCount ?? 0) + 1;
    await userRef.update({ muestrasCount, updatedAt: now });
  }
  return ref.id;
}
