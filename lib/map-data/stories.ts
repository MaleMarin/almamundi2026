/**
 * Tipo compartido de punto de historia (globo, fichas, APIs).
 * Los datos vivos salen de Firestore vía `/api/stories` y `getStoriesAsync`.
 */

export type StoryPoint = {
  id: string;
  /** Código público de /h/[código]. */
  shortCode?: string;
  lat: number;
  lng: number;
  label: string;
  authorName?: string;
  title?: string;
  topic?: string;
  description?: string;
  city?: string;
  country?: string;
  timezone?: string;
  audioUrl?: string;
  videoUrl?: string;
  body?: string;
  hasText?: boolean;
  hasAudio?: boolean;
  hasVideo?: boolean;
  publishedAt?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  format?: string;
  excerpt?: string;
  subtitle?: string;
  author?: { name?: string; avatar?: string; bio?: string };
  authorAvatar?: string;
  tags?: string[];
  /** Ids de tema público. El eje se deriva de cada tema. */
  temas?: string[];
  ejes?: string[];
  quote?: string;
  cancionRelacionada?: string;
  antecedentes?: string;
  questionId?: string;
  questionMode?: 'tu' | 'alguien';
  captionsUrl?: string;
  transcription?: string;
  captionPhrases?: string[];
  images?: string[];
  imagenes?: { url: string; caption?: string; descripcion?: string; titulo?: string }[];
  photos?: {
    url: string;
    name: string;
    date: string;
  }[];
  weatherTags?: string[];
  isDemo?: boolean;
  isBetaDemo?: boolean;
  isRealStory?: boolean;
  demoNotice?: string;
  editorialStatus?: string;
  /** Conteo de «Me emocionó». No se publica en el sitio; el dato sigue en Firestore. */
  resonancesCount?: number;
  /** Marcada en el admin. Entra al globo aunque no esté entre las 40 más recientes. */
  featured?: boolean;
  /** Tiene coordenadas y está entre las 40 recientes o es destacada. */
  onGlobe?: boolean;
  /** Cuatro colores de la cinta, en hex. Si faltan, se calculan al leer. */
  cintaColors?: string[];
};

export function getStories(): StoryPoint[] {
  return [];
}

export function getStoryById(id: string): StoryPoint | undefined {
  if (!id) return undefined;
  return undefined;
}

export function getStoryForObservatory(id: string): StoryPoint | undefined {
  if (!id) return undefined;
  return undefined;
}
