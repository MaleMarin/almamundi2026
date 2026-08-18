/**
 * Correo inmediato al autor cuando AlmaMundi recibe su historia (antes de curación).
 *
 * El wordmark va embebido (CID): Gmail bloquea /logo.png remoto hasta “mostrar
 * imágenes”, y el PNG público es negro sobre transparente (parece texto negro).
 * Si no hay archivo, el nombre va en naranja de marca y Avenir.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { escapeHtml } from '@/lib/email-html';
import { getResend } from '@/lib/emailSubmission';

const WORDMARK_PATH = fileURLToPath(
  new URL('./almamundi-wordmark-orange.png', import.meta.url)
);

const EMAIL_PUBLIC_ORIGIN = 'https://www.almamundi.org';
const BRAND_ORANGE = '#FF4A1C';
const LOGO_CID = 'almamundi-logo';
const WORDMARK_FONT =
  "Avenir, 'Avenir Light', 'Avenir Next', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

export type SendReceivedEmailParams = {
  /** Vacío si la persona no dejó nombre ni alias. */
  authorName: string;
  authorEmail: string;
};

function greetingLine(authorName: string): string {
  const n = authorName.trim();
  return n ? `Hola ${escapeHtml(n)},` : 'Hola,';
}

function brandHeaderHtml(hasInlineLogo: boolean): string {
  if (hasInlineLogo) {
    return `<img src="cid:${LOGO_CID}" alt="AlmaMundi" width="200" height="200"
        style="display:block;margin:0 auto;width:200px;height:200px;border:0;outline:none;text-decoration:none">`;
  }
  return `<p style="margin:0;font-size:22px;font-weight:300;letter-spacing:0.04em;color:${BRAND_ORANGE};font-family:${WORDMARK_FONT}">
        AlmaMundi
      </p>`;
}

export function buildReceivedEmailHtml(
  params: SendReceivedEmailParams,
  hasInlineLogo = false
): string {
  const greeting = greetingLine(params.authorName);

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 20px">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#E8EBF2;border-radius:24px;
  box-shadow:14px 14px 34px rgba(136,150,170,0.48),
  -14px -14px 38px rgba(255,255,255,0.98)">

  <tr>
    <td style="padding:32px 40px 24px;text-align:center;
      border-bottom:1px solid rgba(255,255,255,0.6)">
      ${brandHeaderHtml(hasInlineLogo)}
    </td>
  </tr>

  <!-- Cuerpo -->
  <tr>
    <td style="padding:40px 40px 32px">
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568">
        ${greeting}
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#4A5568;line-height:1.6">
        Recibimos tu historia. Ahora la vamos a revisar y te avisamos apenas esté
        en AlmaMundi.
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#4A5568;line-height:1.6">
        Gracias por contarla.
      </p>
      <p style="margin:0;font-size:16px;color:#4A5568;line-height:1.6">
        Un abrazo,<br>
        Equipo AlmaMundi
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:24px 40px;text-align:center;
      border-top:1px solid rgba(255,255,255,0.6)">
      <p style="margin:0;font-size:13px;color:#9299a8">
        El equipo de AlmaMundi
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#9299a8">
        <a href="${EMAIL_PUBLIC_ORIGIN}/privacidad"
          style="color:#9299a8">Política de privacidad</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

async function loadInlineWordmark(): Promise<Buffer | null> {
  // Solo este PNG junto al módulo. No usar process.cwd()+public/: el file
  // tracing de Next metería todo public/ (~380 MB) en cada función que importa esto.
  try {
    return await readFile(WORDMARK_PATH);
  } catch {
    return null;
  }
}

export type SendReceivedEmailResult =
  | { ok: true; emailId?: string }
  | { ok: false; error: string };

function mailFromAddress(): string {
  const raw = (process.env.RESEND_FROM_EMAIL ?? process.env.MAIL_FROM ?? 'AlmaMundi <hola@almamundi.org>').trim();
  if (!raw) return 'AlmaMundi <hola@almamundi.org>';
  return raw.includes('<') ? raw : `AlmaMundi <${raw}>`;
}

export async function sendReceivedEmail(
  params: SendReceivedEmailParams
): Promise<SendReceivedEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: 'Resend no configurado (falta RESEND_API_KEY)' };
  }

  const from = mailFromAddress();
  const subject = 'Recibimos tu historia';
  const logo = await loadInlineWordmark();

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildReceivedEmailHtml(params, Boolean(logo)),
      ...(logo
        ? {
            attachments: [
              {
                filename: 'almamundi-logo.png',
                content: logo,
                contentType: 'image/png',
                contentId: LOGO_CID,
              },
            ],
          }
        : {}),
    });
    if (sent.error) {
      const msg = sent.error.message || 'Error de Resend';
      console.error('sendReceivedEmail', sent.error);
      return { ok: false, error: msg };
    }
    return { ok: true, emailId: sent.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al enviar el correo';
    console.error('sendReceivedEmail', err);
    return { ok: false, error: msg };
  }
}
