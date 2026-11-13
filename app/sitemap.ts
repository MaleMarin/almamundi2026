import type { MetadataRoute } from 'next';
import { contenidoPublicoParaSitemap, type EntradaSitemap } from '@/lib/sitemap/contenido-publico';
import { siteOrigin } from '@/lib/site-origin';

/**
 * Se arma en cada petición (no en el build): las rutas fijas más el contenido público de Firestore,
 * que se lee a lo sumo una vez por hora (caché en lib/sitemap/contenido-publico.ts).
 *
 * Si Firestore falla y no hay una lectura anterior guardada, la ruta responde con error del servidor:
 * un sitemap con solo las rutas fijas le diría a los buscadores que el resto ya no existe.
 */
export const dynamic = 'force-dynamic';

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
  '/como-funciona',
  '/pt/como-funciona',
  '/en/how-it-works',
  '/contacto',
  '/codigo-de-conducta',
];

function conFecha(base: string, item: EntradaSitemap) {
  return {
    url: `${base}${item.path}`,
    ...(item.lastModified ? { lastModified: new Date(item.lastModified) } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === '/' ? `${base}/` : `${base}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1.0 : 0.7,
  }));

  // Sin try/catch a propósito: ver la nota de arriba.
  const { historias, preguntas } = await contenidoPublicoParaSitemap();

  const storyEntries: MetadataRoute.Sitemap = historias.map((item) => ({
    ...conFecha(base, item),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Preguntas con respuestas publicadas: la misma dirección que cada página declara como canónica.
  const questionEntries: MetadataRoute.Sitemap = preguntas.map((item) => conFecha(base, item));

  return [...staticEntries, ...storyEntries, ...questionEntries];
}
