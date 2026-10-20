/**
 * Meta para el viaje "Sintoniza el Mundo".
 * Matching por sonido: moods, soundTags, themes, intensity.
 * Tipo único de mood para UI, journey y motor de audio.
 */
export type SoundMood = "mar" | "ciudad" | "bosque" | "viento" | "animales" | "universo" | "personas" | "radio" | "lluvia" | "mercado";

/** Lista ordenada de todos los moods; usar en UI y donde se necesite iterar. */
export const SOUND_MOODS: SoundMood[] = ["mar", "ciudad", "bosque", "viento", "animales", "universo", "personas", "radio", "lluvia", "mercado"];

/** Alias: mismo tipo que SoundMood (para StoryMeta.moods). */
export type StoryMood = SoundMood;

export type StoryMeta = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  /** Ej: "Santiago, Chile" — derivable de city+country si no existe */
  placeLabel?: string;
  moods: StoryMood[];
  soundTags: string[];
  themes: string[];
  intensity: 1 | 2 | 3 | 4 | 5;
  hasText?: boolean;
  hasAudio?: boolean;
  hasVideo?: boolean;
};
