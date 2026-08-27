/** Site key pública del widget. Vacía = no hay captcha en el cliente. */
export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';
}

export type TurnstileGate = 'skip' | 'wait' | 'need' | 'ok' | 'degraded';
