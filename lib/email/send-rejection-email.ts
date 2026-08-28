/**
 * Correo al autor cuando su historia no se publica (curación).
 * Tono respetuoso, motivo claro, canal para pedir una nueva revisión.
 */

import { escapeHtml } from "@/lib/email-html";
import { getResend } from "@/lib/emailSubmission";
import {
  brandHeaderHtml,
  EMAIL_PUBLIC_ORIGIN,
  emailLogoAttachment,
  emailShell,
  loadInlineWordmark,
} from "@/lib/email/almamundi-email-layout";
import { noteEmailSent } from "@/lib/ops/usage-state";

export const REJECTION_CONTACT_EMAIL = "hola@almamundi.org";
export const REJECTION_CONTACT_URL = `${EMAIL_PUBLIC_ORIGIN}/contacto`;

export type SendRejectionEmailParams = {
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  publicReason: string;
};

function greetingLine(authorName: string): string {
  const n = authorName.trim();
  return n ? `Hola ${escapeHtml(n)},` : "Hola,";
}

export function buildRejectionEmailHtml(
  params: SendRejectionEmailParams,
  hasInlineLogo = false
): string {
  const greeting = greetingLine(params.authorName);
  const storyTitle = escapeHtml(params.storyTitle.trim() || "tu historia");
  const reason = escapeHtml(params.publicReason);
  const contact = escapeHtml(REJECTION_CONTACT_EMAIL);
  const contactUrl = REJECTION_CONTACT_URL;

  const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568;line-height:1.6">
        Revisamos tu historia <strong>"${storyTitle}"</strong> y, en esta ocasión,
        no la vamos a publicar en AlmaMundi.
      </p>
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568;line-height:1.6">
        El motivo es este:
      </p>
      <p style="margin:0 0 24px;padding:16px 18px;background:#f7f8fb;border-radius:12px;font-size:16px;color:#4A5568;line-height:1.6">
        ${reason}
      </p>
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568;line-height:1.6">
        Si no estás de acuerdo, puedes escribirnos a
        <a href="mailto:${contact}" style="color:#FF4A1C;text-decoration:underline">${contact}</a>
        y pedir que volvamos a revisar la decisión.
        También puedes usar
        <a href="${contactUrl}" style="color:#FF4A1C;text-decoration:underline">el formulario de contacto</a>.
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#4A5568;line-height:1.6">
        Gracias por habernos confiado tu historia.
      </p>
      <p style="margin:0;font-size:16px;color:#4A5568;line-height:1.6">
        Un abrazo,<br>
        Equipo AlmaMundi
      </p>`;

  return emailShell({
    headerHtml: brandHeaderHtml(hasInlineLogo),
    bodyHtml,
  });
}

export type SendRejectionEmailResult =
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

export async function sendRejectionEmail(
  params: SendRejectionEmailParams
): Promise<SendRejectionEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = "Sobre tu historia en AlmaMundi";
  const logo = await loadInlineWordmark();

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildRejectionEmailHtml(params, Boolean(logo)),
      ...(logo ? { attachments: [emailLogoAttachment(logo)] } : {}),
    });
    if (sent.error) {
      const msg = sent.error.message || "Error de Resend";
      console.error("sendRejectionEmail", sent.error);
      return { ok: false, error: msg };
    }
    await noteEmailSent();
    return { ok: true, emailId: sent.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar el correo";
    console.error("sendRejectionEmail", err);
    return { ok: false, error: msg };
  }
}
