/**
 * Historias de demostración compartidas: carrusel (cliente) y API / servidor (getStoryByIdAsync).
 * Sin 'use client': importable desde Server Components y stories-server.
 */
import { ensurePublicDemoStoryFields } from '@/lib/demo-stories-public';
import { MOCK_STORIES } from '@/lib/almamundi/mock-data';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import {
  DEMO_AUDIO_STORIES_EXTRA,
  DEMO_FOTO_STORIES_EXTRA,
  DEMO_TEXT_STORIES_EXTRA,
} from '@/lib/historias/historias-demo-narrative-batch';
import type { StoryPoint } from '@/lib/map-data/stories';

/** Demo texto — mismo contenido que en /historias/escrito. */
export const DEMO_TEXT_STORY_POINT: StoryPoint = ensurePublicDemoStoryFields({
  id: 'demo-texto-1',
  lat: -34.6037,
  lng: -58.3816,
  label: MOCK_STORIES.texto.titulo,
  title: MOCK_STORIES.texto.titulo,
  subtitle: MOCK_STORIES.texto.subtitulo,
  authorName: MOCK_STORIES.texto.autor.nombre,
  author: {
    name: MOCK_STORIES.texto.autor.nombre,
    avatar: MOCK_STORIES.texto.autor.avatar,
  },
  city: 'Buenos Aires',
  country: 'Argentina',
  body: MOCK_STORIES.texto.contenido,
  hasText: true,
  publishedAt: `${MOCK_STORIES.texto.fecha}T12:00:00.000Z`,
  tags: MOCK_STORIES.texto.tags,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-texto-demo/800/600',
  excerpt: `${MOCK_STORIES.texto.contenido.slice(0, 140).trim()}…`,
  quote: 'Eres un puente, no una fractura.',
  isDemo: true,
});

/** Demo fotos — mismas imágenes que en /historias/fotos. */
export const DEMO_FOTO_STORY_POINT: StoryPoint = ensurePublicDemoStoryFields({
  id: 'demo-foto-1',
  lat: 20.6597,
  lng: -103.3496,
  label: MOCK_STORIES.fotos.titulo,
  title: MOCK_STORIES.fotos.titulo,
  subtitle: MOCK_STORIES.fotos.subtitulo,
  authorName: MOCK_STORIES.fotos.autor.nombre,
  author: {
    name: MOCK_STORIES.fotos.autor.nombre,
    avatar: MOCK_STORIES.fotos.autor.avatar,
  },
  city: 'Guadalajara',
  country: 'México',
  publishedAt: `${MOCK_STORIES.fotos.fecha}T12:00:00.000Z`,
  tags: MOCK_STORIES.fotos.tags,
  thumbnailUrl: MOCK_STORIES.fotos.imagenes[0]?.url,
  imagenes: MOCK_STORIES.fotos.imagenes,
  isDemo: true,
} as StoryPoint);

/** Demo audio — mismo audio que en /historias/audios. */
export const DEMO_AUDIO_STORY_POINT: StoryPoint = ensurePublicDemoStoryFields({
  id: 'demo-audio-1',
  lat: 17.0732,
  lng: -96.7266,
  label: MOCK_STORIES.audio.titulo,
  title: MOCK_STORIES.audio.titulo,
  subtitle: MOCK_STORIES.audio.subtitulo,
  authorName: MOCK_STORIES.audio.autor.nombre,
  author: {
    name: MOCK_STORIES.audio.autor.nombre,
    avatar: MOCK_STORIES.audio.autor.avatar,
  },
  city: 'Oaxaca',
  country: 'México',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: MOCK_STORIES.audio.thumbnailUrl,
  hasAudio: true,
  publishedAt: `${MOCK_STORIES.audio.fecha}T12:00:00.000Z`,
  tags: MOCK_STORIES.audio.tags,
  quote: MOCK_STORIES.audio.citaDestacada,
  isDemo: true,
});

/** demo-audio-2…12: narrativa + URLs SoundHelix en historias-demo-narrative-batch. */
export const DEMO_AUDIO_STORIES: StoryPoint[] = [
  DEMO_AUDIO_STORY_POINT,
  ...DEMO_AUDIO_STORIES_EXTRA.map((s) => ensurePublicDemoStoryFields(s)),
];

export const DEMO_TEXT_STORIES: StoryPoint[] = [
  DEMO_TEXT_STORY_POINT,
  ...DEMO_TEXT_STORIES_EXTRA.map((s) => ensurePublicDemoStoryFields(s)),
];

export const DEMO_FOTO_STORIES: StoryPoint[] = [
  DEMO_FOTO_STORY_POINT,
  ...DEMO_FOTO_STORIES_EXTRA.map((s) => ensurePublicDemoStoryFields(s)),
];

export function getDemoStoryPointById(id: string): StoryPoint | null {
  if (!id) return null;
  if (id.startsWith('demo-video-')) {
    const found = DEMO_VIDEO_STORIES.find((s) => s.id === id);
    return found ?? null;
  }
  if (id.startsWith('demo-audio-')) {
    return DEMO_AUDIO_STORIES.find((s) => s.id === id) ?? null;
  }
  if (id.startsWith('demo-texto-')) {
    return DEMO_TEXT_STORIES.find((s) => s.id === id) ?? null;
  }
  if (id.startsWith('demo-foto-')) {
    return DEMO_FOTO_STORIES.find((s) => s.id === id) ?? null;
  }
  return null;
}

/** Segmento de ruta copiado de ejemplos (ID, [id], TU_ID) — no es un id de Firebase. */
export function isPlaceholderHistoriasId(segment: string): boolean {
  const u = segment.trim();
  if (!u) return false;
  const lower = u.toLowerCase();
  return lower === 'id' || lower === '[id]' || lower === 'tu_id';
}
