import type { StoryPoint } from '@/lib/map-data/stories';

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

/** Texto acumulado para búsqueda por palabras clave. */
export function haystackForStory(s: StoryPoint): string {
  const parts = [
    s.title,
    s.label,
    s.topic,
    s.subtitle,
    s.description,
    s.excerpt,
    s.body,
    s.quote,
    s.authorName,
    s.author?.name,
    s.city,
    s.country,
    ...(s.tags ?? []),
  ];
  return foldText(parts.filter(Boolean).join(' '));
}
