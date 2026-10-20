const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 5_000;

function isProductionEnv(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

export function isAllowedTurnstileHostname(hostname: string | undefined): boolean {
  const host = (hostname ?? '').trim().toLowerCase();
  if (!host) return false;
  if (host === 'almamundi.org' || host === 'www.almamundi.org') return true;
  if (isProductionEnv()) return false;
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host.endsWith('.vercel.app')) return true;
  return false;
}

export type TurnstileStrictResult = { ok: true } | { ok: false };

/**
 * Verificación estricta (este formulario / mensaje al autor).
 * Falla cerrado si falta el secret o el token. No mira TURNSTILE_ENFORCE.
 */
export async function verifyTurnstileStrict(
  token: string | null | undefined,
  remoteip: string,
  fetchImpl: typeof fetch = fetch
): Promise<TurnstileStrictResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: false };
  if (!token || typeof token !== 'string' || token.length < 10) return { ok: false };

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteip && remoteip !== 'unknown') body.set('remoteip', remoteip);

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(SITEVERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: ac.signal,
    });
    const data = (await res.json()) as { success?: boolean; hostname?: string };
    if (data.success !== true) return { ok: false };
    if (!isAllowedTurnstileHostname(data.hostname)) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}
