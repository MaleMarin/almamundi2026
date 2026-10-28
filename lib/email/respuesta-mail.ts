/**
 * Correos de una respuesta corta. Solo español, el mismo canal que las historias.
 * El cuerpo no incluye el texto, la voz ni la foto.
 */

import { escapeHtml, isValidRecipientEmail } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  AUTHOR_REPLY_TO,
  EMAIL_CONTACT_ADDRESS,
  emailShell,
  greetingHtml,
  paragraphHtml,
  primaryButtonHtml,
} from "@/lib/email/almamundi-email-layout";
import { capitalizeAlias } from "@/lib/email/received-email-template";
import { getResend } from "@/lib/emailSubmission";
import { noteEmailSent } from "@/lib/ops/usage-state";

export type RespuestaMailResult = { ok: true } | { ok: false };

function mailFromAddress(): string {
  const raw = (
    process.env.RESEND_FROM_EMAIL ??
    process.env.MAIL_FROM ??
    "AlmaMundi <hola@almamundi.org>"
  ).trim();
  if (!raw) return "AlmaMundi <hola@almamundi.org>";
  return raw.includes("<") ? raw : `AlmaMundi <${raw}>`;
}

function hello(alias: string): string {
  const name = capitalizeAlias(alias);
  return name ? `Hola, ${name}:` : "Hola:";
}

function contactLine(): string {
  const mail = escapeHtml(EMAIL_CONTACT_ADDRESS);
  return paragraphHtml(
    `¿Tienes dudas? Escríbenos a <a href="mailto:${mail}" class="email-link" style="color:#D13D17;text-decoration:underline;">${mail}</a>.`,
    "0 0 16px"
  );
}

async function deliver(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<RespuestaMailResult> {
  if (!isValidRecipientEmail(opts.to)) return { ok: false };
  const resend = getResend();
  if (!resend) return { ok: false };
  try {
    const sent = await resend.emails.send({
      from: mailFromAddress(),
      to: opts.to.trim(),
      replyTo: AUTHOR_REPLY_TO,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (sent.error) {
      console.error("[respuesta-mail] Resend no aceptó el correo");
      return { ok: false };
    }
    await noteEmailSent();
    return { ok: true };
  } catch {
    console.error("[respuesta-mail] no se pudo enviar");
    return { ok: false };
  }
}

export async function sendRespuestaReceivedEmail(opts: {
  to: string;
  alias: string;
}): Promise<RespuestaMailResult> {
  const greeting = hello(opts.alias);
  const html = emailShell({
    preheader: "Recibimos tu respuesta",
    footer: "respuesta",
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(
        "Recibimos tu respuesta a la pregunta de la semana. La revisaremos y te escribiremos si aparece en el mapa."
      ),
      paragraphHtml("Qué pasa ahora", "0 0 8px"),
      paragraphHtml("1. Revisamos tu respuesta.", "0 0 8px"),
      paragraphHtml("2. Si cumple los términos de uso, la publicamos.", "0 0 8px"),
      paragraphHtml("3. Te enviamos el enlace por correo.", "0 0 16px"),
      contactLine(),
      paragraphHtml("Gracias por responder.<br>Equipo AlmaMundi", "0"),
    ].join(""),
  });
  const text = [
    greeting,
    "",
    "Recibimos tu respuesta a la pregunta de la semana. La revisaremos y te escribiremos si aparece en el mapa.",
    "",
    "Qué pasa ahora",
    "1. Revisamos tu respuesta.",
    "2. Si cumple los términos de uso, la publicamos.",
    "3. Te enviamos el enlace por correo.",
    "",
    `¿Tienes dudas? Escríbenos a ${EMAIL_CONTACT_ADDRESS}.`,
    "",
    "Gracias por responder.",
    "Equipo AlmaMundi",
  ].join("\n");
  return deliver({
    to: opts.to,
    subject: "Recibimos tu respuesta",
    html,
    text,
  });
}

export async function sendRespuestaPublishedEmail(opts: {
  to: string;
  alias: string;
  questionId: string;
}): Promise<RespuestaMailResult> {
  const greeting = hello(opts.alias);
  const url = absoluteEmailUrl(`/pregunta/${encodeURIComponent(opts.questionId)}`);
  const html = emailShell({
    preheader: "Tu respuesta ya está en AlmaMundi",
    footer: "respuesta",
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(
        "Tu respuesta ya está publicada. Cualquier persona puede verla junto a las demás respuestas de esta pregunta."
      ),
      primaryButtonHtml("Ver la pregunta", url),
      paragraphHtml("Gracias por responder.<br>Equipo AlmaMundi", "0"),
    ].join(""),
  });
  const text = [
    greeting,
    "",
    "Tu respuesta ya está publicada. Cualquier persona puede verla junto a las demás respuestas de esta pregunta.",
    "",
    `Ver la pregunta: ${url}`,
    "",
    "Gracias por responder.",
    "Equipo AlmaMundi",
  ].join("\n");
  return deliver({
    to: opts.to,
    subject: "Tu respuesta ya está en AlmaMundi",
    html,
    text,
  });
}

export async function sendRespuestaRejectedEmail(opts: {
  to: string;
  alias: string;
}): Promise<RespuestaMailResult> {
  const greeting = hello(opts.alias);
  const url = absoluteEmailUrl("/pregunta");
  const html = emailShell({
    preheader: "Sobre tu respuesta en AlmaMundi",
    footer: "respuesta",
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(
        "Revisamos tu respuesta y esta vez no la publicaremos. Si quieres, puedes enviar otra."
      ),
      primaryButtonHtml("Responder de nuevo", url),
      contactLine(),
      paragraphHtml("Equipo AlmaMundi", "0"),
    ].join(""),
  });
  const text = [
    greeting,
    "",
    "Revisamos tu respuesta y esta vez no la publicaremos. Si quieres, puedes enviar otra.",
    "",
    `Responder de nuevo: ${url}`,
    "",
    `¿Tienes dudas? Escríbenos a ${EMAIL_CONTACT_ADDRESS}.`,
    "",
    "Equipo AlmaMundi",
  ].join("\n");
  return deliver({
    to: opts.to,
    subject: "Sobre tu respuesta en AlmaMundi",
    html,
    text,
  });
}
