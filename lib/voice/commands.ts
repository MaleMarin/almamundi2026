/**
 * Comandos de voz para Alma Mundi (español).
 * Reconocimiento flexible: variantes y sinónimos para cada acción.
 */

export type VoiceAction =
  | { type: 'scroll'; target: 'mapa' | 'historias' | 'inicio' }
  | { type: 'openDrawer'; mode: 'stories' | 'news' | 'sounds' | 'search'; query?: string }
  | { type: 'showPurpose' }
  | { type: 'showHowItWorks' }
  | { type: 'search'; query: string };

const NORMALIZE = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Comandos: frase clave (normalizada) → acción */
const COMMANDS: Array<{ keys: string[]; action: VoiceAction }> = [
  { keys: ['ir al mapa', 've al mapa', 'mapa', 'abrir mapa', 'ver mapa'], action: { type: 'scroll', target: 'mapa' } },
  { keys: ['ir a historias', 'historias', 'abrir historias', 'ver historias'], action: { type: 'scroll', target: 'historias' } },
  { keys: ['ir al inicio', 'inicio', 'subir', 'arriba'], action: { type: 'scroll', target: 'inicio' } },
  { keys: ['abrir historias en el mapa', 'panel historias', 'historias en el mapa'], action: { type: 'openDrawer', mode: 'stories' } },
  { keys: ['abrir sonidos', 'sonidos', 'ver sonidos', 'panel sonidos'], action: { type: 'openDrawer', mode: 'sounds' } },
  { keys: ['abrir noticias', 'noticias', 'ver noticias', 'actualidad', 'panel noticias'], action: { type: 'openDrawer', mode: 'news' } },
  { keys: ['abrir buscar', 'buscar', 'busqueda'], action: { type: 'openDrawer', mode: 'search' } },
  { keys: ['nuestro proposito', 'proposito', 'el proposito'], action: { type: 'showPurpose' } },
  { keys: ['como funciona', 'como funciona el sitio'], action: { type: 'showHowItWorks' } },
];

/** Prefijo "buscar" para abrir búsqueda con query */
const SEARCH_PREFIXES = ['buscar', 'busca', 'buscar por'];

export function parseVoiceCommand(transcript: string): VoiceAction | null {
  const t = NORMALIZE(transcript);
  if (!t) return null;

  for (const prefix of SEARCH_PREFIXES) {
    if (t.startsWith(prefix)) {
      const query = t.slice(prefix.length).trim();
      return { type: 'openDrawer', mode: 'search', query: query || undefined };
    }
  }

  for (const { keys, action } of COMMANDS) {
    for (const k of keys) {
      if (t === k || t.startsWith(k + ' ') || t.endsWith(' ' + k)) return action;
    }
  }

  return null;
}
