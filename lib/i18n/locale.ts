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
