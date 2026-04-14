/**
 * Colección guardada (localStorage). Key: almamundi_coleccion
 * Items: { kind: 'stories' | 'news', id, title, subtitle, savedAt }
 */

export type CollectionKind = 'stories' | 'news';

export type CollectionItem = {
  kind: CollectionKind;
  id: string;
  title: string;
  subtitle: string;
  savedAt: number;
};

const STORAGE_KEY = 'almamundi_coleccion';

export function getCollection(): CollectionItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : [];
  } catch {
    return [];
  }
}

function isValidItem(x: unknown): x is CollectionItem {
  return (
    typeof x === 'object' &&
    x !== null &&
    (x as CollectionItem).kind in { stories: 1, news: 1 } &&
    typeof (x as CollectionItem).id === 'string' &&
    typeof (x as CollectionItem).title === 'string' &&
    typeof (x as CollectionItem).savedAt === 'number'
  );
}

export function addToCollection(item: Omit<CollectionItem, 'savedAt'>): void {
  const list = getCollection().filter((i) => !(i.kind === item.kind && i.id === item.id));
  list.unshift({ ...item, savedAt: Date.now() });
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('almamundi-collection-updated'));
  }
}

export function removeFromCollection(kind: CollectionKind, id: string): void {
  const list = getCollection().filter((i) => !(i.kind === kind && i.id === id));
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('almamundi-collection-updated'));
  }
}

export function isInCollection(kind: CollectionKind, id: string): boolean {
  return getCollection().some((i) => i.kind === kind && i.id === id);
}

/** Vacía la colección guardada en localStorage (p. ej. al eliminar cuenta). */
export function clearSavedCollection(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('almamundi-collection-updated'));
  } catch {
    /* ignore */
  }
}
