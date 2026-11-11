import type { MetadataRoute } from 'next';
import { getPublicStoryUrlsAsync } from '@/lib/map-data/stories-server';
import { siteOrigin } from '@/lib/site-origin';

// Regenerar la sitemap a lo sumo cada hora: balance entre frescura para
// historias recién publicadas y costo de lecturas a Firestore.
export const revalidate = 3600;

/**
 * Rutas estáticas que responden 200. Sin /mapa ni /archivo (redirigen)
 * ni páginas antiguas fuera del menú (temas, exposiciones, recorridos, visión, educación mediática).
 */
const STATIC_PATHS: string[] = [
  '/',
  '/historias',
  '/preguntas',
  '/respuestas-a-almamundi',
  '/preguntas-de-las-personas',
  '/privacidad',
  '/terminos',
  '/proposito',
  '/pt/proposito',
  '/en/proposito',
];

/** Acepta Firestore Timestamp, ISO string o nada. Devuelve Date válida o null. */
function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isFinite(d.getTime()) ? d : null;
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }
  return null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === '/' ? `${base}/` : `${base}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1.0 : 0.7,
  }));

  let storyEntries: MetadataRoute.Sitemap = [];
  try {
    // Dirección canónica de cada historia (las de texto, /texto), sin pasar por redirecciones.
    const items = await getPublicStoryUrlsAsync();
    storyEntries = items.map((item) => {
      const lastModified =
        toDateOrNull(item.updatedAt) ??
        toDateOrNull(item.publishedAt) ??
        toDateOrNull(item.createdAt);
      return {
        url: `${base}${item.path}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    });
  } catch (error) {
    // Si Firestore falla (credenciales, red, índice), el sitemap igual responde
    // con las rutas estáticas. No tiramos el endpoint por una lectura caída.
    console.error('[sitemap] Error fetching published stories:', error);
  }

  return [...staticEntries, ...storyEntries];
}
