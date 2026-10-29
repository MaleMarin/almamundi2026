import type { StoryPoint } from '@/lib/map-data/stories';
import { temasSearchText } from '@/lib/temas';

/** Año de publicación (ISO) o null si no hay fecha válida. */
export function yearFromPublished(iso: string | undefined): number | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

/** Texto normalizado para búsqueda (sin distinguir mayúsculas / acentos). */
export function foldText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function isWrittenStory(story: StoryPoint): boolean {
  const format = (story.format ?? '').toLowerCase();
  if (format === 'video' || story.videoUrl || story.hasVideo) return false;
  if (format === 'audio' || story.audioUrl || story.hasAudio) return false;
  if (format === 'foto' || format === 'image' || format === 'photos' || format === 'photo') return false;
  return format === 'text' || format === 'texto' || format === 'escrito' || Boolean(story.body);
}

/** Busca en título, lugar, alias, ejes, temas, texto escrito y fichas de fotos. */
export function haystackForStory(s: StoryPoint): string {
  const photos = [
    ...(s.imagenes ?? []).flatMap((item) => [item.titulo, item.caption, item.descripcion]),
    ...(s.photos ?? []).map((item) => item.name),
  ];
  const parts = [
    s.title,
    s.label,
    s.city,
    s.country,
    s.authorName,
    s.author?.name,
    temasSearchText(s.temas),
    isWrittenStory(s) ? s.body : '',
    ...photos,
  ];
  return foldText(parts.filter(Boolean).join(' '));
}
