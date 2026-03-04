/**
 * Meta para el viaje "Sintoniza el Mundo".
 * Matching por sonido: moods, soundTags, themes, intensity.
 * Tipo único de mood para UI, journey y motor de audio.
 */
export type SoundMood = "mar" | "ciudad" | "bosque" | "viento" | "animales" | "universo" | "personas";

/** Lista ordenada de todos los moods; usar en UI y donde se necesite iterar. */
export const SOUND_MOODS: SoundMood[] = ["mar", "ciudad", "bosque", "viento", "animales", "universo", "personas"];

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

export const STORIES_MOCK: StoryMeta[] = [
  { id: "s1", title: "Santiago bajo las estrellas", lat: -33.4489, lng: -70.6693, city: "Santiago", country: "Chile", placeLabel: "Santiago, Chile", moods: ["ciudad", "personas"], soundTags: ["noche", "ciudad", "tráfico"], themes: ["familia", "trabajo"], intensity: 3, hasText: true, hasAudio: true, hasVideo: false },
  { id: "s2", title: "Olas del Pacífico", lat: -33.0, lng: -71.6, city: "Valparaíso", country: "Chile", placeLabel: "Valparaíso, Chile", moods: ["mar"], soundTags: ["mar", "ola", "puerto", "sal", "noche"], themes: ["viaje"], intensity: 2, hasText: true, hasAudio: true, hasVideo: false },
  { id: "s3", title: "Nueva York en la noche", lat: 40.7128, lng: -74.006, city: "New York", country: "EE.UU.", placeLabel: "New York, EE.UU.", moods: ["ciudad"], soundTags: ["metro", "tráfico", "multitud", "noche"], themes: ["migración", "trabajo"], intensity: 4, hasText: true, hasAudio: false, hasVideo: true },
  { id: "s4", title: "Bosque patagónico", lat: -41.13, lng: -71.31, city: "Bariloche", country: "Argentina", placeLabel: "Bariloche, Argentina", moods: ["bosque"], soundTags: ["viento", "hojas", "aves", "arroyo"], themes: ["naturaleza"], intensity: 2, hasText: true, hasAudio: true, hasVideo: false },
  { id: "s5", title: "Mar del Norte", lat: 55.6761, lng: 12.5683, city: "Copenhague", country: "Dinamarca", placeLabel: "Copenhague, Dinamarca", moods: ["mar", "ciudad"], soundTags: ["mar", "ola", "puerto", "lluvia"], themes: ["viaje"], intensity: 2, hasText: true, hasAudio: false, hasVideo: false },
  { id: "s6", title: "Selva amazónica", lat: -3.119, lng: -60.021, city: "Manaus", country: "Brasil", placeLabel: "Manaus, Brasil", moods: ["bosque", "animales"], soundTags: ["aves", "insectos", "lluvia", "hojas"], themes: ["naturaleza"], intensity: 3, hasText: true, hasAudio: true, hasVideo: true },
  { id: "s7", title: "Estación Espacial", lat: 0, lng: 0, city: "Órbita", country: "Espacio", placeLabel: "Órbita, Espacio", moods: ["universo"], soundTags: ["estático", "vacio"], themes: ["ciencia"], intensity: 5, hasText: true, hasAudio: false, hasVideo: false },
  { id: "s8", title: "Tokio al amanecer", lat: 35.6762, lng: 139.6503, city: "Tokyo", country: "Japón", placeLabel: "Tokyo, Japón", moods: ["ciudad", "personas"], soundTags: ["metro", "multitud", "tráfico"], themes: ["trabajo", "familia"], intensity: 4, hasText: true, hasAudio: true, hasVideo: false },
  { id: "s9", title: "Isla remota", lat: -17.7, lng: -149.4, city: "Tahití", country: "Polinesia", placeLabel: "Tahití, Polinesia", moods: ["mar", "personas"], soundTags: ["mar", "ola", "noche", "brisa"], themes: ["viaje"], intensity: 1, hasText: true, hasAudio: false, hasVideo: false },
  { id: "s10", title: "Cordillera de los Andes", lat: -32.85, lng: -70.05, city: "Los Andes", country: "Chile", placeLabel: "Los Andes, Chile", moods: ["bosque"], soundTags: ["viento", "aves", "brisa"], themes: ["naturaleza"], intensity: 4, hasText: true, hasAudio: true, hasVideo: false },
  { id: "s11", title: "Desierto de Atacama", lat: -23.6, lng: -68.0, city: "San Pedro", country: "Chile", placeLabel: "San Pedro, Chile", moods: ["universo"], soundTags: ["viento", "noche"], themes: ["naturaleza"], intensity: 5, hasText: true, hasAudio: false, hasVideo: false },
  { id: "s12", title: "Londres bajo la lluvia", lat: 51.5074, lng: -0.1278, city: "Londres", country: "Reino Unido", placeLabel: "Londres, Reino Unido", moods: ["ciudad"], soundTags: ["lluvia", "metro", "tráfico"], themes: ["trabajo"], intensity: 3, hasText: true, hasAudio: true, hasVideo: false },
  { id: "s13", title: "Cantos del amanecer", lat: -34.6, lng: -58.4, city: "Buenos Aires", country: "Argentina", placeLabel: "Buenos Aires, Argentina", moods: ["animales", "personas"], soundTags: ["aves", "multitud", "mercado"], themes: ["familia"], intensity: 3, hasText: true, hasAudio: true, hasVideo: false },
  { id: "s14", title: "Noche en el puerto", lat: -12.05, lng: -77.05, city: "Lima", country: "Perú", placeLabel: "Lima, Perú", moods: ["mar", "ciudad"], soundTags: ["mar", "puerto", "noche", "olas"], themes: ["trabajo"], intensity: 2, hasText: true, hasAudio: false, hasVideo: false },
];
