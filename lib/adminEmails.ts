/**
 * Emails autorizados para el panel admin (/admin).
 * Solo estos usuarios pueden entrar; el resto es redirigido al mapa de la home (/#mapa).
 */
export const ADMIN_EMAILS = ['equipo@almamundi.org'];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized);
}
