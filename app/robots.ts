import type { MetadataRoute } from 'next';

function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw;
      return new URL(normalized).origin;
    } catch {
      /* fall through */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return 'https://www.almamundi.org';
}

/**
 * Rutas privadas, administrativas, de preview y de desarrollo que no deben
 * indexarse. El resto del sitio queda accesible vía `allow: '/'`.
 */
const DISALLOWED_PATHS: string[] = [
  '/admin',
  '/admin/*',
  '/api/*',
  '/preview-home',
  '/vista-previa',
  '/prototipo',
  '/demo-huellas-v2',
  '/demo-impronta',
  '/earth-globe-demo',
  '/globo-v2',
  '/globo-validacion',
  '/mis-datos-personales',
  '/privacidad/data-request',
  '/curaduria',
  '/perfil',
  '/perfil/*',
  '/historias/mi-coleccion',
  '/u/*',
];

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: DISALLOWED_PATHS,
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
