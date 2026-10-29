/**
 * Cuerpo del correo de recepción. No enlaza la ficha: la historia aún no es pública.
 */

import { escapeHtml } from "@/lib/email-html";
import { formatPublicName } from "@/lib/historias/story-ubicacion";
import type { AlmaLocale } from "@/lib/i18n/locale";
import {
  absoluteEmailUrl,
  EMAIL_BOX,
  EMAIL_CONTACT_ADDRESS,
  EMAIL_FONT,
  EMAIL_INK,
  emailShell,
  greetingHtml,
  paragraphHtml,
  primaryButtonHtml,
} from "@/lib/email/almamundi-email-layout";

export const RECEIVED_EMAIL_PREVIEW =
  "Ahora pasa por una revisión. Te avisaremos cuando esté en el mapa.";

export type ReceivedFormatLabel = "texto" | "fotos" | "audio" | "video";

export type ReceivedEmailContent = {
  authorName: string;
  storyTitle: string;
  /** tipo del envío (`foto`, `video`…) o la palabra ya lista para el correo. */
  format: string;
  submittedAt: Date;
  locale?: AlmaLocale;
};

function cleanLine(value: string, max = 200): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function capitalizeAlias(authorName: string): string {
  return formatPublicName(cleanLine(authorName, 80));
}

export function storyFormatLabel(raw: string, locale: AlmaLocale = "es"): string {
  const key = raw.trim().toLowerCase();
  const fotos = key === "foto" || key === "fotos" || key === "photo" || key === "fotografia" || key === "fotografía";
  const audio = key === "audio";
  const video = key === "video" || key === "vídeo";
  if (locale === "pt") {
    if (fotos) return "fotos";
    if (audio) return "áudio";
    if (video) return "vídeo";
    return "texto";
  }
  if (locale === "en") {
    if (fotos) return "photos";
    if (audio) return "audio";
    if (video) return "video";
    return "text";
  }
  if (fotos) return "fotos";
  if (audio) return "audio";
  if (video) return "video";
  return "texto";
}

export function formatSubmissionDate(at: Date, locale: AlmaLocale = "es"): string {
  const when = Number.isNaN(at.getTime()) ? new Date() : at;
  const intl = locale === "pt" ? "pt-BR" : locale === "en" ? "en-US" : "es-CL";
  const parts = new Intl.DateTimeFormat(intl, {
    timeZone: "America/Santiago",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(when);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  if (locale === "en") return `${month} ${day}, ${year}`;
  return `${day} de ${month} de ${year}`;
}

function mailLocale(params: { locale?: AlmaLocale }): AlmaLocale {
  return params.locale === "pt" || params.locale === "en" ? params.locale : "es";
}

function receivedCopy(locale: AlmaLocale) {
  if (locale === "pt") {
    return {
      fallback: "sua história",
      hello: (alias: string) => (alias ? `Olá, ${alias}:` : "Olá:"),
      subject: (title: string) => `Recebemos sua história «${title}»`,
      preview: "Agora ela passa por uma revisão. Avisaremos quando estiver no mapa.",
      thanks: (title: string) => `Recebemos sua história «${title}». Agradecemos por contá-la no AlmaMundi.`,
      before: "Antes de publicá-la, uma pessoa da nossa equipe vai lê-la. Escreveremos para este e-mail quando ela aparecer no mapa.",
      titleLabel: "Título",
      formatLabel: "Formato",
      dateLabel: "Data de envio",
      now: "O que acontece agora",
      steps: [
        "Revisamos sua história.",
        "Se cumprir os termos de uso, publicamos no mapa.",
        "Enviamos o link por e-mail.",
      ],
      another: "Conte outra história",
      map: "Explorar o mapa",
      doubts: "Tem dúvidas? Escreva para",
      footerNote: "Você recebe este e-mail porque enviou uma história ao AlmaMundi. O AlmaMundi é uma iniciativa da Precisar.",
      privacy: "Política de privacidade",
    };
  }
  if (locale === "en") {
    return {
      fallback: "your story",
      hello: (alias: string) => (alias ? `Hello, ${alias}:` : "Hello:"),
      subject: (title: string) => `We received your story «${title}»`,
      preview: "It now goes through a review. We will let you know when it is on the map.",
      thanks: (title: string) => `We received your story «${title}». Thank you for telling it on AlmaMundi.`,
      before: "Before we publish it, someone on our team will read it. We will write to this email when it appears on the map.",
      titleLabel: "Title",
      formatLabel: "Format",
      dateLabel: "Date sent",
      now: "What happens now",
      steps: [
        "We review your story.",
        "If it meets the terms of use, we publish it on the map.",
        "We send you the link by email.",
      ],
      another: "Tell another story",
      map: "Explore the map",
      doubts: "Questions? Write to",
      footerNote: "You receive this email because you sent a story to AlmaMundi. AlmaMundi is an initiative of Precisar.",
      privacy: "Privacy policy",
    };
  }
  return {
    fallback: "tu historia",
    hello: (alias: string) => (alias ? `Hola, ${alias}:` : "Hola:"),
    subject: (title: string) => `Recibimos tu historia «${title}»`,
    preview: RECEIVED_EMAIL_PREVIEW,
    thanks: (title: string) => `Recibimos tu historia «${title}». Gracias por contarla en AlmaMundi.`,
    before: "Antes de publicarla, la leerá una persona de nuestro equipo. Te escribiremos a este correo cuando aparezca en el mapa.",
    titleLabel: "Título",
    formatLabel: "Formato",
    dateLabel: "Fecha de envío",
    now: "Qué pasa ahora",
    steps: [
      "Revisamos tu historia.",
      "Si cumple los términos de uso, la publicamos en el mapa.",
      "Te enviamos el enlace por correo.",
    ],
    another: "Contar otra historia",
    map: "Explorar el mapa",
    doubts: "¿Tienes dudas? Escríbenos a",
    footerNote: "Recibes este correo porque enviaste una historia a AlmaMundi. AlmaMundi es una iniciativa de Precisar.",
    privacy: "Política de privacidad",
  };
}

function storyTitleOrFallback(storyTitle: string, locale: AlmaLocale): string {
  return cleanLine(storyTitle, 200) || receivedCopy(locale).fallback;
}

function greetingLine(authorName: string, locale: AlmaLocale): string {
  return receivedCopy(locale).hello(capitalizeAlias(authorName));
}

export function receivedEmailSubject(storyTitle: string, locale: AlmaLocale = "es"): string {
  const title = storyTitleOrFallback(storyTitle, locale);
  return receivedCopy(locale).subject(title);
}

function termsLink(label: string): string {
  return `<a href="${escapeHtml(absoluteEmailUrl("/terminos"))}" target="_blank" rel="noopener noreferrer" class="email-link" style="color:#FF4A1C;font-weight:600;text-decoration:underline;">${label}</a>`;
}

function summaryBoxHtml(params: ReceivedEmailContent): string {
  const locale = mailLocale(params);
  const copy = receivedCopy(locale);
  const title = escapeHtml(storyTitleOrFallback(params.storyTitle, locale));
  const format = escapeHtml(storyFormatLabel(params.format, locale));
  const date = escapeHtml(formatSubmissionDate(params.submittedAt, locale));
  const row = (label: string, value: string, margin: string) =>
    `<p class="email-text" style="margin:${margin};font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};"><strong>${label}:</strong> ${value}</p>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
      <tr>
        <td class="email-box" style="background:${EMAIL_BOX};border-radius:8px;padding:16px 18px;">
          ${row(copy.titleLabel, title, "0 0 8px")}
          ${row(copy.formatLabel, format, "0 0 8px")}
          ${row(copy.dateLabel, date, "0")}
        </td>
      </tr>
    </table>`;
}

function stepsHtml(locale: AlmaLocale): string {
  const copy = receivedCopy(locale);
  const linked =
    locale === "pt"
      ? `Se cumprir os ${termsLink("termos de uso")}, publicamos no mapa.`
      : locale === "en"
        ? `If it meets the ${termsLink("terms of use")}, we publish it on the map.`
        : `Si cumple los ${termsLink("términos de uso")}, la publicamos en el mapa.`;
  const steps = [copy.steps[0], linked, copy.steps[2]];
  const rows = steps
    .map(
      (step, index) => `<tr>
          <td class="email-text" valign="top" width="28" style="width:28px;padding:0 8px 8px 0;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">${index + 1}.</td>
          <td class="email-text" valign="top" style="padding:0 0 8px;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">${step}</td>
        </tr>`
    )
    .join("");
  return `<p class="email-text" style="margin:0 0 8px;font-size:16px;line-height:1.6;font-weight:700;color:${EMAIL_INK};font-family:${EMAIL_FONT};">${copy.now}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        ${rows}
      </table>`;
}

function contactHtml(locale: AlmaLocale): string {
  const mail = escapeHtml(EMAIL_CONTACT_ADDRESS);
  return paragraphHtml(
    `${receivedCopy(locale).doubts} <a href="mailto:${mail}" class="email-link" style="color:#FF4A1C;font-weight:600;text-decoration:underline;">${mail}</a>.`,
    "0"
  );
}

export function buildReceivedEmailHtml(params: ReceivedEmailContent): string {
  const locale = mailLocale(params);
  const copy = receivedCopy(locale);
  const title = escapeHtml(storyTitleOrFallback(params.storyTitle, locale));
  const mapUrl = absoluteEmailUrl("/#mapa");
  const tellUrl = absoluteEmailUrl("/contar");
  const bodyHtml = `
      ${greetingHtml(escapeHtml(greetingLine(params.authorName, locale)))}
      ${paragraphHtml(copy.thanks(title))}
      ${paragraphHtml(copy.before)}
      ${summaryBoxHtml(params)}
      ${stepsHtml(locale)}
      ${primaryButtonHtml(copy.another, tellUrl)}
      <p class="email-text" style="margin:0 0 24px;text-align:center;font-size:16px;line-height:1.6;font-family:${EMAIL_FONT};">
        <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" class="email-link" style="color:#FF4A1C;font-weight:600;text-decoration:underline;">${copy.map}</a>
      </p>
      ${contactHtml(locale)}`;

  return emailShell({
    preheader: copy.preview,
    bodyHtml,
    footer: "received",
    locale,
  });
}

export function buildReceivedEmailText(params: ReceivedEmailContent): string {
  const locale = mailLocale(params);
  const copy = receivedCopy(locale);
  const title = storyTitleOrFallback(params.storyTitle, locale);
  const originHome = absoluteEmailUrl("/#mapa");
  return [
    greetingLine(params.authorName, locale),
    "",
    copy.preview,
    "",
    copy.thanks(title),
    "",
    copy.before,
    "",
    `${copy.titleLabel}: ${title}`,
    `${copy.formatLabel}: ${storyFormatLabel(params.format, locale)}`,
    `${copy.dateLabel}: ${formatSubmissionDate(params.submittedAt, locale)}`,
    "",
    copy.now,
    `1. ${copy.steps[0]}`,
    `2. ${copy.steps[1]}`,
    `   ${absoluteEmailUrl("/terminos")}`,
    `3. ${copy.steps[2]}`,
    "",
    `${copy.another}: ${absoluteEmailUrl("/contar")}`,
    `${copy.map}: ${originHome}`,
    "",
    `${copy.doubts} ${EMAIL_CONTACT_ADDRESS}.`,
    "",
    copy.footerNote,
    `${copy.privacy}: ${absoluteEmailUrl("/privacidad")}`,
  ].join("\n");
}
