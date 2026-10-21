/** Entorno que ve Sentry. Preview no se mezcla con producción. */
export function sentryEnvironment(): string {
  const v = process.env.VERCEL_ENV?.trim();
  if (v === 'preview') return 'vercel-preview';
  if (v === 'production') return 'vercel-production';
  if (v === 'development') return 'development';
  return process.env.NODE_ENV || 'development';
}
