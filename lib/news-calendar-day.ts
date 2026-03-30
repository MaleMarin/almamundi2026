/**
 * Día calendario del usuario (IANA) para filtrar noticias por `publishedAt`.
 * Sin dependencias extra: Intl + regex.
 */

const DAY_YMD = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Zona IANA típica: letras, números, /, _, +, - */
const TZ_SAFE = /^[A-Za-z0-9_\/+\-]+$/;

export function sanitizeDayYmd(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  return DAY_YMD.test(t) ? t : null;
}

export function sanitizeTimeZone(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.length < 2 || t.length > 80) return null;
  if (!TZ_SAFE.test(t)) return null;
  return t;
}

/**
 * True si `publishedAt` (ISO UTC) cae en el día calendario `dayYmd` (YYYY-MM-DD) en `timeZone`.
 */
export function isPublishedOnCalendarDay(
  publishedAt: string | null | undefined,
  dayYmd: string,
  timeZone: string
): boolean {
  if (!publishedAt || !dayYmd || !timeZone) return false;
  const d = new Date(publishedAt);
  if (Number.isNaN(d.getTime())) return false;
  try {
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    return ymd === dayYmd;
  } catch {
    return false;
  }
}

/**
 * Solo en el navegador: "hoy" del usuario en su zona. En SSR devuelve UTC + fecha ISO del servidor (fallback).
 */
export function getUserCalendarDayForNewsApi(): { tz: string; day: string } {
  if (typeof window === "undefined") {
    const d = new Date();
    return { tz: "UTC", day: d.toISOString().slice(0, 10) };
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return { tz, day };
}
