/** Orígenes de producción para la sesión resumable de GCS. */
export const PRODUCTION_RESUMABLE_ORIGINS = new Set([
  'https://www.almamundi.org',
  'https://almamundi.org',
]);

/**
 * Preview de este proyecto en Vercel (alias de rama o host único).
 * No acepta `*.vercel.app` de otros proyectos.
 */
export const PREVIEW_RESUMABLE_ORIGIN =
  /^https:\/\/almamundi2026-[a-z0-9-]+-precisar\.vercel\.app$/;

const FALLBACK_ORIGIN = 'https://www.almamundi.org';

export function isPreviewResumableOrigin(origin: string): boolean {
  return PREVIEW_RESUMABLE_ORIGIN.test(origin.trim());
}

/**
 * Origin que se firma en la sesión resumable de GCS.
 * Producción: solo www / apex. Fuera de producción: solo preview de este proyecto.
 */
export function resolveResumableUploadOrigin(opts: {
  requestOrigin: string;
  vercelEnv: string | undefined;
}): string {
  const origin = (opts.requestOrigin || '').trim();
  const isProd = opts.vercelEnv === 'production';

  if (isProd) {
    return PRODUCTION_RESUMABLE_ORIGINS.has(origin) ? origin : FALLBACK_ORIGIN;
  }

  if (isPreviewResumableOrigin(origin)) return origin;
  return FALLBACK_ORIGIN;
}

export function isAcceptedResumableOrigin(
  origin: string,
  vercelEnv: string | undefined
): boolean {
  const trimmed = origin.trim();
  if (!trimmed) return false;
  return resolveResumableUploadOrigin({ requestOrigin: trimmed, vercelEnv }) === trimmed;
}
