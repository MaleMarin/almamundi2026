/** Origen canónico público. Apex y hosts de vista previa no se publican. */
export const PUBLIC_SITE_ORIGIN = 'https://www.almamundi.org';

/**
 * Origen público del sitio (metadata, JSON-LD, sitemap).
 * Sin imports de servidor.
 */
export function siteOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.PUBLIC_SITE_URL?.trim(),
  ].filter(Boolean) as string[];
  for (const raw of candidates) {
    try {
      const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw;
      const origin = new URL(normalized).origin;
      if (origin === 'https://almamundi.org' || origin === PUBLIC_SITE_ORIGIN) {
        return PUBLIC_SITE_ORIGIN;
      }
      const host = new URL(origin).hostname;
      if (host === 'vercel.app' || host.endsWith('.vercel.app')) continue;
      return origin;
    } catch {
      /* siguiente */
    }
  }
  return PUBLIC_SITE_ORIGIN;
}
