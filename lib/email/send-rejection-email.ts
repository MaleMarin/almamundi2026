/**
 * Correo al autor cuando su historia no se publica (curación).
 * Tono respetuoso, motivo claro, canal para pedir una nueva revisión.
 */

import { escapeHtml } from "@/lib/email-html";
import { getResend } from "@/lib/emailSubmission";
import {
  absoluteEmailUrl,
  EMAIL_BOX,
  EMAIL_FONT,
  EMAIL_INK,
  emailShell,
  greetingHtml,
  paragraphHtml,
} from "@/lib/email/almamundi-email-layout";
import { noteEmailSent } from "@/lib/ops/usage-state";

export const REJECTION_CONTACT_EMAIL = "hola@almamundi.org";

export function rejectionContactUrl(): string {
  return absoluteEmailUrl("/contacto");
}

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

export function buildRejectionEmailHtml(params: SendRejectionEmailParams): string {
  const greeting = greetingLine(params.authorName);
  const storyTitle = escapeHtml(params.storyTitle.trim() || "tu historia");
  const reason = escapeHtml(params.publicReason);
  const contact = escapeHtml(REJECTION_CONTACT_EMAIL);
  const contactUrl = escapeHtml(rejectionContactUrl());

  const bodyHtml = `
      ${greetingHtml(greeting)}
      ${paragraphHtml(`Revisamos tu historia <strong>"${storyTitle}"</strong> y, en esta ocasión,
        no la vamos a publicar en AlmaMundi.`)}
      ${paragraphHtml("El motivo es este:")}
      <p class="email-text email-box" style="margin:0 0 24px;padding:16px 18px;background:${EMAIL_BOX};border-radius:8px;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">
        ${reason}
      </p>
      ${paragraphHtml(`Si no estás de acuerdo, puedes escribirnos a
        <a href="mailto:${contact}" class="email-link" style="color:#FF4A1C;text-decoration:underline;">${contact}</a>
        y pedir que volvamos a revisar la decisión.
        También puedes usar
        <a href="${contactUrl}" class="email-link" style="color:#FF4A1C;text-decoration:underline;">el formulario de contacto</a>.`)}
      ${paragraphHtml("Gracias por habernos confiado tu historia.")}
      ${paragraphHtml("Un abrazo,<br>Equipo AlmaMundi", "0")}`;

  return emailShell({ bodyHtml });
}

export function buildRejectionEmailText(params: SendRejectionEmailParams): string {
  const name = params.authorName.trim();
  const greeting = name ? `Hola ${name},` : "Hola,";
  const storyTitle = params.storyTitle.trim() || "tu historia";
  return [
    greeting,
    "",
    `Revisamos tu historia "${storyTitle}" y, en esta ocasión, no la vamos a publicar en AlmaMundi.`,
    "",
    "El motivo es este:",
    params.publicReason.trim(),
    "",
    `Si no estás de acuerdo, puedes escribirnos a ${REJECTION_CONTACT_EMAIL} y pedir que volvamos a revisar la decisión.`,
    `También puedes usar el formulario de contacto: ${rejectionContactUrl()}`,
    "",
    "Gracias por habernos confiado tu historia.",
    "",
    "Un abrazo,",
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
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = "Sobre tu historia en AlmaMundi";

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
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
