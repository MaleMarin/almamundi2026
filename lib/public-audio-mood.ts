import type { SoundMood } from '@/lib/map-data/story-meta';
import { SOUND_MOODS } from '@/lib/map-data/story-meta';

/** Prefijo en `selectedMood` / filas del panel para archivos bajo `public/`. */
export const PUBLIC_AUDIO_MOOD_PREFIX = '__pub__:' as const;

const PRESET_SET = new Set<string>(SOUND_MOODS);

export function isPresetSoundMood(s: string | null | undefined): s is SoundMood {
  return s != null && PRESET_SET.has(s);
}

export function isPublicAudioMoodId(id: string): boolean {
  return id.startsWith(PUBLIC_AUDIO_MOOD_PREFIX);
}

/** Ruta URL desde raíz del sitio, p. ej. `/audio/amanecer.mp3`. */
export function publicAudioPathFromMoodId(id: string): string | null {
  if (!isPublicAudioMoodId(id)) return null;
  return id.slice(PUBLIC_AUDIO_MOOD_PREFIX.length);
}

export function publicAudioMoodIdFromPath(absolutePath: string): string {
  const p = absolutePath.startsWith('/') ? absolutePath : `/${absolutePath}`;
  return `${PUBLIC_AUDIO_MOOD_PREFIX}${p}`;
}

/** Nombre de archivo sin ruta, decodificado. */
export function publicAudioBasename(urlPath: string): string {
  const seg = urlPath.split('/').filter(Boolean).pop() ?? urlPath;
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

/**
 * Quita extensiones de audio (incl. dobles tipo `.webmhd.webm`).
 */
export function stripMediaExtensions(filename: string): string {
  let s = filename.trim();
  const re = /\.(webmhd|webm|mp4|mp3|wav|m4a|ogg)$/i;
  while (re.test(s)) {
    s = s.replace(re, '');
  }
  return s.trim() || 'Audio';
}

/** Quita prefijos tipo "sonido " / "sonido de " de nombres de archivo del equipo. */
export function stripSonidoFilenamePrefix(raw: string): string {
  const t = raw.trim();
  const low = t.toLowerCase();
  if (low.startsWith('sonido de ')) return t.slice(10).trim();
  if (low.startsWith('sonido del ')) return t.slice(11).trim();
  if (low.startsWith('sonido ')) return t.slice(7).trim();
  return t;
}

function normalizeStemKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '');
}

const SMALL_WORDS_ES = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'a', 'al']);

function titleCaseSpanishPhrase(s: string): string {
  const words = s.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Audio';
  return words
    .map((w, i) => {
      const lw = w.toLowerCase();
      if (i > 0 && SMALL_WORDS_ES.has(lw)) return lw;
      return w.charAt(0).toLocaleUpperCase('es-ES') + w.slice(1).toLowerCase();
    })
    .join(' ');
}

/** Nombres amigables para archivos típicos de ambients (evita “ocean.wav” crudo). */
const STEM_TO_LABEL: Record<string, string> = {
  ocean: 'Mar',
  mar: 'Mar',
  city: 'Ciudad',
  forest: 'Bosque',
  wind: 'Viento',
  viento: 'Viento',
  universe: 'Universo',
  universo: 'Universo',
  people: 'Personas',
  animals: 'Animales',
  animales: 'Animales',
  radio: 'Radio',
  lluvia: 'Lluvia',
  rain: 'Lluvia',
  'rain-city': 'Lluvia en ciudad',
  raincity: 'Lluvia en ciudad',
  mercado: 'Mercados',
  market: 'Mercados',
  neblina: 'Neblina',
  amanecer: 'Amanecer',
  anochecer: 'Anochecer',
  dia: 'Día',
  auto: 'Auto',
  arroyo: 'Arroyo',
  bajoelmar: 'Bajo el mar',
  bosque: 'Bosque',
  volcan: 'Volcán',
  volcn: 'Volcán',
  lavadevolcan: 'Lava de volcán',
  latidodecorazon: 'Latido de corazón',
};

/**
 * Título corto para mostrar en UI (sin extensión, capitalizado / mapeado al español).
 */
export function friendlyTitleFromPublicPath(urlPath: string): string {
  const base = publicAudioBasename(urlPath);
  const stem = stripMediaExtensions(base);
  const stemClean = stripSonidoFilenamePrefix(stem);
  const norm = normalizeStemKey(stemClean);
  if (STEM_TO_LABEL[norm]) return STEM_TO_LABEL[norm];
  const firstToken = stemClean.split(/[._\s-]+/).filter(Boolean)[0]?.toLowerCase() ?? '';
  if (firstToken && STEM_TO_LABEL[firstToken]) return STEM_TO_LABEL[firstToken];

  return titleCaseSpanishPhrase(stemClean);
}

/**
 * Pista breve de carpeta para subtítulo (no el nombre de archivo técnico).
 */
export function folderHintFromPublicPath(urlPath: string): string {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length <= 1) return 'Raíz del sitio';
  const parent = parts[parts.length - 2] ?? '';
  if (parent === 'audio') return 'Biblioteca de audio';
  if (parent === 'ambients') return 'Ambientes';
  return parent.replace(/[-_]/g, ' ') || 'Carpeta';
}

/** Preferencia de formato al deduplicar el mismo “tema” (.mp3 antes que .wav). */
const FORMAT_ORDER = ['.mp3', '.m4a', '.mp4', '.ogg', '.wav', '.webm'] as const;

function formatRank(path: string): number {
  const low = path.toLowerCase();
  const i = FORMAT_ORDER.findIndex((ext) => low.endsWith(ext));
  return i === -1 ? 99 : i;
}

/**
 * Un solo archivo por nombre base + carpeta (ej. no listar ocean.mp3 y ocean.wav).
 */
export function dedupePublicAudioPaths(paths: string[]): string[] {
  const map = new Map<string, string>();
  for (const p of paths) {
    const base = publicAudioBasename(p);
    const stem = stripMediaExtensions(base).toLowerCase();
    const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
    const key = `${dir}::${stem}`;
    const prev = map.get(key);
    if (prev == null || formatRank(p) < formatRank(prev)) {
      map.set(key, p);
    }
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

export function displayLabelForPublicOrPreset(id: string | null, presetLabels: Record<SoundMood, string>): string {
  if (!id) return '—';
  if (isPublicAudioMoodId(id)) {
    const path = publicAudioPathFromMoodId(id) ?? '';
    return friendlyTitleFromPublicPath(path);
  }
  if (isPresetSoundMood(id)) return presetLabels[id];
  return id;
}
