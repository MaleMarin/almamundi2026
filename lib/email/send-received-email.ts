/**
 * Correo inmediato al autor cuando AlmaMundi recibe su historia (antes de curación).
 *
 * El wordmark va embebido (CID). No usar PNG remotos de almamundi.org:
 * Gmail a veces no los carga y aparecen como iconos rotos.
 */

import { escapeHtml } from "@/lib/email-html";
import { getResend } from "@/lib/emailSubmission";
import {
  brandHeaderHtml,
  emailLogoAttachment,
  emailShell,
  invitationHtml,
  loadInlineWordmark,
} from "@/lib/email/almamundi-email-layout";
import { noteEmailSent } from "@/lib/ops/usage-state";

export type SendReceivedEmailParams = {
  /** Vacío si la persona no dejó nombre ni alias. */
  authorName: string;
  authorEmail: string;
};

function greetingLine(authorName: string): string {
  const n = authorName.trim();
  return n ? `Hola ${escapeHtml(n)},` : "Hola,";
}

export function buildReceivedEmailHtml(
  params: SendReceivedEmailParams,
  hasInlineLogo = false
): string {
  const greeting = greetingLine(params.authorName);
  const bodyHtml = `
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

export type SendReceivedEmailResult =
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

export async function sendReceivedEmail(
  params: SendReceivedEmailParams
): Promise<SendReceivedEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = "Recibimos tu historia";
  const logo = await loadInlineWordmark();

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildReceivedEmailHtml(params, Boolean(logo)),
      ...(logo ? { attachments: [emailLogoAttachment(logo)] } : {}),
    });
    if (sent.error) {
      const msg = sent.error.message || "Error de Resend";
      console.error("sendReceivedEmail", sent.error);
      return { ok: false, error: msg };
    }
    await noteEmailSent();
    return { ok: true, emailId: sent.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar el correo";
    console.error("sendReceivedEmail", err);
    return { ok: false, error: msg };
  }
}
