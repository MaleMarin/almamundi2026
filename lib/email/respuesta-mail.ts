/**
 * Correos de una respuesta corta, en el idioma guardado al enviarla.
 * El cuerpo no incluye el texto, la voz ni la foto.
 */

import { escapeHtml, isValidRecipientEmail } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  authorEmailFooterNote,
  AUTHOR_REPLY_TO,
  EMAIL_BOX,
  EMAIL_CONTACT_ADDRESS,
  EMAIL_FONT,
  EMAIL_INK,
  emailShell,
  greetingHtml,
  paragraphHtml,
  primaryButtonHtml,
} from "@/lib/email/almamundi-email-layout";
import { capitalizeAlias } from "@/lib/email/received-email-template";
import type { AlmaLocale } from "@/lib/i18n/locale";
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

function hello(alias: string, locale: AlmaLocale = "es"): string {
  const name = capitalizeAlias(alias);
  if (locale === "pt") return name ? `Olá, ${name}:` : "Olá:";
  if (locale === "en") return name ? `Hi ${name},` : "Hi,";
  return name ? `Hola, ${name}:` : "Hola:";
}

function respuestaCopy(locale: AlmaLocale) {
  if (locale === "pt") {
    return {
      receivedSubject: "Recebemos sua resposta",
      receivedBody:
        "Recebemos sua resposta à pergunta da semana. Vamos revisá-la e escrever se ela aparecer no mapa.",
      now: "O que acontece agora",
      step1: "1. Revisamos sua resposta.",
      step2: "2. Se cumprir os termos de uso, publicamos.",
      step3: "3. Enviamos o link por e-mail.",
      doubts: "Tem dúvidas? Escreva para",
      thanks: "Agradecemos sua resposta.<br>Equipe AlmaMundi",
      thanksText: "Agradecemos sua resposta.",
      team: "Equipe AlmaMundi",
      publishedSubject: "Sua resposta já está no AlmaMundi",
      publishedBody:
        "Sua resposta já está publicada. Qualquer pessoa pode vê-la junto com as outras respostas desta pergunta.",
      see: "Ver a pergunta",
      rejectedSubject: "Sobre sua resposta no AlmaMundi",
      rejectedBody: "Revisamos sua resposta e, desta vez, não vamos publicá-la. Se quiser, você pode enviar outra.",
      reason: "Motivo",
      again: "Responder de novo",
    };
  }
  if (locale === "en") {
    return {
      receivedSubject: "We received your answer",
      receivedBody:
        "We received your answer to the question of the week. We will review it and write to you if it appears on the map.",
      now: "What happens now",
      step1: "1. We review your answer.",
      step2: "2. If it meets the terms of use, we publish it.",
      step3: "3. We send you the link by email.",
      doubts: "Questions? Write to",
      thanks: "Thank you for answering.<br>The AlmaMundi team",
      thanksText: "Thank you for answering.",
      team: "The AlmaMundi team",
      publishedSubject: "Your answer is now on AlmaMundi",
      publishedBody:
        "Your answer is now published. Anyone can see it alongside the other answers to this question.",
      see: "See the question",
      rejectedSubject: "About your answer on AlmaMundi",
      rejectedBody: "We reviewed your answer and this time we will not publish it. If you want, you can send another.",
      reason: "Reason",
      again: "Answer again",
    };
  }
  return {
    receivedSubject: "Recibimos tu respuesta",
    receivedBody:
      "Recibimos tu respuesta a la pregunta de la semana. La revisaremos y te escribiremos si aparece en el mapa.",
    now: "Qué pasa ahora",
    step1: "1. Revisamos tu respuesta.",
    step2: "2. Si cumple los términos de uso, la publicamos.",
    step3: "3. Te enviamos el enlace por correo.",
    doubts: "¿Tienes dudas? Escríbenos a",
    thanks: "Gracias por responder.<br>Equipo AlmaMundi",
    thanksText: "Gracias por responder.",
    team: "Equipo AlmaMundi",
    publishedSubject: "Tu respuesta ya está en AlmaMundi",
    publishedBody:
      "Tu respuesta ya está publicada. Cualquier persona puede verla junto a las demás respuestas de esta pregunta.",
    see: "Ver la pregunta",
    rejectedSubject: "Sobre tu respuesta en AlmaMundi",
    rejectedBody: "Revisamos tu respuesta y esta vez no la publicaremos. Si quieres, puedes enviar otra.",
    reason: "Motivo",
    again: "Responder de nuevo",
  };
}

function mailLang(locale: AlmaLocale | undefined): AlmaLocale {
  return locale === "pt" || locale === "en" ? locale : "es";
}

function reasonSentence(reason: string): string {
  const text = reason.trim();
  if (!text || /[.!?…]$/.test(text)) return text;
  return `${text}.`;
}

function contactLine(locale: AlmaLocale): string {
  const mail = escapeHtml(EMAIL_CONTACT_ADDRESS);
  return paragraphHtml(
    `${respuestaCopy(locale).doubts} <a href="mailto:${mail}" class="email-link" style="color:#FF4A1C;font-weight:600;text-decoration:underline;">${mail}</a>.`,
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
  locale?: AlmaLocale;
}): Promise<RespuestaMailResult> {
  const locale = mailLang(opts.locale);
  const copy = respuestaCopy(locale);
  const greeting = hello(opts.alias, locale);
  const html = emailShell({
    preheader: copy.receivedSubject,
    footer: "respuesta",
    locale,
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(copy.receivedBody),
      paragraphHtml(copy.now, "0 0 8px"),
      paragraphHtml(copy.step1, "0 0 8px"),
      paragraphHtml(copy.step2, "0 0 8px"),
      paragraphHtml(copy.step3, "0 0 16px"),
      contactLine(locale),
      paragraphHtml(copy.thanks, "0"),
    ].join(""),
  });
  const text = [
    greeting,
    "",
    copy.receivedBody,
    "",
    copy.now,
    copy.step1,
    copy.step2,
    copy.step3,
    "",
    `${copy.doubts} ${EMAIL_CONTACT_ADDRESS}.`,
    "",
    copy.thanksText,
    copy.team,
    "",
    authorEmailFooterNote(locale, "respuesta"),
  ].join("\n");
  return deliver({
    to: opts.to,
    subject: copy.receivedSubject,
    html,
    text,
  });
}

export async function sendRespuestaPublishedEmail(opts: {
  to: string;
  alias: string;
  questionId: string;
  locale?: AlmaLocale;
}): Promise<RespuestaMailResult> {
  const locale = mailLang(opts.locale);
  const copy = respuestaCopy(locale);
  const greeting = hello(opts.alias, locale);
  const url = absoluteEmailUrl(`/pregunta/${encodeURIComponent(opts.questionId)}`);
  const html = emailShell({
    preheader: copy.publishedSubject,
    footer: "respuesta",
    locale,
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(copy.publishedBody),
      primaryButtonHtml(copy.see, url),
      paragraphHtml(copy.thanks, "0"),
    ].join(""),
  });
  const text = [
    greeting,
    "",
    copy.publishedBody,
    "",
    `${copy.see}: ${url}`,
    "",
    copy.thanksText,
    copy.team,
    "",
    authorEmailFooterNote(locale, "respuesta"),
  ].join("\n");
  return deliver({
    to: opts.to,
    subject: copy.publishedSubject,
    html,
    text,
  });
}

export async function sendRespuestaRejectedEmail(opts: {
  to: string;
  alias: string;
  locale?: AlmaLocale;
  publicReason: string;
}): Promise<RespuestaMailResult> {
  const locale = mailLang(opts.locale);
  const copy = respuestaCopy(locale);
  const greeting = hello(opts.alias, locale);
  const url = absoluteEmailUrl("/pregunta");
  const reason = escapeHtml(reasonSentence(opts.publicReason));
  const html = emailShell({
    preheader: copy.rejectedSubject,
    footer: "respuesta",
    locale,
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(copy.rejectedBody),
      `<p class="email-text email-box" style="margin:0 0 24px;padding:16px 18px;background:${EMAIL_BOX};border-radius:8px;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">${copy.reason}: ${reason}</p>`,
      primaryButtonHtml(copy.again, url),
      contactLine(locale),
      paragraphHtml(copy.team, "0"),
    ].join(""),
  });
  const text = [
    greeting,
    "",
    copy.rejectedBody,
    "",
    `${copy.reason}: ${reasonSentence(opts.publicReason)}`,
    "",
    `${copy.again}: ${url}`,
    "",
    `${copy.doubts} ${EMAIL_CONTACT_ADDRESS}.`,
    "",
    copy.team,
    "",
    authorEmailFooterNote(locale, "respuesta"),
  ].join("\n");
  return deliver({
    to: opts.to,
    subject: copy.rejectedSubject,
    html,
    text,
  });
}
