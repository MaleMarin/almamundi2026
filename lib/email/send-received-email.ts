/**
 * Correo inmediato al autor cuando AlmaMundi recibe su historia (antes de curación).
 * No incluye el enlace de la ficha: todavía no es pública.
 */

import { getResend } from "@/lib/emailSubmission";
import { AUTHOR_REPLY_TO } from "@/lib/email/almamundi-email-layout";
import { noteEmailSent } from "@/lib/ops/usage-state";
import {
  buildReceivedEmailHtml,
  buildReceivedEmailText,
  receivedEmailSubject,
  type ReceivedEmailContent,
} from "@/lib/email/received-email-template";

export type { ReceivedEmailContent, ReceivedFormatLabel } from "@/lib/email/received-email-template";
export {
  buildReceivedEmailHtml,
  buildReceivedEmailText,
  capitalizeAlias,
  formatSubmissionDate,
  receivedEmailSubject,
  storyFormatLabel,
} from "@/lib/email/received-email-template";

export type SendReceivedEmailParams = ReceivedEmailContent & {
  authorEmail: string;
};

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
  const subject = receivedEmailSubject(params.storyTitle);
  const content: ReceivedEmailContent = {
    authorName: params.authorName,
    storyTitle: params.storyTitle,
    format: params.format,
    submittedAt: params.submittedAt,
  };

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      replyTo: AUTHOR_REPLY_TO,
      subject,
      html: buildReceivedEmailHtml(content),
      text: buildReceivedEmailText(content),
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
