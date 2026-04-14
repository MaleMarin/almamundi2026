import type { Metadata } from 'next';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';

/**
 * Metadata OG/Twitter para rutas `/historias/[id]/*` (Server Components).
 */
export async function buildHistoriaStoryMetadata(id: string): Promise<Metadata> {
  const story = await getStoryByIdAsync(id).catch(() => null);
  if (!story) {
    return {
      title: 'Historia · AlmaMundi',
      description: 'Una historia en AlmaMundi, el mapa de historias humanas.',
    };
  }

  const title = story.title ? `${story.title} · AlmaMundi` : 'AlmaMundi';

  const description =
    story.quote ||
    story.excerpt ||
    story.description ||
    'Una historia en AlmaMundi, el mapa de historias humanas.';

  const image = story.thumbnailUrl || story.imageUrl || null;

  return {
    title,
    description,
    openGraph: {
      title: story.title ?? 'AlmaMundi',
      description,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: story.title ?? 'AlmaMundi' }]
        : [],
      type: 'article',
      locale: 'es_CL',
      siteName: 'AlmaMundi',
      publishedTime: story.publishedAt ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title ?? 'AlmaMundi',
      description,
      images: image ? [image] : [],
    },
  };
}
