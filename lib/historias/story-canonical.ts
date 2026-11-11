import type { StoryPoint } from '@/lib/map-data/stories';

/** Ruta canónica que el servidor agrega a cada historia del catálogo (el catálogo no recibe el texto). */
export type ConRutaCanonica = { canonicalPath?: string };

/** Solo texto si tiene texto y no tiene video, audio ni fotos (misma regla que storyKind() en HistoriasIdPageClient). */
export function isTextStory(story: StoryPoint): boolean {
  // Sin texto, /texto devuelve a /historias/[id]: no redirigir para no entrar en un ciclo.
  const contenido = (story.body ?? (story as { content?: string }).content ?? '').trim();
  if (!contenido) return false;
  const format = (story.format ?? '').toLowerCase();
  if (format === 'text' || format === 'texto') return true;
  if (format) return false;
  if (story.videoUrl || story.hasVideo || story.audioUrl || story.hasAudio) return false;
  if (story.imageUrl || (story.imagenes?.length ?? 0) > 0) return false;
  return true;
}

/** Dirección canónica: /historias/[id]/texto para las de texto; /historias/[id] para el resto. */
export function canonicalStoryPath(id: string, story: StoryPoint): string {
  const base = `/historias/${encodeURIComponent(id)}`;
  return isTextStory(story) ? `${base}/texto` : base;
}
