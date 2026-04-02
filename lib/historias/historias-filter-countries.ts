/**
 * Nombres de país en español para el filtro de /historias/* (lista completa, ordenada).
 * Usa `Intl.DisplayNames` cuando está disponible (Node 18+ / navegadores actuales).
 */

const FALLBACK_COUNTRIES_ES: string[] = [
  'Alemania',
  'Argentina',
  'Australia',
  'Austria',
  'Bélgica',
  'Bolivia',
  'Brasil',
  'Canadá',
  'Chile',
  'China',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'Egipto',
  'El Salvador',
  'España',
  'Estados Unidos',
  'Francia',
  'Guatemala',
  'Honduras',
  'India',
  'Italia',
  'Japón',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Portugal',
  'Puerto Rico',
  'Reino Unido',
  'República Dominicana',
  'Rusia',
  'Singapur',
  'Suecia',
  'Suiza',
  'Uruguay',
  'Venezuela',
];

function collectFromIntl(): string[] | null {
  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames === 'undefined') return null;
  try {
    const dn = new Intl.DisplayNames(['es'], { type: 'region' });
    const set = new Set<string>();
    for (let i = 65; i < 91; i++) {
      for (let j = 65; j < 91; j++) {
        const code = `${String.fromCharCode(i)}${String.fromCharCode(j)}`;
        const name = dn.of(code);
        if (!name || name === code) continue;
        if (name.length < 3) continue;
        set.add(name);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  } catch {
    return null;
  }
}

let cached: string[] | null = null;

/** Lista ordenada de todos los países/territorios ISO con nombre en español. */
export function getHistoriasFilterCountryNamesEs(): string[] {
  if (cached) return cached;
  const fromIntl = collectFromIntl();
  cached = fromIntl && fromIntl.length > 50 ? fromIntl : [...FALLBACK_COUNTRIES_ES].sort((a, b) => a.localeCompare(b, 'es'));
  return cached;
}
