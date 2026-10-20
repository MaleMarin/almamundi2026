import { NextRequest, NextResponse } from 'next/server';
import { getRateLimiter } from '@/lib/rate-limit';
import { isValidRecipientEmail } from '@/lib/email-html';
import { noteEmailSent } from '@/lib/ops/usage-state';
import { escapeHtml } from '@/lib/security/escape';
import { issueFormToken, verifyFormToken } from '@/lib/security/form-token';
import { verifyTurnstileStrict } from '@/lib/security/turnstile-strict';
import {
  MSG_LIMIT,
  MSG_RELOAD,
  MSG_UPSTASH,
  MSG_VERIFY,
  REQUEST_TYPE_LABELS,
  assertPrivacyPostShell,
  clientIpFromHeaders,
  fieldsForValidation,
  hashedEmailLimitKey,
  isAllowedPrivacyOrigin,
  isHoneypotTriggered,
  isUpstashConfigured,
  parsePrivacyJson,
  privacyDataRequestSchema,
  type PrivacyRequestType,
} from '@/lib/security/validate-data-request';

export const runtime = 'nodejs';

const SUCCESS = { ok: true as const };

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function inboxTo(): string {
  const raw = process.env.PRIVACY_DATA_REQUEST_TO?.trim() || 'hola@almamundi.org';
  return isValidRecipientEmail(raw) ? raw.toLowerCase() : 'hola@almamundi.org';
}

async function enforcePrivacyIpLimits(ip: string): Promise<NextResponse | null> {
  if (!isUpstashConfigured()) return jsonError(MSG_UPSTASH, 503);
  const hour = getRateLimiter('privacy-data-ip-hour', 3, 3600);
  const day = getRateLimiter('privacy-data-ip-day', 6, 86400);
  if (!hour || !day) return jsonError(MSG_UPSTASH, 503);
  const id = `ip:${ip}`;
  const h = await hour.limit(id);
  if (!h.success) return jsonError(MSG_LIMIT, 429);
  const d = await day.limit(id);
  if (!d.success) return jsonError(MSG_LIMIT, 429);
  return null;
}

async function enforcePrivacyEmailLimit(email: string): Promise<NextResponse | null> {
  if (!isUpstashConfigured()) return jsonError(MSG_UPSTASH, 503);
  const day = getRateLimiter('privacy-data-email-day', 3, 86400);
  if (!day) return jsonError(MSG_UPSTASH, 503);
  const key = hashedEmailLimitKey(email);
  const r = await day.limit(`email:${key}`);
  if (!r.success) return jsonError(MSG_LIMIT, 429);
  return null;
}

function buildPrivacyDataRequestEmail(input: {
  requestType: PrivacyRequestType;
  description: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  ownData: 'yes' | 'no';
  ip: string;
}): { subject: string; text: string; html: string } {
  const label = REQUEST_TYPE_LABELS[input.requestType];
  const issued = new Date().toISOString();
  const phoneLine = input.phone ? input.phone : '(no indicado)';
  const own = input.ownData === 'yes' ? 'Sí' : 'No';
  const text = [
    'Solicitud sobre datos personales — AlmaMundi',
    '',
    `Tipo: ${label}`,
    `Código interno: ${input.requestType}`,
    '',
    'Descripción:',
    input.description,
    '',
    'Identificación:',
    `Nombre: ${input.fullName}`,
    `Correo: ${input.email}`,
    `Teléfono / contacto alternativo: ${phoneLine}`,
    `País: ${input.country}`,
    `Solicitud sobre datos propios: ${own}`,
    '',
    `IP aproximada (cabecera): ${input.ip.slice(0, 80)}`,
    `Fecha (servidor): ${issued}`,
  ].join('\n');

  const html = `<pre style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(text)}</pre>`;
  return {
    subject: '[AlmaMundi] Solicitud de datos personales',
    text,
    html,
  };
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && !isAllowedPrivacyOrigin(origin)) {
    return jsonError(MSG_VERIFY, 403);
  }
  try {
    const token = issueFormToken();
    return NextResponse.json({ token });
  } catch {
    return jsonError(MSG_VERIFY, 503);
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const shell = assertPrivacyPostShell(req.method, req.headers, raw);
  if (!shell.ok) {
    const status = shell.reason === 'method' ? 405 : shell.reason === 'origin' ? 403 : 400;
    return jsonError(MSG_VERIFY, status);
  }

  const ip = clientIpFromHeaders(req.headers);
  const ipBlock = await enforcePrivacyIpLimits(ip);
  if (ipBlock) return ipBlock;

  const body = parsePrivacyJson(raw);
  if (!body) return jsonError(MSG_VERIFY, 400);

  if (isHoneypotTriggered(body)) {
    return NextResponse.json(SUCCESS);
  }

  const tokenRaw = typeof body.formToken === 'string' ? body.formToken : undefined;
  const token = verifyFormToken(tokenRaw);
  if (!token.ok) {
    if (token.kind === 'too_fast') return NextResponse.json(SUCCESS);
    if (token.kind === 'expired') return jsonError(MSG_RELOAD, 400);
    return jsonError(MSG_VERIFY, 400);
  }

  const emailRaw = typeof body.email === 'string' ? body.email : '';
  if (emailRaw.trim()) {
    const emailBlock = await enforcePrivacyEmailLimit(emailRaw);
    if (emailBlock) return emailBlock;
  }

  const turnstile = await verifyTurnstileStrict(
    typeof body.turnstileToken === 'string' ? body.turnstileToken : '',
    ip
  );
  if (!turnstile.ok) return jsonError(MSG_VERIFY, 400);

  const parsed = privacyDataRequestSchema.safeParse(fieldsForValidation(body));
  if (!parsed.success) return jsonError(MSG_VERIFY, 400);

  const data = parsed.data;
  if (!isValidRecipientEmail(data.email)) return jsonError(MSG_VERIFY, 400);

  if (!process.env.RESEND_API_KEY?.trim()) {
    return jsonError(
      'El envío electrónico no está configurado. Escríbenos a hola@almamundi.org con el mismo contenido.',
      503
    );
  }

  const phoneDigits = (data.phone ?? '').replace(/\D/g, '');
  const mail = buildPrivacyDataRequestEmail({
    requestType: data.requestType,
    description: data.description,
    fullName: data.fullName,
    email: data.email.trim().toLowerCase(),
    phone: phoneDigits,
    country: data.country,
    ownData: data.ownData,
    ip,
  });

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL ?? 'AlmaMundi <hola@almamundi.org>';
    await resend.emails.send({
      from,
      to: inboxTo(),
      replyTo: data.email.trim().toLowerCase(),
      subject: mail.subject,
      text: mail.text.slice(0, 50000),
      html: mail.html,
    });
    await noteEmailSent();
    return NextResponse.json(SUCCESS);
  } catch (e) {
    console.error('[privacy-data-request]', e);
    return jsonError('No pudimos enviar la solicitud. Intenta de nuevo más tarde.', 500);
  }
}
