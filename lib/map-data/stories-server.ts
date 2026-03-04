/**
 * Solo servidor: lee historias desde Firestore.
 * Usar solo en API routes o Server Components.
 * El cliente usa getStoryById / getStories desde stories.ts (sin Firebase).
 */
import 'server-only';
import type { StoryPoint } from '@/lib/map-data/stories';

export async function getStoriesAsync(): Promise<StoryPoint[]> {
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    const db = getAdminDb();

    const snap = await db
      .collection('stories')
      .orderBy('publishedAt', 'desc')
      .limit(200)
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
    console.error('[getStoriesAsync] Firestore error:', err);
    return [];
  }
}
