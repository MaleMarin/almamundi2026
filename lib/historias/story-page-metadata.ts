import type { Metadata } from 'next';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origin';

const SITE_OG_IMAGE = '/og-image.png';
const FALLBACK_DESCRIPTION = 'Una historia en AlmaMundi, el mapa de historias humanas.';

function descriptionFromStory(story: {
  quote?: string;
  excerpt?: string;
  description?: string;
  body?: string;
}): string {
  const raw =
    story.quote ||
    story.excerpt ||
    story.description ||
    (typeof story.body === 'string' ? story.body : '');
  const text = String(raw).replace(/\s+/g, ' ').trim();
  if (!text) return FALLBACK_DESCRIPTION;
  return text.slice(0, 160);
}

function ogImageForStory(story: {
  title?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
}): { url: string; width: number; height: number; alt: string } {
  const alt = story.title?.trim() || 'AlmaMundi';
  const img = (story.thumbnailUrl || story.imageUrl || '').trim();
  if (img && (/^https?:\/\//i.test(img) || img.startsWith('/'))) {
    return { url: img, width: 1200, height: 630, alt };
  }
  return {
    url: SITE_OG_IMAGE,
    width: 1200,
    height: 630,
    alt: 'AlmaMundi, historias de vida en video, audio, escrito y foto',
  };
}

/**
 * Metadata OG/Twitter para rutas `/historias/[id]/*` (Server Components).
 * Si no hay portada, usa `/og-image.png`.
 */
export async function buildHistoriaStoryMetadata(id: string): Promise<Metadata> {
  const story = await getStoryByIdAsync(id).catch(() => null);
  const metadataBase = new URL(PUBLIC_SITE_ORIGIN);
  if (!story) {
    return {
      metadataBase,
      title: { absolute: '404 · AlmaMundi' },
      description: FALLBACK_DESCRIPTION,
      robots: { index: false, follow: false },
    };
  }

  const titulo = (story.title ?? story.label ?? 'Historia').trim() || 'Historia';
  const description = descriptionFromStory(story);
  const image = ogImageForStory({ title: titulo, thumbnailUrl: story.thumbnailUrl, imageUrl: story.imageUrl });

  return {
    metadataBase,
    title: { absolute: `${titulo} · AlmaMundi` },
    description,
    alternates: { canonical: './' },
    openGraph: {
      title: `${titulo} · AlmaMundi`,
      description,
      url: './',
      images: [image],
      type: 'article',
      locale: 'es_CL',
      siteName: 'AlmaMundi',
      publishedTime: story.publishedAt ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titulo} · AlmaMundi`,
      description,
      images: [image.url],
    },
  };
}
