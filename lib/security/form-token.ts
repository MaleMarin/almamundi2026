import { createHmac, timingSafeEqual } from 'crypto';

const MIN_AGE_MS = 4_000;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export const FORM_TOKEN_TOO_FAST = 'too_fast' as const;
export const FORM_TOKEN_EXPIRED = 'expired' as const;
export const FORM_TOKEN_INVALID = 'invalid' as const;
export const FORM_TOKEN_NO_SECRET = 'no_secret' as const;

export type FormTokenFailure =
  | typeof FORM_TOKEN_TOO_FAST
  | typeof FORM_TOKEN_EXPIRED
  | typeof FORM_TOKEN_INVALID
  | typeof FORM_TOKEN_NO_SECRET;

export type FormTokenResult = { ok: true } | { ok: false; kind: FormTokenFailure };

function signingSecret(): string | null {
  const s = process.env.FORM_SIGNING_SECRET?.trim();
  return s || null;
}

function signIssuedAt(issuedAt: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(issuedAt).digest();
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Emite `issuedAt.hexsig` en base64url. */
export function issueFormToken(now = Date.now()): string {
  const secret = signingSecret();
  if (!secret) {
    throw new Error('FORM_SIGNING_SECRET missing');
  }
  const issuedAt = String(now);
  const sig = signIssuedAt(issuedAt, secret).toString('hex');
  return Buffer.from(`${issuedAt}.${sig}`, 'utf8').toString('base64url');
}

export function verifyFormToken(token: string | undefined, now = Date.now()): FormTokenResult {
  const secret = signingSecret();
  if (!secret) return { ok: false, kind: FORM_TOKEN_NO_SECRET };
  if (!token || typeof token !== 'string') return { ok: false, kind: FORM_TOKEN_INVALID };

  let decoded: string;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return { ok: false, kind: FORM_TOKEN_INVALID };
  }

  const dot = decoded.indexOf('.');
  if (dot <= 0) return { ok: false, kind: FORM_TOKEN_INVALID };
  const issuedAt = decoded.slice(0, dot);
  const sigHex = decoded.slice(dot + 1);
  if (!/^\d+$/.test(issuedAt) || !/^[0-9a-f]+$/i.test(sigHex)) {
    return { ok: false, kind: FORM_TOKEN_INVALID };
  }

  let provided: Buffer;
  try {
    provided = Buffer.from(sigHex, 'hex');
  } catch {
    return { ok: false, kind: FORM_TOKEN_INVALID };
  }
  const expected = signIssuedAt(issuedAt, secret);
  if (!safeEqual(provided, expected)) return { ok: false, kind: FORM_TOKEN_INVALID };

  const issued = Number(issuedAt);
  const age = now - issued;
  if (age < MIN_AGE_MS) return { ok: false, kind: FORM_TOKEN_TOO_FAST };
  if (age > MAX_AGE_MS) return { ok: false, kind: FORM_TOKEN_EXPIRED };
  return { ok: true };
}
