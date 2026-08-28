import { randomBytes, timingSafeEqual } from 'crypto';

/** Campo en el documento `stories`. No es el id público; no se expone en la API del mapa. */
export const AUTHOR_ECO_TOKEN_FIELD = 'authorEcoToken';

const TOKEN_BYTES = 32;

export function generateAuthorEcoToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function authorEcoTokensMatch(stored: string, provided: string): boolean {
  const a = Buffer.from(stored);
  const b = Buffer.from(provided);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildAuthorEcoPath(storyId: string, token: string): string {
  return `/historias/${encodeURIComponent(storyId)}/mi-eco?t=${encodeURIComponent(token)}`;
}
