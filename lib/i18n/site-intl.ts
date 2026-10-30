import type { AlmaLocale } from '@/lib/i18n/locale';

/** Etiqueta de Intl: español, portugués de Brasil o inglés. */
export function intlTag(locale: AlmaLocale): string {
  if (locale === 'pt') return 'pt-BR';
  if (locale === 'en') return 'en';
  return 'es';
}

/**
 * Fecha de calendario, igual en el servidor y en el navegador.
 * «29 de octubre de 2026», «29 de outubro de 2026», «October 29, 2026».
 */
export function formatCalendarDate(
  year: number,
  month: number,
  day: number,
  locale: AlmaLocale
): string {
  if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) return '';
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utc.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(intlTag(locale), {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(utc);
  } catch {
    return '';
  }
}

function ymdFromIso(iso: string): { year: number; month: number; day: number } | null {
  const cal = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (cal) {
    return { year: Number(cal[1]), month: Number(cal[2]), day: Number(cal[3]) };
  }
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Fecha larga de una historia a partir de su ISO. El texto guardado si no se puede leer. */
export function formatSiteDate(iso: string | undefined | null, locale: AlmaLocale): string {
  const raw = (iso ?? '').trim();
  if (!raw || raw === '—' || raw === '-') return '';
  const ymd = ymdFromIso(raw);
  if (!ymd) return raw;
  return formatCalendarDate(ymd.year, ymd.month, ymd.day, locale) || raw;
}

/** Día civil en una zona, para el correo de recepción. */
export function formatZonedDate(at: Date, locale: AlmaLocale, timeZone: string): string {
  if (Number.isNaN(at.getTime()) || !timeZone.trim()) return '';
  try {
    const parts = new Intl.DateTimeFormat(intlTag(locale), {
      timeZone,
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(at);
    const day = Number(parts.find((part) => part.type === 'day')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    if (!day || !month || !year) return '';
    return formatCalendarDate(year, month, day, locale);
  } catch {
    return '';
  }
}

const relativeCache = new Map<AlmaLocale, Intl.RelativeTimeFormat>();

function relativeFormat(locale: AlmaLocale): Intl.RelativeTimeFormat | null {
  const cached = relativeCache.get(locale);
  if (cached) return cached;
  try {
    const format = new Intl.RelativeTimeFormat(intlTag(locale), { numeric: 'auto' });
    relativeCache.set(locale, format);
    return format;
  } catch {
    return null;
  }
}

function formatRelative(locale: AlmaLocale, value: number, unit: Intl.RelativeTimeFormatUnit): string {
  if (!Number.isFinite(value)) return '';
  const format = relativeFormat(locale);
  if (!format) return '';
  try {
    return format.format(value, unit);
  } catch {
    return '';
  }
}

/** «hace 3 días», «há 3 dias», «3 days ago», y lo mismo para minutos, horas y semanas. */
export function formatRelativeTime(
  iso: string | undefined | null,
  now: number,
  locale: AlmaLocale
): string {
  if (!iso) return '';
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const deltaSec = Math.round((then - now) / 1000);
  const absSec = Math.abs(deltaSec);
  if (absSec < 45) return formatRelative(locale, 0, 'second');
  const deltaMin = Math.round(deltaSec / 60);
  if (Math.abs(deltaMin) < 60) return formatRelative(locale, deltaMin, 'minute');
  const deltaHour = Math.round(deltaSec / 3600);
  if (Math.abs(deltaHour) < 24) return formatRelative(locale, deltaHour, 'hour');
  const deltaDay = Math.round(deltaSec / 86400);
  if (Math.abs(deltaDay) < 7) return formatRelative(locale, deltaDay, 'day');
  const deltaWeek = Math.round(deltaDay / 7);
  if (Math.abs(deltaWeek) < 5) return formatRelative(locale, deltaWeek, 'week');
  const deltaMonth = Math.round(deltaDay / 30);
  if (Math.abs(deltaMonth) < 12) return formatRelative(locale, deltaMonth, 'month');
  return formatRelative(locale, Math.round(deltaDay / 365), 'year');
}

/**
 * Fecha de una historia: relativa si tiene menos de una semana, larga si es anterior.
 */
export function formatStoryWhen(
  iso: string | undefined | null,
  locale: AlmaLocale,
  now = Date.now()
): string {
  if (!iso) return '';
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return formatSiteDate(iso, locale);
  const days = Math.floor((now - then) / 86400000);
  if (days >= 0 && days < 7) return formatRelativeTime(iso, now, locale) || formatSiteDate(iso, locale);
  return formatSiteDate(iso, locale);
}
