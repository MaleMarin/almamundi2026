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
      return new URL(normalized).origin;
    } catch {
      /* siguiente */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return 'https://www.almamundi.org';
}
