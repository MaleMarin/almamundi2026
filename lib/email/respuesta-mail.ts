/**
 * Correos de una respuesta corta, en el idioma guardado al enviarla.
 * El cuerpo no incluye el texto, la voz ni la foto.
 */

import { escapeHtml, isValidRecipientEmail } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  authorEmailFooterNote,
  AUTHOR_REPLY_TO,
  conductaHtml,
  conductaText,
  EMAIL_BOX,
  EMAIL_CONTACT_ADDRESS,
  EMAIL_FONT,
  EMAIL_INK,
  emailActionsText,
  emailShell,
  greetingHtml,
  paragraphHtml,
  primaryButtonHtml,
} from "@/lib/email/almamundi-email-layout";
import { capitalizeAlias } from "@/lib/email/received-email-template";
import type { AlmaLocale } from "@/lib/i18n/locale";

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

export function hello(alias: string, locale: AlmaLocale = "es"): string {
  const name = capitalizeAlias(alias);
  if (locale === "pt") return name ? `Olá, ${name}:` : "Olá:";
  if (locale === "en") return name ? `Hi ${name},` : "Hi,";
  return name ? `Hola, ${name}:` : "Hola:";
}

function quotedQuestion(question: string, html: boolean): string {
  const text = question.trim();
  return `«${html ? escapeHtml(text) : text}»`;
}

export type Asker = { alias: string; place: string };

function quien(asker: Asker, html: boolean): string {
  const name = capitalizeAlias(asker.alias) || asker.alias;
  return html ? escapeHtml(name) : name;
}

function donde(asker: Asker, html: boolean): string {
  return html ? escapeHtml(asker.place) : asker.place;
}

function receivedBody(locale: AlmaLocale, question: string, html: boolean, asker?: Asker): string {
  const q = quotedQuestion(question, html);
  if (asker) {
    const a = quien(asker, html);
    const lugar = asker.place ? donde(asker, html) : '';
    if (locale === "pt") {
      return `Recebemos sua resposta a ${q}, que ${a} deixou${lugar ? ` de ${lugar}` : ""}. Uma pessoa da equipe vai lê-la antes de publicá-la.`;
    }
    if (locale === "en") {
      return `We received your answer to ${q}, asked by ${a}${lugar ? ` from ${lugar}` : ""}. Someone on our team will read it before it's published.`;
    }
    return `Recibimos tu respuesta a ${q}, que dejó ${a}${lugar ? ` desde ${lugar}` : ""}. Una persona del equipo la leerá antes de publicarla.`;
  }
  if (locale === "pt") {
    return `Recebemos sua resposta à pergunta ${q}. Uma pessoa da equipe vai lê-la antes de publicá-la e avisaremos quando estiver no mapa.`;
  }
  if (locale === "en") {
    return `We received your answer to the question ${q}. Someone on our team will read it before it's published, and we'll let you know when it's on the map.`;
  }
  return `Recibimos tu respuesta a la pregunta ${q}. Una persona del equipo la leerá antes de publicarla y te avisaremos cuando esté en el mapa.`;
}

function publishedHello(alias: string, locale: AlmaLocale): string {
  const name = capitalizeAlias(alias);
  if (locale === "pt") return name ? `Olá, ${name}:` : "Olá:";
  if (locale === "en") return name ? `Hi, ${name}:` : "Hi:";
  return name ? `Hola, ${name}:` : "Hola:";
}

function publishedBody(locale: AlmaLocale, question: string, html: boolean, asker?: Asker): string {
  const q = quotedQuestion(question, html);
  if (asker) {
    const a = quien(asker, html);
    if (locale === "pt") return `Sua resposta a ${q} já está no mapa. Agora ${a} e outras pessoas podem lê-la.`;
    if (locale === "en") return `Your answer to ${q} is now on the map. Now ${a} and other people can read it.`;
    return `Tu respuesta a ${q} ya está en el mapa. Ahora ${a} y otras personas pueden leerla.`;
  }
  if (locale === "pt") {
    return `Sua resposta à pergunta ${q} já está publicada no mapa do AlmaMundi. Pode ser vista de qualquer lugar do mundo, junto com as outras respostas a essa pergunta.`;
  }
  if (locale === "en") {
    return `Your answer to the question ${q} is now published on the AlmaMundi map. It can be seen from anywhere in the world, alongside the other answers to that question.`;
  }
  return `Tu respuesta a la pregunta ${q} ya está publicada en el mapa de AlmaMundi. Puede verse desde cualquier parte del mundo, junto a las demás respuestas de esa pregunta.`;
}

function rejectedBody(locale: AlmaLocale, question: string, html: boolean): string {
  const q = quotedQuestion(question, html);
  if (locale === "pt") {
    return `Revisamos sua resposta à pergunta ${q} e, desta vez, não vamos publicá-la. Se quiser, você pode enviar outra.`;
  }
  if (locale === "en") {
    return `We reviewed your answer to the question ${q} and this time we will not publish it. If you want, you can send another.`;
  }
  return `Revisamos tu respuesta a la pregunta ${q} y esta vez no la publicaremos. Si quieres, puedes enviar otra.`;
}

function respuestaCopy(locale: AlmaLocale) {
  if (locale === "pt") {
    return {
      receivedSubject: "Recebemos sua resposta",
      now: "O que acontece agora",
      step1: "1. Revisamos sua resposta.",
      step2: "2. Se estiver tudo certo, publicamos.",
      step3: "3. Enviamos o link por e-mail.",
      doubts: "Tem dúvidas? Escreva para",
      thanks: "Agradecemos sua resposta.<br>Equipe AlmaMundi",
      thanksText: "Agradecemos sua resposta.",
      team: "Equipe AlmaMundi",
      publishedSubject: "Sua resposta já está no AlmaMundi",
      see: "Ver minha resposta",
      another: "Responder outra pergunta",
      rejectedSubject: "Sobre sua resposta no AlmaMundi",
      reason: "Motivo",
      again: "Voltar ao AlmaMundi",
    };
  }
  if (locale === "en") {
    return {
      receivedSubject: "We received your answer",
      now: "What happens now",
      step1: "1. We review your answer.",
      step2: "2. If all is well, we publish it.",
      step3: "3. We send you the link by email.",
      doubts: "Questions? Write to",
      thanks: "Thank you for answering.<br>The AlmaMundi team",
      thanksText: "Thank you for answering.",
      team: "The AlmaMundi team",
      publishedSubject: "Your answer is now on AlmaMundi",
      see: "See my answer",
      another: "Answer another question",
      rejectedSubject: "About your answer on AlmaMundi",
      reason: "Reason",
      again: "Back to AlmaMundi",
    };
  }
  return {
    receivedSubject: "Recibimos tu respuesta",
    now: "Qué pasa ahora",
    step1: "1. Revisamos tu respuesta.",
    step2: "2. Si todo está bien, la publicamos.",
    step3: "3. Te enviamos el enlace por correo.",
    doubts: "¿Tienes dudas? Escríbenos a",
    thanks: "Gracias por responder.<br>Equipo AlmaMundi",
    thanksText: "Gracias por responder.",
    team: "Equipo AlmaMundi",
    publishedSubject: "Tu respuesta ya está en AlmaMundi",
    see: "Ver mi respuesta",
    another: "Responder otra pregunta",
    rejectedSubject: "Sobre tu respuesta en AlmaMundi",
    reason: "Motivo",
    again: "Volver a AlmaMundi",
  };
}

export function mailLang(locale: AlmaLocale | undefined): AlmaLocale {
  return locale === "pt" || locale === "en" ? locale : "es";
}

export function reasonSentence(reason: string): string {
  const text = reason.trim();
  if (!text || /[.!?…]$/.test(text)) return text;
  return `${text}.`;
}

export function contactLine(locale: AlmaLocale): string {
  const mail = escapeHtml(EMAIL_CONTACT_ADDRESS);
  return paragraphHtml(
    `${respuestaCopy(locale).doubts} <a href="mailto:${mail}" class="email-link" style="color:#FF4A1C;font-weight:400;text-decoration:underline;">${mail}</a>.`,
    "0 0 16px"
  );
}

export async function deliver(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<RespuestaMailResult> {
  if (!isValidRecipientEmail(opts.to)) return { ok: false };
  const { getResend } = await import("@/lib/emailSubmission");
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
    const { noteEmailSent } = await import("@/lib/ops/usage-state");
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
  question: string;
  locale?: AlmaLocale;
  asker?: Asker;
}): Promise<RespuestaMailResult> {
  const locale = mailLang(opts.locale);
  const copy = respuestaCopy(locale);
  const greeting = hello(opts.alias, locale);
  const body = receivedBody(locale, opts.question, false, opts.asker);
  const html = emailShell({
    preheader: copy.receivedSubject,
    footer: "respuesta",
    locale,
    actions: "respuesta",
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(receivedBody(locale, opts.question, true, opts.asker)),
    ].join(""),
    afterActionsHtml: [contactLine(locale), paragraphHtml(copy.thanks, "0")].join(""),
  });
  const text = [
    greeting,
    "",
    body,
    "",
    `${copy.doubts} ${EMAIL_CONTACT_ADDRESS}.`,
    "",
    copy.thanksText,
    copy.team,
    "",
    ...emailActionsText(locale, "respuesta"),
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

export function buildRespuestaPublishedEmail(opts: {
  alias: string;
  respuestaId: string;
  question: string;
  locale?: AlmaLocale;
  asker?: Asker;
}): { subject: string; html: string; text: string } {
  const locale = mailLang(opts.locale);
  const copy = respuestaCopy(locale);
  const greeting = publishedHello(opts.alias, locale);
  const body = publishedBody(locale, opts.question, false, opts.asker);
  const mapUrl = absoluteEmailUrl(`/?respuesta=${encodeURIComponent(opts.respuestaId)}`);
  const html = emailShell({
    preheader: copy.publishedSubject,
    footer: "respuesta",
    locale,
    actions: "respuesta",
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(publishedBody(locale, opts.question, true, opts.asker)),
      primaryButtonHtml(copy.see, mapUrl),
    ].join(""),
  });
  const text = [
    greeting,
    "",
    body,
    "",
    `${copy.see}: ${mapUrl}`,
    "",
    ...emailActionsText(locale, "respuesta"),
    "",
    authorEmailFooterNote(locale, "respuesta"),
  ].join("\n");
  return { subject: copy.publishedSubject, html, text };
}

export async function sendRespuestaPublishedEmail(opts: {
  to: string;
  alias: string;
  respuestaId: string;
  question: string;
  locale?: AlmaLocale;
  asker?: Asker;
}): Promise<RespuestaMailResult> {
  const mail = buildRespuestaPublishedEmail(opts);
  return deliver({
    to: opts.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

export async function sendRespuestaRejectedEmail(opts: {
  to: string;
  alias: string;
  questionId: string;
  question: string;
  locale?: AlmaLocale;
  publicReason: string;
}): Promise<RespuestaMailResult> {
  const locale = mailLang(opts.locale);
  const copy = respuestaCopy(locale);
  const greeting = hello(opts.alias, locale);
  const body = rejectedBody(locale, opts.question, false);
  const url = absoluteEmailUrl("/#cintas");
  const reason = escapeHtml(reasonSentence(opts.publicReason));
  const html = emailShell({
    preheader: copy.rejectedSubject,
    footer: "respuesta",
    locale,
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(rejectedBody(locale, opts.question, true)),
      `<p class="email-text email-box" style="margin:0 0 24px;padding:16px 18px;background:${EMAIL_BOX};border-radius:8px;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">${copy.reason}: ${reason}</p>`,
      conductaHtml(locale),
      primaryButtonHtml(copy.again, url),
      contactLine(locale),
      paragraphHtml(copy.team, "0"),
    ].join(""),
  });
  const text = [
    greeting,
    "",
    body,
    "",
    `${copy.reason}: ${reasonSentence(opts.publicReason)}`,
    "",
    conductaText(locale),
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
