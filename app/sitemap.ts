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

/** Rutas estáticas principales (sin dinámicas [id]). Ampliar si hace falta indexación fina. */
const STATIC_PATHS: string[] = [
  '/',
  '/mapa',
  '/historias',
  '/historias/audios',
  '/historias/videos',
  '/historias/escrito',
  '/historias/fotos',
  '/historias/mi-coleccion',
  '/subir',
  '/privacidad',
  '/mis-datos-personales',
  '/vision',
  '/muestras',
  '/exposiciones',
  '/temas',
  '/curaduria',
  '/archivo',
  '/educacion-mediatica',
  '/recorridos',
  '/perfil',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  const lastModified = new Date();
  return STATIC_PATHS.map((path) => ({
    url: path === '/' ? `${base}/` : `${base}${path}`,
    lastModified,
  }));
}
