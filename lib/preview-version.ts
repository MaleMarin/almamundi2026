/**
 * Sello del build de prueba. En el cliente solo existen las copias NEXT_PUBLIC_,
 * rellenadas en el build desde VERCEL_ENV y VERCEL_GIT_COMMIT_SHA.
 * En production devuelve null.
 */
export function previewCommitStamp(): string | null {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV ?? '';
  if (env === 'production') return null;
  const sha = (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? '').trim().slice(0, 7);
  return sha || null;
}
