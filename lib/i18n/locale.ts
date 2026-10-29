import { formatCalendarDate } from '@/lib/i18n/site-intl';

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

/** Fecha larga para el pie de la pieza: «20 de agosto de 2026» / «August 20, 2026». */
export function formatLongDate(at: Date, locale: AlmaLocale): string {
  if (Number.isNaN(at.getTime())) return '';
  return formatCalendarDate(at.getFullYear(), at.getMonth() + 1, at.getDate(), locale);
}
