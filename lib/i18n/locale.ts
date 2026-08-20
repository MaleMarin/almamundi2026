export type AlmaLocale = 'es' | 'pt' | 'en';

export const ALMA_LOCALE_COOKIE = 'almamundi-locale';

export const ALMA_LOCALES: AlmaLocale[] = ['es', 'pt', 'en'];

export function parseAlmaLocale(raw: string | undefined | null): AlmaLocale {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'pt' || v === 'en' || v === 'es') return v;
  return 'es';
}

/** Sustituye `{nombre}` en plantillas del diccionario. */
export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}

const MONTHS_LONG: Record<AlmaLocale, readonly string[]> = {
  es: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  pt: [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

/** Fecha larga para el pie de la pieza: «20 de agosto de 2026» / «August 20, 2026». */
export function formatLongDate(at: Date, locale: AlmaLocale): string {
  const day = at.getDate();
  const year = at.getFullYear();
  const month = MONTHS_LONG[locale][at.getMonth()] ?? '';
  if (locale === 'en') return `${month} ${day}, ${year}`;
  return `${day} de ${month} de ${year}`;
}
