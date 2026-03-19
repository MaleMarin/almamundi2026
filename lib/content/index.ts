export type { ContentKind, ContentItem, StateProfile } from './types';
export { normalizeLegacyPost, normalizeLegacyPosts } from './normalizeLegacy';
export {
  getItemsByKind,
  getItemsByState,
  getFeatured,
  getRecentSignals,
  getHomeCollections,
  type HomeCollections,
} from './selectors';
export { LEGACY_POLITICA_DIGITAL_POSTS } from './legacy-data';
import { normalizeLegacyPosts } from './normalizeLegacy';
import { LEGACY_POLITICA_DIGITAL_POSTS } from './legacy-data';
import type { ContentItem } from './types';

/**
 * Contenido normalizado para toda la web.
 * Sustituir LEGACY_POLITICA_DIGITAL_POSTS por tu importación real cuando la tengas.
 */
export function getAllContent(legacyPosts = LEGACY_POLITICA_DIGITAL_POSTS): ContentItem[] {
  return normalizeLegacyPosts(legacyPosts as Record<string, unknown>[]);
}
