import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { escapeHtml } from './escape';
import {
  FORM_TOKEN_EXPIRED,
  FORM_TOKEN_TOO_FAST,
  issueFormToken,
  verifyFormToken,
} from './form-token';
import {
  CLOUDFLARE_TURNSTILE_TEST_SECRET,
  isAllowedTurnstileHostname,
  verifyTurnstileStrict,
} from './turnstile-strict';
import {
  MAX_PRIVACY_BODY_BYTES,
  MSG_LIMIT,
  MSG_UPSTASH,
  MSG_VERIFY,
  assertPrivacyPostShell,
  clientIpFromHeaders,
  fieldsForValidation,
  hashedEmailLimitKey,
  isAllowedPrivacyOrigin,
  isHoneypotTriggered,
  isUpstashConfigured,
  normalizeEmailForLimit,
  parsePrivacyJson,
  privacyDataRequestSchema,
} from './validate-data-request';

const ORIGIN = 'https://www.almamundi.org';

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

function validFields(extra: Record<string, unknown> = {}) {
  return {
    requestType: 'acceder',
    fullName: 'María José OHiggins',
    email: 'persona@example.com',
    phone: '56912345678',
    country: 'Chile',
    description: 'Quiero acceder a mis datos.',
    ownData: 'yes',
    formToken: 'a'.repeat(12),
    turnstileToken: 't'.repeat(20),
    ...extra,
  };
}

describe('privacy-data-request layers', () => {
  const prev = { ...process.env };

  afterEach(() => {
    for (const k of Object.keys(process.env)) {
      if (!(k in prev)) delete process.env[k];
    }
    Object.assign(process.env, prev);
  });

  beforeEach(() => {
    process.env.FORM_SIGNING_SECRET = 'test-signing-secret-not-for-production';
    process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-secret';
    delete process.env.VERCEL_ENV;
  });

  it('método: rechaza GET en el cascarón POST', () => {
    const r = assertPrivacyPostShell('GET', headers({ origin: ORIGIN, 'content-type': 'application/json' }), '{}');
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, 'method');
  });

  it('origin: rechaza un origen ajeno', () => {
    process.env.VERCEL_ENV = 'production';
    const r = assertPrivacyPostShell(
      'POST',
      headers({ origin: 'https://evil.example', 'content-type': 'application/json' }),
      '{}'
    );
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, 'origin');
    assert.equal(isAllowedPrivacyOrigin('https://www.almamundi.org'), true);
    assert.equal(isAllowedPrivacyOrigin('https://almamundi.org'), true);
  });

  it('content-type: exige JSON', () => {
    const r = assertPrivacyPostShell('POST', headers({ origin: ORIGIN, 'content-type': 'text/plain' }), '{}');
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, 'content_type');
  });

  it('cuerpo: rechaza más de 10 KB', () => {
    const raw = JSON.stringify({ pad: 'x'.repeat(MAX_PRIVACY_BODY_BYTES) });
    const r = assertPrivacyPostShell(
      'POST',
      headers({ origin: ORIGIN, 'content-type': 'application/json' }),
      raw
    );
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, 'too_large');
  });

  it('límite: sin Upstash la ruta debe fallar cerrado', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    assert.equal(isUpstashConfigured(), false);
    assert.ok(MSG_LIMIT.includes('hola@almamundi.org'));
    assert.ok(MSG_UPSTASH.includes('hola@almamundi.org'));
  });

  it('límite: la IP se toma de x-vercel-forwarded-for y luego x-forwarded-for', () => {
    const h = headers({
      'x-vercel-forwarded-for': '1.1.1.1, 2.2.2.2',
      'x-forwarded-for': '3.3.3.3',
    });
    assert.equal(clientIpFromHeaders(h), '1.1.1.1');
    assert.equal(clientIpFromHeaders(headers({ 'x-forwarded-for': '3.3.3.3, 4.4.4.4' })), '3.3.3.3');
  });

  it('trampa: website con contenido se considera bot', () => {
    assert.equal(isHoneypotTriggered({ website: 'http://spam.test' }), true);
    assert.equal(isHoneypotTriggered({ website: '  ' }), false);
    assert.equal(isHoneypotTriggered({}), false);
  });

  it('token rápido: menos de 4 segundos', () => {
    const now = 1_700_000_000_000;
    const token = issueFormToken(now);
    const v = verifyFormToken(token, now + 1_000);
    assert.equal(v.ok, false);
    if (!v.ok) assert.equal(v.kind, FORM_TOKEN_TOO_FAST);
  });

  it('token vencido: más de 2 horas', () => {
    const now = 1_700_000_000_000;
    const token = issueFormToken(now);
    const v = verifyFormToken(token, now + 3 * 60 * 60 * 1000);
    assert.equal(v.ok, false);
    if (!v.ok) assert.equal(v.kind, FORM_TOKEN_EXPIRED);
  });

  it('token válido entre 4 s y 2 h', () => {
    const now = 1_700_000_000_000;
    const token = issueFormToken(now);
    const v = verifyFormToken(token, now + 5_000);
    assert.equal(v.ok, true);
  });

  it('Turnstile falso: success !== true', async () => {
    const fakeFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ success: false, hostname: 'www.almamundi.org' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    const r = await verifyTurnstileStrict('token-de-prueba-12345', '1.1.1.1', fakeFetch);
    assert.equal(r.ok, false);
    assert.ok(MSG_VERIFY.includes('No pudimos verificar'));
  });

  it('Turnstile: hostname no permitido en producción', () => {
    process.env.VERCEL_ENV = 'production';
    assert.equal(isAllowedTurnstileHostname('evil.example'), false);
    assert.equal(isAllowedTurnstileHostname('www.almamundi.org'), true);
  });

  it('campos inválidos: nombre con números', () => {
    const parsed = privacyDataRequestSchema.safeParse(validFields({ fullName: 'Ana 123' }));
    assert.equal(parsed.success, false);
  });

  it('campo desconocido: .strict() rechaza', () => {
    const parsed = privacyDataRequestSchema.safeParse(validFields({ extra: 'no' }));
    assert.equal(parsed.success, false);
  });

  it('website se retira antes de validar', () => {
    const rest = fieldsForValidation({ ...validFields(), website: 'http://x' });
    assert.equal('website' in rest, false);
    const parsed = privacyDataRequestSchema.safeParse(rest);
    assert.equal(parsed.success, true);
  });

  it('correo Gmail se normaliza sin puntos ni +', () => {
    assert.equal(normalizeEmailForLimit('A.B+spam@gmail.com'), 'ab@gmail.com');
    assert.equal(hashedEmailLimitKey('a.b@gmail.com'), hashedEmailLimitKey('ab@gmail.com'));
  });

  it('JSON inválido', () => {
    assert.equal(parsePrivacyJson('{'), null);
    assert.equal(parsePrivacyJson('[]'), null);
  });

  it('escape HTML', () => {
    assert.equal(escapeHtml('<b>x</b> & "y"'), '&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;');
  });
});
