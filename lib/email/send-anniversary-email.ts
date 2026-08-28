/**
 * Correo de aniversario: un año después de publicar una historia.
 */

import { escapeHtml } from "@/lib/email-html";
import { getResend } from "@/lib/emailSubmission";
import {
  brandHeaderHtml,
  EMAIL_PUBLIC_ORIGIN,
  emailLogoAttachment,
  emailShell,
  invitationHtml,
  loadInlineWordmark,
} from "@/lib/email/almamundi-email-layout";
import { noteEmailSent } from "@/lib/ops/usage-state";

export type SendAnniversaryEmailParams = {
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  storyId: string;
};

function greetingLine(authorName: string): string {
  const n = authorName.trim();
  return n ? `Hola ${escapeHtml(n)},` : "Hola,";
}

export function buildAnniversaryEmailHtml(
  params: SendAnniversaryEmailParams,
  hasInlineLogo = false
): string {
  const greeting = greetingLine(params.authorName);
  const storyTitle = escapeHtml(params.storyTitle.trim() || "tu historia");
  const historiasUrl = `${EMAIL_PUBLIC_ORIGIN}/historias/${encodeURIComponent(params.storyId)}`;

  const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568;line-height:1.6">
        Hace un año contaste tu historia en AlmaMundi.
      </p>
      <p style="margin:0 0 24px;padding:16px 18px;background:#f7f8fb;border-radius:12px;font-size:16px;color:#4A5568;line-height:1.6">
        <strong>"${storyTitle}"</strong>
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#4A5568;line-height:1.6">
        Puedes volver a verla cuando quieras, y si tienes otra que contar, la puerta sigue abierta.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
        <tr>
          <td style="background:#FF4A1C;border-radius:100px;padding:14px 32px">
            <a href="${historiasUrl}"
              style="color:white;text-decoration:none;
              font-size:13px;font-weight:700;
              letter-spacing:0.1em;text-transform:uppercase">
              VER MI HISTORIA
            </a>
          </td>
        </tr>
      </table>
      ${invitationHtml()}
      <p style="margin:0;font-size:16px;color:#4A5568;line-height:1.6">
        Un abrazo,<br>
        Equipo AlmaMundi
      </p>`;

  return emailShell({
    headerHtml: brandHeaderHtml(hasInlineLogo),
    bodyHtml,
  });
}

export type SendAnniversaryEmailResult =
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

export async function sendAnniversaryEmail(
  params: SendAnniversaryEmailParams
): Promise<SendAnniversaryEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = "Hace un año contaste tu historia en AlmaMundi";
  const logo = await loadInlineWordmark();

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildAnniversaryEmailHtml(params, Boolean(logo)),
      ...(logo ? { attachments: [emailLogoAttachment(logo)] } : {}),
    });
    if (sent.error) {
      const msg = sent.error.message || "Error de Resend";
      console.error("sendAnniversaryEmail", sent.error);
      return { ok: false, error: msg };
    }
    await noteEmailSent();
    return { ok: true, emailId: sent.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar el correo";
    console.error("sendAnniversaryEmail", err);
    return { ok: false, error: msg };
  }
}
