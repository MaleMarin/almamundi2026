import type { ContentItem, ContentKind } from './types';

export function getItemsByKind(items: ContentItem[], kind: ContentKind): ContentItem[] {
  return items.filter((item) => item.kind === kind);
}

export function getItemsByState(items: ContentItem[], stateCode: string): ContentItem[] {
  return items.filter((item) => item.stateCodes?.includes(stateCode));
}

export function getFeatured(
  items: ContentItem[],
  kind?: ContentKind,
  limit = 6
): ContentItem[] {
  return items
    .filter((item) => item.featured && (!kind || item.kind === kind))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
}

export function getRecentSignals(items: ContentItem[], limit = 6): ContentItem[] {
  return items
    .filter((item) => item.kind === 'senial' || item.metadata?.recency === 'recent')
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
}

export type HomeCollections = {
  hero: ContentItem[];
  experiencias: ContentItem[];
  analisis: ContentItem[];
  normas: ContentItem[];
  seniales: ContentItem[];
};

export function getHomeCollections(items: ContentItem[]): HomeCollections {
  const hero = items.filter((i) => i.hero).slice(0, 1);
  const experiencias = getFeatured(items, 'experiencia', 4);
  const analisis = getFeatured(items, 'analisis', 4);
  const normas = getFeatured(items, 'norma', 4);
  const seniales = getRecentSignals(items, 6);
  return {
    hero,
    experiencias,
    analisis,
    normas,
    seniales,
  };
}
