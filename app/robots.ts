import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/site-origin';

/**
 * Rutas privadas. Admin y pruebas quedan fuera de aquí para que el rastreador
 * vea su noindex; no se listan en el sitemap.
 */
const DISALLOWED_PATHS: string[] = [
  '/api/*',
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
