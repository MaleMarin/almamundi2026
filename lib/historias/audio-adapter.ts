/**
 * Adaptador StoryPoint → HistoriaAudio para AudioPlayer.
 * Compartido por /historias/audios (reproductor in-place) y /historias/[id]/audio.
 */
import type { HistoriaAudio } from '@/components/historia/AudioPlayer';
import { demoStoryFieldsFromPoint } from '@/lib/demo-stories-public';
import type { StoryPoint } from '@/lib/map-data/stories';
import { captionPhrasesFromTranscription } from '@/lib/historias/story-accessibility';
import { storyUbicacionLabel } from '@/lib/historias/story-ubicacion';

export function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#B53514" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#FF4A1C" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function storyToHistoriaAudio(s: StoryPoint): HistoriaAudio {
  const nombre = s.authorName ?? s.author?.name ?? 'Anónimo';
  const ubicacion = storyUbicacionLabel(s);
  const thumb = s.imageUrl ?? s.thumbnailUrl ?? '';
  const demoStory = demoStoryFieldsFromPoint(s);
  const transcription = s.transcription?.trim();
  const frases =
    s.captionPhrases ??
    (transcription ? captionPhrasesFromTranscription(transcription) : undefined);
  return {
    id: s.id,
    titulo: s.title ?? 'Sin título',
    subtitulo: s.subtitle,
    audioUrl: s.audioUrl!,
    thumbnailUrl: thumb || defaultAvatar(nombre),
    duracion: 0,
    fecha: s.publishedAt ?? '',
    citaDestacada: s.quote,
    frases,
    transcripcion: transcription,
    transcript: transcription,
    autor: {
      nombre,
      avatar: s.author?.avatar ?? s.authorAvatar ?? defaultAvatar(nombre),
      ubicacion,
      bio: s.author?.bio,
    },
    tags: s.tags ?? (s.topic ? [s.topic] : undefined),
    ...(s.cancionRelacionada ? { cancionRelacionada: s.cancionRelacionada } : {}),
    ...(s.antecedentes ? { antecedentes: s.antecedentes } : {}),
    ...(demoStory ? { demoStory } : {}),
  };
}
