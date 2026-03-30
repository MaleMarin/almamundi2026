import "server-only";

/**
 * Cloudflare Turnstile (opcional).
 * - Sin TURNSTILE_SECRET_KEY: no verifica.
 * - Con secret pero sin TURNSTILE_ENFORCE=true: no exige token (compat hasta integrar widget en el cliente).
 * - Con secret y TURNSTILE_ENFORCE=true: exige token válido.
 */
export async function verifyTurnstileIfConfigured(
  token: string | null | undefined,
  remoteip: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true };
  const enforce = process.env.TURNSTILE_ENFORCE === "true";
  if (!enforce) return { ok: true };

  if (!token || typeof token !== "string" || token.length < 10) {
    return { ok: false, reason: "captcha_required" };
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteip && remoteip !== "unknown") body.set("remoteip", remoteip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success === true) return { ok: true };
    return { ok: false, reason: "captcha_failed" };
  } catch {
    return { ok: false, reason: "captcha_verify_error" };
  }
}
