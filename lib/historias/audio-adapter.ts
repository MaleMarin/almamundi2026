/**
 * Adaptador StoryPoint → HistoriaAudio para AudioPlayer.
 * Compartido por /historias/audios (reproductor in-place) y /historias/[id]/audio.
 */
import type { HistoriaAudio } from '@/components/historia/AudioPlayer';
import type { StoryPoint } from '@/lib/map-data/stories';

export function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c23600" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#ff4500" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function storyToHistoriaAudio(s: StoryPoint): HistoriaAudio {
  const nombre = s.authorName ?? s.author?.name ?? 'Anónimo';
  const ubicacion = [s.city, s.country].filter(Boolean).join(', ') || undefined;
  const thumb = s.imageUrl ?? s.thumbnailUrl ?? '';
  return {
    id: s.id,
    titulo: s.title ?? 'Sin título',
    subtitulo: s.subtitle ?? ubicacion,
    audioUrl: s.audioUrl!,
    thumbnailUrl: thumb || defaultAvatar(nombre),
    duracion: 0,
    fecha: s.publishedAt ?? '',
    citaDestacada: s.quote,
    frases: undefined,
    autor: {
      nombre,
      avatar: s.author?.avatar ?? s.authorAvatar ?? defaultAvatar(nombre),
      ubicacion,
      bio: s.author?.bio,
    },
    tags: s.tags ?? (s.topic ? [s.topic] : undefined),
  };
}
