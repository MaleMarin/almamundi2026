/**
 * Adaptador StoryPoint → Historia para VideoPlayer.
 */
import type { Historia } from '@/components/historia/VideoPlayer';
import { demoStoryFieldsFromPoint } from '@/lib/demo-stories-public';
import type { StoryPoint } from '@/lib/map-data/stories';
import { defaultAvatar } from '@/lib/historias/audio-adapter';

function formatPlace(s: StoryPoint): string {
  return [s.city, s.country].filter(Boolean).join(', ') || s.label || '';
}

function resolveThumbnail(s: StoryPoint): string {
  const raw =
    s.imageUrl ??
    s.thumbnailUrl ??
    (s as Record<string, unknown>).image ??
    (s as Record<string, unknown>).thumbnail ??
    (s as Record<string, unknown>).coverImage ??
    (s as Record<string, unknown>).videoThumbnail ??
    '';
  const thumb = String(raw).trim();
  if (thumb) return thumb;
  const placeholder =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#e8e4dc" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#8b7a6a">Sin imagen</text></svg>'
    );
  return placeholder;
}

export function storyToVideoHistoria(s: StoryPoint): Historia {
  const nombre = s.authorName ?? s.author?.name ?? 'Anónimo';
  const ubicacion = formatPlace(s) || undefined;
  const demoStory = demoStoryFieldsFromPoint(s);
  const videoUrl = (s.videoUrl ?? '').trim();

  return {
    id: s.id,
    titulo: s.title ?? s.label ?? 'Historia',
    subtitulo: s.subtitle ?? ubicacion,
    videoUrl: videoUrl || '#',
    thumbnailUrl: resolveThumbnail(s),
    duracion: 0,
    fecha: s.publishedAt ?? '',
    autor: {
      nombre,
      avatar: s.author?.avatar ?? s.authorAvatar ?? defaultAvatar(nombre),
      ubicacion,
      bio: s.author?.bio ?? s.description,
    },
    tags: s.tags ?? (s.topic ? [s.topic] : undefined),
    citaDestacada: s.quote,
    subtitulos: s.captionsUrl,
    ...(demoStory ? { demoStory } : {}),
  };
}
