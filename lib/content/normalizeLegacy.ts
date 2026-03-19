import type { ContentItem, ContentKind } from './types';

function inferKindFromLegacy(post: Record<string, unknown>): ContentKind {
  const raw = `${post.category ?? ''} ${post.type ?? ''} ${post.section ?? ''}`.toLowerCase();

  if (raw.includes('norma')) return 'norma';
  if (raw.includes('analisis') || raw.includes('opinión') || raw.includes('opinion')) return 'analisis';
  if (raw.includes('programa')) return 'programa';
  if (raw.includes('licit')) return 'licitacion';
  if (raw.includes('señal') || raw.includes('senal')) return 'senial';
  return 'experiencia';
}

function inferStateCodesFromLegacy(post: Record<string, unknown>): string[] {
  const text = `${post.title ?? ''} ${post.excerpt ?? ''} ${post.content ?? ''}`.toLowerCase();
  const map: Record<string, string> = {
    cdmx: 'CDMX',
    'ciudad de méxico': 'CDMX',
    jalisco: 'JAL',
    'nuevo leon': 'NL',
    'nuevo león': 'NL',
    puebla: 'PUE',
    sonora: 'SON',
    veracruz: 'VER',
    yucatan: 'YUC',
    yucatán: 'YUC',
  };

  return Object.entries(map)
    .filter(([needle]) => text.includes(needle))
    .map(([, code]) => code);
}

function inferTopicsFromLegacy(post: Record<string, unknown>): string[] {
  const text = `${post.title ?? ''} ${post.excerpt ?? ''} ${post.content ?? ''}`.toLowerCase();
  const topics = [
    'innovacion publica',
    'innovación pública',
    'gobierno digital',
    'ia',
    'inteligencia artificial',
    'datos',
    'transparencia',
    'servicios publicos',
    'servicios públicos',
  ];

  return topics.filter((topic) => text.includes(topic));
}

function inferRecency(dateString?: string): 'none' | 'old' | 'medium' | 'recent' {
  if (!dateString) return 'none';
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return 'recent';
  if (diffDays <= 30) return 'medium';
  return 'old';
}

function inferPriority(post: Record<string, unknown>): number {
  const p = post.priority;
  if (typeof p === 'number' && !Number.isNaN(p)) return p;
  if (typeof p === 'string') return parseInt(p, 10) || 0;
  if (post.featured) return 10;
  if (post.hero) return 20;
  return 0;
}

function inferImpact(post: Record<string, unknown>): 'low' | 'medium' | 'high' {
  const i = post.impact;
  if (i === 'low' || i === 'medium' || i === 'high') return i;
  return 'medium';
}

/**
 * Normaliza un post del sitio antiguo de Política Digital a ContentItem.
 */
export function normalizeLegacyPost(post: Record<string, unknown>): ContentItem {
  const date = typeof post.date === 'string' ? post.date : new Date().toISOString();
  const title = typeof post.title === 'string' ? post.title : '';
  return {
    id: String(post.id ?? crypto.randomUUID()),
    slug: typeof post.slug === 'string' ? post.slug : title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    title,
    excerpt: typeof post.excerpt === 'string' ? post.excerpt : '',
    body: typeof post.content === 'string' ? post.content : undefined,
    kind: inferKindFromLegacy(post),
    stateCodes: inferStateCodesFromLegacy(post),
    topics: inferTopicsFromLegacy(post),
    publishedAt: date,
    updatedAt: typeof post.modified === 'string' ? post.modified : date,
    featured: Boolean(post.featured),
    hero: Boolean(post.hero),
    legacySource: 'politica-digital-old',
    image: {
      src: typeof post.image === 'string' ? post.image : undefined,
      alt: title,
      mode: typeof post.image === 'string' ? 'photo' : 'placeholder',
    },
    source: {
      name: typeof post.sourceName === 'string' ? post.sourceName : 'Política Digital',
      url: typeof post.sourceUrl === 'string' ? post.sourceUrl : undefined,
    },
    metadata: {
      recency: inferRecency(date),
      priority: inferPriority(post),
      impact: inferImpact(post),
      institution: typeof post.sourceName === 'string' ? post.sourceName : undefined,
    },
  };
}

/**
 * Normaliza un array de posts legacy.
 */
export function normalizeLegacyPosts(posts: Record<string, unknown>[]): ContentItem[] {
  return posts.map(normalizeLegacyPost);
}
