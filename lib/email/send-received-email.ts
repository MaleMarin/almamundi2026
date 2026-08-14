/**
 * Correo inmediato al autor cuando AlmaMundi recibe su historia (antes de curación).
 * El encabezado va en texto ("AlmaMundi"): los PNG de /public cargan en el
 * navegador, pero en clientes de correo el logo sale roto.
 */

import { escapeHtml } from '@/lib/email-html';
import { getResend } from '@/lib/emailSubmission';

const EMAIL_PUBLIC_ORIGIN = 'https://www.almamundi.org';

export type SendReceivedEmailParams = {
  /** Vacío si la persona no dejó nombre ni alias. */
  authorName: string;
  authorEmail: string;
};

function greetingLine(authorName: string): string {
  const n = authorName.trim();
  return n ? `Hola ${escapeHtml(n)},` : 'Hola,';
}

export function buildReceivedEmailHtml(params: SendReceivedEmailParams): string {
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

  <!-- Header: nombre en texto (sin imagen: en el correo el PNG sale roto) -->
  <tr>
    <td style="padding:32px 40px 24px;text-align:center;
      border-bottom:1px solid rgba(255,255,255,0.6)">
      <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.04em;color:#2D3748;font-family:Arial,sans-serif">
        AlmaMundi
      </p>
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

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildReceivedEmailHtml(params),
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
