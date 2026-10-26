/**
 * Correo al autor cuando su historia no se publica (curación).
 * Tono respetuoso, motivo claro, canal para pedir una nueva revisión.
 */

import { escapeHtml } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  AUTHOR_REPLY_TO,
  EMAIL_BOX,
  EMAIL_FONT,
  EMAIL_INK,
  emailShell,
  greetingHtml,
  paragraphHtml,
} from "@/lib/email/almamundi-email-layout";
import { capitalizeAlias } from "@/lib/email/received-email-template";

export const REJECTION_CONTACT_EMAIL = "hola@almamundi.org";

function storyTitleLine(storyTitle: string): string {
  return storyTitle.replace(/[\r\n]+/g, " ").trim().slice(0, 200) || "tu historia";
}

export function rejectionEmailSubject(storyTitle: string): string {
  return `Sobre tu historia «${storyTitleLine(storyTitle)}» en AlmaMundi`;
}

export type SendRejectionEmailParams = {
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  publicReason: string;
};

function greetingLine(authorName: string): string {
  const alias = capitalizeAlias(authorName);
  return alias ? `Hola, ${alias}:` : "Hola:";
}

export function buildRejectionEmailHtml(params: SendRejectionEmailParams): string {
  const greeting = escapeHtml(greetingLine(params.authorName));
  const storyTitle = escapeHtml(storyTitleLine(params.storyTitle));
  const reason = escapeHtml(params.publicReason.trim());
  const contact = escapeHtml(REJECTION_CONTACT_EMAIL);

  const bodyHtml = `
      ${greetingHtml(greeting)}
      ${paragraphHtml(`Revisamos tu historia «${storyTitle}» y esta vez no podremos publicarla en AlmaMundi.`)}
      <p class="email-text email-box" style="margin:0 0 24px;padding:16px 18px;background:${EMAIL_BOX};border-radius:8px;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">
        Motivo: ${reason}
      </p>
      ${paragraphHtml(`Si crees que hubo un error, responde este correo o escríbenos a
        <a href="mailto:${contact}" class="email-link" style="color:#FF4A1C;text-decoration:underline;">${contact}</a>
        y volveremos a revisarla.`)}
      ${paragraphHtml("Gracias por confiarnos tu historia.<br>Equipo AlmaMundi", "0")}`;

  return emailShell({ bodyHtml });
}

export function buildRejectionEmailText(params: SendRejectionEmailParams): string {
  const storyTitle = storyTitleLine(params.storyTitle);
  return [
    greetingLine(params.authorName),
    "",
    `Revisamos tu historia «${storyTitle}» y esta vez no podremos publicarla en AlmaMundi.`,
    "",
    `Motivo: ${params.publicReason.trim()}`,
    "",
    `Si crees que hubo un error, responde este correo o escríbenos a ${REJECTION_CONTACT_EMAIL} y volveremos a revisarla.`,
    "",
    "Gracias por confiarnos tu historia.",
    "Equipo AlmaMundi",
    "",
    `Política de privacidad: ${absoluteEmailUrl("/privacidad")}`,
    "Recibiste este correo porque enviaste una historia en AlmaMundi.",
  ].join("\n");
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
  const { getResend } = await import("@/lib/emailSubmission");
  const { noteEmailSent } = await import("@/lib/ops/usage-state");
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = rejectionEmailSubject(params.storyTitle);

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      replyTo: AUTHOR_REPLY_TO,
      subject,
      html: buildRejectionEmailHtml(params),
      text: buildRejectionEmailText(params),
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
