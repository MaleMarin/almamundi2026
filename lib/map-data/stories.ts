/**
 * Historias del mapa: puntos con id para Observatorio (detalle).
 *
 * — En el servidor (API): getStoriesAsync() lee desde Firestore colección `stories`.
 * — En el cliente (globo): useStories() hace fetch a /api/stories.
 * — getStories() sigue disponible y devuelve mock para compatibilidad (cuando no se usa useStories).
 */

import { STORIES_MOCK } from '@/lib/map-data/story-meta';

export type StoryPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** Nombre de la persona que cuenta la historia (autor). */
  authorName?: string;
  title?: string;
  topic?: string;
  description?: string;
  city?: string;
  country?: string;
  timezone?: string;
  /** URL opcional de audio (podcast, etc.) */
  audioUrl?: string;
  /** URL opcional de video */
  videoUrl?: string;
  /** Texto de la historia (cuando no hay medio externo) */
  body?: string;
  /** Si no existen URLs, el Observatorio usa estos para habilitar Leer/Escuchar/Ver */
  hasText?: boolean;
  hasAudio?: boolean;
  hasVideo?: boolean;
  /** Fecha de publicación (ISO) — para pulso/electrocardiograma */
  publishedAt?: string;
  /** Una imagen (visión Ken Burns en observatorio) */
  imageUrl?: string;
  /** Varias imágenes: presentación Ken Burns, una por vez (roadmap 1B) */
  images?: string[];
  /** Fotos con nombre y fecha para Ken Burns en StoryViewer */
  photos?: {
    url: string;
    name: string;
    date: string;
  }[];
  /** Tags de clima para efecto visual (5A): rain, storm, clear, etc. */
  weatherTags?: string[];
  /** true cuando el punto es demo/fallback (sin historias en Firestore). */
  isDemo?: boolean;
}

const STORIES: StoryPoint[] = [
  { id: 'story-scl', lat: -33.4489, lng: -70.6693, label: 'Santiago', city: 'Santiago', country: 'Chile', timezone: 'America/Santiago', topic: 'Comunidad', body: 'Historias desde Santiago.', hasText: true, hasAudio: true },
  { id: 'story-nyc', lat: 40.7128, lng: -74.006, label: 'New York', city: 'New York', country: 'Estados Unidos', timezone: 'America/New_York', topic: 'Migración', body: 'Historias desde New York.', hasText: true, hasVideo: true },
  { id: 'story-par', lat: 48.8566, lng: 2.3522, label: 'Paris', city: 'Paris', country: 'Francia', timezone: 'Europe/Paris', topic: 'Arte, Cultura y Humanidades', body: 'Historias desde Paris.', hasText: true },
  { id: 'story-tyo', lat: 35.6762, lng: 139.6503, label: 'Tokyo', city: 'Tokyo', country: 'Japón', timezone: 'Asia/Tokyo', topic: 'Tecnología', body: 'Historias desde Tokyo.', hasText: true, hasAudio: true },
  // STORIES_MOCK integradas como puntos del mapa
  ...STORIES_MOCK.map((m) => ({
    id: m.id,
    lat: m.lat,
    lng: m.lng,
    label: m.title,
    city: m.city,
    country: m.country,
    topic: m.themes?.[0],
    body: `${m.title}. ${m.placeLabel ?? ''}`,
    hasText: m.hasText ?? true,
    hasAudio: m.hasAudio ?? false,
    hasVideo: m.hasVideo ?? false,
  })),
];

export function getStories(): StoryPoint[] {
  return [...STORIES];
}

export function getStoryById(id: string): StoryPoint | undefined {
  return STORIES.find((s) => s.id === id);
}

/** Resuelve historia desde STORIES o STORIES_MOCK (music view). Para Observatorio. */
export function getStoryForObservatory(id: string): StoryPoint | undefined {
  const fromStories = getStoryById(id);
  if (fromStories) return fromStories;
  const meta = STORIES_MOCK.find((s) => s.id === id);
  if (!meta) return undefined;
  return {
    id: meta.id,
    label: meta.title,
    lat: meta.lat,
    lng: meta.lng,
    city: meta.city,
    country: meta.country,
    body: meta.title ? `Historia: ${meta.title}. Contenido disponible según formato.` : undefined,
    hasText: meta.hasText ?? true,
    hasAudio: meta.hasAudio ?? false,
    hasVideo: meta.hasVideo ?? false,
  };
}
