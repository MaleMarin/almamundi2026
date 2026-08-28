import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import { storyJsonLdScript } from '@/lib/historias/story-json-ld';

/**
 * Bloque JSON-LD de una historia. Server Component.
 */
export async function StoryJsonLd({ id }: { id: string }) {
  const story = await getStoryByIdAsync(id).catch(() => null);
  if (!story) return null;
  const json = storyJsonLdScript(story);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
