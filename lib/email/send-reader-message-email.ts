/**
 * Correo al autor cuando alguien deja un mensaje al leer su historia.
 * No incluye datos de quien escribió ni replyTo: no se puede responder directo.
 */

import { escapeHtml } from "@/lib/email-html";
import { getResend } from "@/lib/emailSubmission";
import {
  emailShell,
  invitationHtml,
} from "@/lib/email/almamundi-email-layout";
import { noteEmailSent } from "@/lib/ops/usage-state";

export type SendReaderMessageEmailParams = {
  /** Vacío si la persona no dejó nombre ni alias. */
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  readerMessage: string;
};

function greetingLine(authorName: string): string {
  const n = authorName.trim();
  return n ? `Hola ${escapeHtml(n)},` : "Hola,";
}

function messageBlockHtml(readerMessage: string): string {
  const escaped = escapeHtml(readerMessage).replace(/\r\n|\r|\n/g, "<br>");
  return `<p style="margin:0;font-size:16px;color:#2D3748;line-height:1.7">${escaped}</p>`;
}

export function buildReaderMessageEmailHtml(params: SendReaderMessageEmailParams): string {
  const storyTitle = escapeHtml(params.storyTitle.trim() || "tu historia");
  const greeting = greetingLine(params.authorName);
  const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568">
        ${greeting}
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#4A5568;line-height:1.6">
        Alguien que leyó tu historia <strong>"${storyTitle}"</strong> en AlmaMundi
        te dejó este mensaje:
      </p>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px">
        <tr>
          <td style="background:#ffffff;border-radius:16px;padding:20px 22px;
            border:1px solid rgba(74,85,104,0.12)">
            ${messageBlockHtml(params.readerMessage)}
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px;font-size:16px;color:#4A5568;line-height:1.6">
        Este correo es un reenvío. No incluye datos de quien escribió,
        y no se puede responder directo desde aquí.
      </p>
      ${invitationHtml()}
      <p style="margin:0;font-size:16px;color:#4A5568;line-height:1.6">
        Un abrazo,<br>
        Equipo AlmaMundi
      </p>`;

  return emailShell({ bodyHtml });
}

export type SendReaderMessageEmailResult =
  | { ok: true; emailId?: string }
  | { ok: false; error: string };

function mailFromAddress(): string {
  const raw = (
    process.env.RESEND_FROM_EMAIL ??
    process.env.MAIL_FROM ??
    "AlmaMundi <hola@almamundi.org>"
  ).trim();
  if (!raw) return "AlmaMundi <hola@almamundi.org>";
  return raw.includes("<") ? raw : `AlmaMundi <${raw}>`;
}

export async function sendReaderMessageEmail(
  params: SendReaderMessageEmailParams
): Promise<SendReaderMessageEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = "Alguien leyó tu historia en AlmaMundi";

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildReaderMessageEmailHtml(params),
    });
    if (sent.error) {
      const msg = sent.error.message || "Error de Resend";
      console.error("sendReaderMessageEmail", sent.error);
      return { ok: false, error: msg };
    }
    await noteEmailSent();
    return { ok: true, emailId: sent.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar el correo";
    console.error("sendReaderMessageEmail", err);
    return { ok: false, error: msg };
  }
}
