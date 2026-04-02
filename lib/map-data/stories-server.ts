/**
 * Solo servidor: lee historias desde Firestore.
 * Usar solo en API routes o Server Components.
 * El cliente usa getStoryById / getStories desde stories.ts (sin Firebase).
 *
 * Índice compuesto requerido: stories (status ASC, publishedAt DESC).
 * Está definido en firestore.indexes.json. Para crearlo en Firebase:
 *   firebase login --reauth   # si hace falta
 *   firebase deploy --only firestore:indexes
 */
import 'server-only';
import { getDemoStoryPointById } from '@/lib/historias/historias-demo-stories';
import type { StoryPoint } from '@/lib/map-data/stories';
import { isPublicStoryDocumentStatus } from '@/lib/story-public';

export async function getStoriesAsync(): Promise<StoryPoint[]> {
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    const db = getAdminDb();

    const snap = await db
      .collection('stories')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(30)
      .get();

    return snap.docs
      .map((doc) => {
        const d = doc.data();
        const lat = d.lat != null ? Number(d.lat) : null;
        const lng = d.lng != null ? Number(d.lng) : null;
        if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const title = (d.title as string) ?? 'Historia';
        const media = (d.media as Record<string, string | null>) ?? {};
        const text = (d.text as string) ?? '';
        const publishedAt = d.publishedAt && typeof (d.publishedAt as { toDate?: () => Date }).toDate === 'function'
          ? (d.publishedAt as { toDate: () => Date }).toDate().toISOString()
          : undefined;
        return {
          id: doc.id,
          lat,
          lng,
          label: title,
          authorName: (d.authorName as string) ?? undefined,
          title,
          description: (d.excerpt as string) ?? (text ? String(text).slice(0, 200) : undefined),
          city: (d.city as string) ?? undefined,
          country: (d.country as string) ?? undefined,
          topic: (d.tags as { themes?: string[] })?.themes?.[0] ?? (d.topic as string) ?? undefined,
          audioUrl: media.audioUrl ?? undefined,
          videoUrl: media.videoUrl ?? undefined,
          body: text || undefined,
          hasText: Boolean(text),
          hasAudio: Boolean(media.audioUrl),
          hasVideo: Boolean(media.videoUrl),
          publishedAt,
          weatherTags: (d.weatherTags as string[] | undefined) ?? undefined,
        } as StoryPoint;
      })
      .filter((s): s is StoryPoint => s !== null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isDecoder = /DECODER routines::\s*unsupported|1E08010C/i.test(msg);
    const isIndex = /requires an index|FAILED_PRECONDITION/i.test(msg);
    if (isDecoder && typeof globalThis !== 'undefined') {
      (globalThis as { _firestoreDecoderLogged?: boolean })._firestoreDecoderLogged ??= false;
      if (!(globalThis as { _firestoreDecoderLogged?: boolean })._firestoreDecoderLogged) {
        (globalThis as { _firestoreDecoderLogged?: boolean })._firestoreDecoderLogged = true;
        console.warn('[getStoriesAsync] Firestore DECODER error (Node/OpenSSL). Usa Node 18 o 20 LTS. Historias en local: [].');
      }
    } else if (isIndex && typeof globalThis !== 'undefined') {
      (globalThis as { _firestoreIndexLogged?: boolean })._firestoreIndexLogged ??= false;
      if (!(globalThis as { _firestoreIndexLogged?: boolean })._firestoreIndexLogged) {
        (globalThis as { _firestoreIndexLogged?: boolean })._firestoreIndexLogged = true;
        console.warn('[getStoriesAsync] Firestore: falta el índice compuesto (status + publishedAt). Ejecuta: firebase deploy --only firestore:indexes');
      }
    } else {
      console.error('[getStoriesAsync] Firestore error:', err);
    }
    return [];
  }
}

/** Obtiene una historia por id solo si está en estado público (`published`). */
export async function getStoryByIdAsync(id: string): Promise<StoryPoint | null> {
  if (!id) return null;
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    const db = getAdminDb();
    const doc = await db.collection('stories').doc(id).get();
    if (!doc.exists) return getDemoStoryPointById(id);
    const d = doc.data()!;
    if (!isPublicStoryDocumentStatus(d.status)) return null;
    const lat = d.lat != null ? Number(d.lat) : null;
    const lng = d.lng != null ? Number(d.lng) : null;
    const title = (d.title as string) ?? 'Historia';
    const media = (d.media as Record<string, string | null>) ?? {};
    const text = (d.text as string) ?? '';
    const publishedAt = d.publishedAt && typeof (d.publishedAt as { toDate?: () => Date }).toDate === 'function'
      ? (d.publishedAt as { toDate: () => Date }).toDate().toISOString()
      : undefined;
    return {
      id: doc.id,
      lat: lat ?? 0,
      lng: lng ?? 0,
      label: title,
      authorName: (d.authorName as string) ?? undefined,
      title,
      description: (d.excerpt as string) ?? (text ? String(text).slice(0, 200) : undefined),
      city: (d.city as string) ?? undefined,
      country: (d.country as string) ?? undefined,
      topic: (d.tags as { themes?: string[] })?.themes?.[0] ?? (d.topic as string) ?? undefined,
      audioUrl: media.audioUrl ?? undefined,
      videoUrl: media.videoUrl ?? undefined,
      body: text || undefined,
      hasText: Boolean(text),
      hasAudio: Boolean(media.audioUrl),
      hasVideo: Boolean(media.videoUrl),
      publishedAt,
      imageUrl: media.imageUrl ?? undefined,
      weatherTags: (d.weatherTags as string[] | undefined) ?? undefined,
    } as StoryPoint;
  } catch (err) {
    console.error('[getStoryByIdAsync]', err);
    const demo = getDemoStoryPointById(id);
    if (demo) return demo;
    return null;
  }
}
