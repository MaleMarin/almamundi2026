import type { StoryPoint } from '@/lib/map-data/stories';
import { siteOrigin } from '@/lib/site-origin';

function plainText(raw: unknown, max = 300): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, max);
  return text || undefined;
}

export function storyReaderPath(id: string, format?: string | null): string {
  const f = (format ?? '').toLowerCase();
  if (f === 'video') return `/historias/${id}/video`;
  if (f === 'audio') return `/historias/${id}/audio`;
  if (f === 'text' || f === 'texto' || f === 'escrito') {
    return `/historias/${id}/texto`;
  }
  if (f === 'image' || f === 'foto' || f === 'photo') {
    return `/historias/${id}/foto`;
  }
  return `/historias/${id}`;
}

function canonicalPath(story: StoryPoint): string {
  return storyReaderPath(story.id, story.format);
}

function schemaType(format: string | undefined): 'VideoObject' | 'AudioObject' | 'ImageObject' | 'Article' {
  const f = (format ?? '').toLowerCase();
  if (f === 'video') return 'VideoObject';
  if (f === 'audio') return 'AudioObject';
  if (f === 'image' || f === 'foto' || f === 'photo') return 'ImageObject';
  return 'Article';
}

/**
 * JSON-LD mínimo por historia. Sin HTML; listo para `JSON.stringify`.
 */
export function buildStoryJsonLd(story: StoryPoint): Record<string, unknown> {
  const origin = siteOrigin();
  const name = plainText(story.title ?? story.label, 200) || 'Historia';
  const description =
    plainText(story.quote, 300) ||
    plainText(story.excerpt, 300) ||
    plainText(story.description, 300) ||
    plainText(story.body, 300);
  const authorName = plainText(story.authorName ?? story.author?.name, 120);
  const image = story.thumbnailUrl || story.imageUrl;
  const type = schemaType(story.format);
  const url = `${origin}${canonicalPath(story)}`;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    url,
  };
  if (description) data.description = description;
  if (authorName) data.author = { '@type': 'Person', name: authorName };
  if (story.publishedAt) data.datePublished = story.publishedAt;
  if (image && (/^https?:\/\//i.test(image) || image.startsWith('/'))) {
    const imageUrl = image.startsWith('/') ? `${origin}${image}` : image;
    data.thumbnailUrl = imageUrl;
    data.image = imageUrl;
  }
  if (type === 'VideoObject' && story.videoUrl) data.contentUrl = story.videoUrl;
  if (type === 'AudioObject' && story.audioUrl) data.contentUrl = story.audioUrl;
  if (type === 'ImageObject' && image && /^https?:\/\//i.test(String(data.image))) {
    data.contentUrl = data.image;
  }
  return data;
}

export function storyJsonLdScript(story: StoryPoint): string {
  return JSON.stringify(buildStoryJsonLd(story)).replace(/</g, '\\u003c');
}
