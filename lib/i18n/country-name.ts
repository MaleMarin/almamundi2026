import type { AlmaLocale } from '@/lib/i18n/locale';
import { intlTag } from '@/lib/i18n/site-intl';
import { foldText } from '@/lib/historias/story-filter-helpers';

export type CountryOption = { code: string; name: string };

/** UK no es el código ISO; el nombre oficial es el de GB. */
const CODE_ALIAS: Record<string, string> = { UK: 'GB' };

type Index = {
  nameToCode: Map<string, string>;
  codes: string[];
};

let index: Index | null = null;
const optionsCache = new Map<AlmaLocale, CountryOption[]>();

function regionName(locale: AlmaLocale, code: string): string | null {
  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames === 'undefined') return null;
  try {
    const name = new Intl.DisplayNames([intlTag(locale)], { type: 'region' }).of(code);
    if (!name || name.toUpperCase() === code.toUpperCase() || name.length < 3) return null;
    return name;
  } catch {
    return null;
  }
}

function buildIndex(): Index {
  const nameToCode = new Map<string, string>();
  const codes: string[] = [];
  const remember = (name: string, code: string) => {
    const key = foldText(name).trim();
    if (key && !nameToCode.has(key)) nameToCode.set(key, code);
  };
  for (let i = 65; i < 91; i++) {
    for (let j = 65; j < 91; j++) {
      const raw = `${String.fromCharCode(i)}${String.fromCharCode(j)}`;
      const code = CODE_ALIAS[raw] ?? raw;
      if (CODE_ALIAS[raw]) {
        const aliasName = regionName('es', raw) ?? regionName('en', raw);
        if (aliasName) remember(aliasName, code);
        remember(raw, code);
        continue;
      }
      const es = regionName('es', code);
      if (!es) continue;
      codes.push(code);
      for (const locale of ['es', 'pt', 'en'] as const) {
        const name = regionName(locale, code);
        if (name) remember(name, code);
      }
    }
  }
  return { nameToCode, codes };
}

function countryIndex(): Index {
  if (!index) index = buildIndex();
  return index;
}

/** Código ISO si el valor guardado ya es un código o coincide con un nombre oficial. */
export function countryCodeFromStored(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value || value === '—' || value === '-') return null;
  if (/^[A-Za-z]{2}$/.test(value)) {
    const upper = value.toUpperCase();
    const code = CODE_ALIAS[upper] ?? upper;
    if (regionName('es', code) || regionName('en', code)) return code;
  }
  return countryIndex().nameToCode.get(foldText(value).trim()) ?? null;
}

/** Nombre en el idioma del sitio. Si no hay código, el texto guardado. */
export function displayCountryName(raw: string | null | undefined, locale: AlmaLocale): string {
  const value = (raw ?? '').trim();
  if (!value || value === '—' || value === '-') return '';
  const code = countryCodeFromStored(value);
  if (!code) return value;
  return regionName(locale, code) ?? value;
}

export function countryMatches(stored: string | null | undefined, selectedCode: string): boolean {
  if (!selectedCode) return true;
  const storedCode = countryCodeFromStored(stored);
  if (storedCode && storedCode === selectedCode) return true;
  if (!countryCodeFromStored(selectedCode) && (stored ?? '').trim() === selectedCode) return true;
  return false;
}

/** Lista completa del filtro, ordenada en el idioma activo. */
export function countryOptions(locale: AlmaLocale): CountryOption[] {
  const cached = optionsCache.get(locale);
  if (cached) return cached;
  const tag = intlTag(locale);
  const options = countryIndex()
    .codes
    .map((code) => ({ code, name: regionName(locale, code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, tag, { sensitivity: 'base' }));
  optionsCache.set(locale, options);
  return options;
}
