/**
 * Cuerpo del correo de recepción. No enlaza la ficha: la historia aún no es pública.
 */

import { escapeHtml } from "@/lib/email-html";
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
};

function cleanLine(value: string, max = 200): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function capitalizeAlias(authorName: string): string {
  const name = cleanLine(authorName, 80);
  if (!name) return "";
  return name.charAt(0).toLocaleUpperCase("es-CL") + name.slice(1);
}

export function storyFormatLabel(raw: string): ReceivedFormatLabel {
  const key = raw.trim().toLowerCase();
  if (key === "foto" || key === "fotos" || key === "photo" || key === "fotografia" || key === "fotografía") {
    return "fotos";
  }
  if (key === "audio") return "audio";
  if (key === "video" || key === "vídeo") return "video";
  return "texto";
}

export function formatSubmissionDate(at: Date): string {
  const when = Number.isNaN(at.getTime()) ? new Date() : at;
  const parts = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(when);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  return `${day} de ${month} de ${year}`;
}

function storyTitleOrFallback(storyTitle: string): string {
  return cleanLine(storyTitle, 200) || "tu historia";
}

function greetingLine(authorName: string): string {
  const alias = capitalizeAlias(authorName);
  return alias ? `Hola, ${alias}:` : "Hola:";
}

export function receivedEmailSubject(storyTitle: string): string {
  return `Recibimos tu historia «${storyTitleOrFallback(storyTitle)}»`;
}

function summaryBoxHtml(params: ReceivedEmailContent): string {
  const title = escapeHtml(storyTitleOrFallback(params.storyTitle));
  const format = escapeHtml(storyFormatLabel(params.format));
  const date = escapeHtml(formatSubmissionDate(params.submittedAt));
  const row = (label: string, value: string, margin: string) =>
    `<p class="email-text" style="margin:${margin};font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};"><strong>${label}:</strong> ${value}</p>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
      <tr>
        <td class="email-box" style="background:${EMAIL_BOX};border-radius:8px;padding:16px 18px;">
          ${row("Título", title, "0 0 8px")}
          ${row("Formato", format, "0 0 8px")}
          ${row("Fecha de envío", date, "0")}
        </td>
      </tr>
    </table>`;
}

function stepsHtml(): string {
  const steps = [
    "Revisamos tu historia.",
    `Si cumple los <a href="${escapeHtml(absoluteEmailUrl("/terminos"))}" target="_blank" rel="noopener noreferrer" class="email-link" style="color:#D13D17;text-decoration:underline;">términos de uso</a>, la publicamos en el mapa.`,
    "Te enviamos el enlace por correo.",
  ];
  const rows = steps
    .map(
      (step, index) => `<tr>
          <td class="email-text" valign="top" width="28" style="width:28px;padding:0 8px 8px 0;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">${index + 1}.</td>
          <td class="email-text" valign="top" style="padding:0 0 8px;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">${step}</td>
        </tr>`
    )
    .join("");
  return `<p class="email-text" style="margin:0 0 8px;font-size:16px;line-height:1.6;font-weight:700;color:${EMAIL_INK};font-family:${EMAIL_FONT};">Qué pasa ahora</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        ${rows}
      </table>`;
}

function contactHtml(): string {
  const mail = escapeHtml(EMAIL_CONTACT_ADDRESS);
  return paragraphHtml(
    `¿Tienes dudas? Escríbenos a <a href="mailto:${mail}" class="email-link" style="color:#D13D17;text-decoration:underline;">${mail}</a>.`,
    "0"
  );
}

export function buildReceivedEmailHtml(params: ReceivedEmailContent): string {
  const title = escapeHtml(storyTitleOrFallback(params.storyTitle));
  const mapUrl = absoluteEmailUrl("/");
  const tellUrl = absoluteEmailUrl("/contar");
  const bodyHtml = `
      ${greetingHtml(escapeHtml(greetingLine(params.authorName)))}
      ${paragraphHtml(`Recibimos tu historia «${title}». Gracias por contarla en AlmaMundi.`)}
      ${paragraphHtml("Antes de publicarla, la leerá una persona de nuestro equipo. Te escribiremos a este correo cuando aparezca en el mapa.")}
      ${summaryBoxHtml(params)}
      ${stepsHtml()}
      ${primaryButtonHtml("Contar otra historia", tellUrl)}
      <p class="email-text" style="margin:0 0 24px;text-align:center;font-size:16px;line-height:1.6;font-family:${EMAIL_FONT};">
        <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" class="email-link" style="color:#D13D17;text-decoration:underline;">Explorar el mapa</a>
      </p>
      ${contactHtml()}`;

  return emailShell({
    preheader: RECEIVED_EMAIL_PREVIEW,
    bodyHtml,
    footer: "received",
  });
}

export function buildReceivedEmailText(params: ReceivedEmailContent): string {
  const title = storyTitleOrFallback(params.storyTitle);
  const originHome = absoluteEmailUrl("/");
  return [
    greetingLine(params.authorName),
    "",
    RECEIVED_EMAIL_PREVIEW,
    "",
    `Recibimos tu historia «${title}». Gracias por contarla en AlmaMundi.`,
    "",
    "Antes de publicarla, la leerá una persona de nuestro equipo. Te escribiremos a este correo cuando aparezca en el mapa.",
    "",
    `Título: ${title}`,
    `Formato: ${storyFormatLabel(params.format)}`,
    `Fecha de envío: ${formatSubmissionDate(params.submittedAt)}`,
    "",
    "Qué pasa ahora",
    "1. Revisamos tu historia.",
    "2. Si cumple los términos de uso, la publicamos en el mapa.",
    `   ${absoluteEmailUrl("/terminos")}`,
    "3. Te enviamos el enlace por correo.",
    "",
    `Contar otra historia: ${absoluteEmailUrl("/contar")}`,
    `Explorar el mapa: ${originHome}`,
    "",
    `¿Tienes dudas? Escríbenos a ${EMAIL_CONTACT_ADDRESS}.`,
    "",
    "Recibes este correo porque enviaste una historia a AlmaMundi. AlmaMundi es una iniciativa de Precisar.",
    `Política de privacidad: ${absoluteEmailUrl("/privacidad")}`,
  ].join("\n");
}
