import type { MetadataRoute } from 'next';
import { getAdminDb } from '@/lib/firebase/admin';
import { FIRESTORE_AUDIENCE_PUBLIC_STATUSES } from '@/lib/editorial/status';

// Regenerar la sitemap a lo sumo cada hora: balance entre frescura para
// historias recién publicadas y costo de lecturas a Firestore.
export const revalidate = 3600;

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
 * Rutas estáticas públicas. NO incluir privadas/admin/preview/demos:
 * esas viven en `app/robots.ts` (disallow) y deben quedar fuera del sitemap.
 */
const STATIC_PATHS: string[] = [
  '/',
  '/historias',
  '/historias/videos',
  '/historias/audios',
  '/historias/fotos',
  '/historias/escrito',
  '/mapa',
  '/temas',
  '/subir',
  '/muestras',
  '/exposiciones',
  '/educacion-mediatica',
  '/recorridos',
  '/archivo',
  '/privacidad',
  '/terminos',
  '/vision',
  '/alma-almamundi',
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
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === '/' ? `${base}/` : `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1.0 : 0.7,
  }));

  let storyEntries: MetadataRoute.Sitemap = [];
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('stories')
      .where('status', 'in', [...FIRESTORE_AUDIENCE_PUBLIC_STATUSES])
      .select('updatedAt', 'publishedAt', 'createdAt')
      .get();

    storyEntries = snap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const lastModified =
        toDateOrNull(data.updatedAt) ??
        toDateOrNull(data.publishedAt) ??
        toDateOrNull(data.createdAt) ??
        now;
      return {
        url: `${base}/historias/${doc.id}`,
        lastModified,
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
