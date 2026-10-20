import { createHash } from 'crypto';
import { z } from 'zod';

export const MAX_PRIVACY_BODY_BYTES = 10 * 1024;

export const MSG_VERIFY =
  'No pudimos verificar tu envío. Intenta de nuevo o escríbenos a hola@almamundi.org.';
export const MSG_LIMIT =
  'Recibimos varias solicitudes desde tu conexión. Intenta más tarde o escríbenos a hola@almamundi.org.';
export const MSG_UPSTASH =
  'Por ahora no podemos recibir solicitudes por aquí. Escríbenos a hola@almamundi.org.';
export const MSG_RELOAD = 'Recarga la página e intenta de nuevo.';
export const MSG_SUCCESS = 'Recibimos tu solicitud.';

export const REQUEST_TYPES = [
  'confirmar_tratamiento',
  'acceder',
  'corregir',
  'eliminar',
  'anonimizar_bloquear',
  'retirar_consentimiento',
  'informacion_uso',
  'limitar_fines',
  'otro',
] as const;

export type PrivacyRequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_TYPE_LABELS: Record<PrivacyRequestType, string> = {
  confirmar_tratamiento: 'Confirmar si tratamos datos personales tuyos.',
  acceder: 'Acceder a los datos personales que tenemos sobre ti.',
  corregir: 'Corregir datos incompletos, incorrectos o desactualizados.',
  eliminar: 'Solicitar la eliminación de tus datos personales.',
  anonimizar_bloquear: 'Solicitar la anonimización o bloqueo de datos que ya no sean necesarios.',
  retirar_consentimiento: 'Retirar tu consentimiento para el uso de tus datos.',
  informacion_uso: 'Solicitar información sobre cómo usamos o compartimos tus datos.',
  limitar_fines: 'Solicitar que dejemos de usar tus datos para ciertos fines.',
  otro: 'Otro tipo de solicitud.',
};

/** Chile y México primero; lista cerrada para el select. */
export const PRIVACY_COUNTRIES = [
  'Chile',
  'México',
  'Argentina',
  'Bolivia',
  'Brasil',
  'Canadá',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'España',
  'Estados Unidos',
  'Francia',
  'Guatemala',
  'Honduras',
  'Italia',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Portugal',
  'Puerto Rico',
  'Reino Unido',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
  'Alemania',
] as const;

const NAME_RE = /^(?=.{2,100}$)[\p{L}]+(?:[ '\-][\p{L}]+)*$/u;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

export const privacyDataRequestSchema = z
  .object({
    requestType: z.enum(REQUEST_TYPES),
    fullName: z.string().trim().min(2).max(100).regex(NAME_RE),
    email: z.string().trim().max(254).email(),
    phone: z
      .string()
      .optional()
      .transform((v) => (typeof v === 'string' ? v.trim() : ''))
      .refine((v) => v === '' || (digitsOnly(v).length >= 7 && digitsOnly(v).length <= 15 && /^\d+$/.test(digitsOnly(v)))),
    country: z.enum(PRIVACY_COUNTRIES),
    description: z.string().trim().min(1).max(2000),
    ownData: z.enum(['yes', 'no']),
    formToken: z.string().min(8),
    turnstileToken: z.string().min(10),
  })
  .strict();

export type PrivacyDataRequestInput = z.infer<typeof privacyDataRequestSchema>;

export function isHoneypotTriggered(body: Record<string, unknown>): boolean {
  const w = body.website;
  return typeof w === 'string' && w.trim().length > 0;
}

export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

export function isProductionVercel(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

export function isAllowedPrivacyOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (host === 'almamundi.org' || host === 'www.almamundi.org') return true;
  if (isProductionVercel()) return false;
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host.endsWith('.vercel.app')) return true;
  return false;
}

export function clientIpFromHeaders(headers: Headers): string {
  const vercel = headers.get('x-vercel-forwarded-for');
  if (vercel) {
    const first = vercel.split(',')[0]?.trim();
    if (first) return first;
  }
  const xf = headers.get('x-forwarded-for');
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first) return first;
  }
  return 'unknown';
}

export type ShellFailure = 'method' | 'content_type' | 'origin' | 'too_large' | 'invalid_json';

export function assertPrivacyPostShell(
  method: string,
  headers: Headers,
  rawBody: string
): { ok: true } | { ok: false; reason: ShellFailure } {
  if (method !== 'POST') return { ok: false, reason: 'method' };
  const ct = headers.get('content-type') ?? '';
  if (!ct.toLowerCase().includes('application/json')) return { ok: false, reason: 'content_type' };
  if (!isAllowedPrivacyOrigin(headers.get('origin'))) return { ok: false, reason: 'origin' };
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_PRIVACY_BODY_BYTES) {
    return { ok: false, reason: 'too_large' };
  }
  return { ok: true };
}

export function parsePrivacyJson(raw: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    return v as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Gmail: minúsculas, sin puntos en el local, sin sufijo +. */
export function normalizeEmailForLimit(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at <= 0) return e;
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const noPlus = local.split('+')[0] ?? local;
    const noDots = noPlus.replace(/\./g, '');
    return `${noDots}@gmail.com`;
  }
  return e;
}

export function hashedEmailLimitKey(email: string): string {
  const n = normalizeEmailForLimit(email);
  return createHash('sha256').update(`privacy-email:${n}`).digest('hex');
}

export function fieldsForValidation(body: Record<string, unknown>): Record<string, unknown> {
  const { website: _honeypot, ...rest } = body;
  return rest;
}
