import { notFound } from 'next/navigation';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import type { StoryPoint } from '@/lib/map-data/stories';

/** Historia pública de Firestore o HTTP 404 (`notFound`). */
export async function requirePublicStory(id: string): Promise<StoryPoint> {
  const story = id.trim() ? await getStoryByIdAsync(id) : null;
  if (!story) notFound();
  return story;
}
