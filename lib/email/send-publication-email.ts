/**
 * Correo al autor cuando su historia queda publicada en el mapa (curación).
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

export type SendPublicationEmailParams = {
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  storyId: string;
  placeName: string;
};

export function buildPublicationEmailHtml(
  params: SendPublicationEmailParams,
  hasInlineLogo = false
): string {
  const authorName = escapeHtml(params.authorName);
  const storyTitle = escapeHtml(params.storyTitle);
  const placeName = escapeHtml(params.placeName);
  const storyIdEnc = encodeURIComponent(params.storyId);
  const historiasUrl = `${EMAIL_PUBLIC_ORIGIN}/historias/${storyIdEnc}`;

  const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568">
        Hola ${authorName},
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#4A5568;line-height:1.6">
        Tu historia <strong>"${storyTitle}"</strong> ya está
        publicada en el mapa de AlmaMundi.
        Puede verse desde cualquier parte del mundo.
      </p>
      <p style="margin:0 0 32px;font-size:16px;color:#4A5568;line-height:1.6">
        La historia fue anclada en <strong>${placeName}</strong>
        y forma parte del archivo de historias humanas de Precisar.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
        <tr>
          <td style="background:#FF4A1C;border-radius:100px;padding:14px 32px">
            <a href="${historiasUrl}"
              style="color:white;text-decoration:none;
              font-size:13px;font-weight:700;
              letter-spacing:0.1em;text-transform:uppercase">
              VER MI HISTORIA EN EL MAPA
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

export type SendPublicationEmailResult =
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

export async function sendPublicationEmail(
  params: SendPublicationEmailParams
): Promise<SendPublicationEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = "Tu historia ya está en AlmaMundi";
  const logo = await loadInlineWordmark();

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildPublicationEmailHtml(params, Boolean(logo)),
      ...(logo ? { attachments: [emailLogoAttachment(logo)] } : {}),
    });
    if (sent.error) {
      const msg = sent.error.message || "Error de Resend";
      console.error("sendPublicationEmail", sent.error);
      return { ok: false, error: msg };
    }
    await noteEmailSent();
    return { ok: true, emailId: sent.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar el correo";
    console.error("sendPublicationEmail", err);
    return { ok: false, error: msg };
  }
}
