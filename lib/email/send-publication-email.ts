/**
 * Correo al autor cuando su historia queda publicada en el mapa (curación).
 */

import { escapeHtml } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  AUTHOR_REPLY_TO,
  emailShell,
  greetingHtml,
  invitationHtml,
  paragraphHtml,
  primaryButtonHtml,
} from "@/lib/email/almamundi-email-layout";
import { capitalizeAlias } from "@/lib/email/received-email-template";
import { buildStoryShareChannelUrls } from "@/lib/huella/share-story-channels";
import { publishedAuthorShareText, publishedStoryShortUrl } from "@/lib/share/published-share";

export type SendPublicationEmailParams = {
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  storyId: string;
  shortCode: string;
  placeName: string;
  /** Rincón privado del autor (`/historias/[id]/mi-eco?t=`). */
  ecoUrl?: string;
};

function storyTitleLine(storyTitle: string): string {
  return storyTitle.replace(/[\r\n]+/g, " ").trim().slice(0, 200) || "tu historia";
}

function placeLine(placeName: string): string {
  return placeName.replace(/[\r\n]+/g, " ").trim();
}

function publishedLead(title: string, place: string): string {
  const where = placeLine(place);
  const base = `Tu historia «${title}» ya está publicada en el mapa de AlmaMundi`;
  const located = where ? `${base}, en ${where}` : base;
  return `${located}. Desde hoy, cualquier persona que visite el sitio puede verla.`;
}

export function publicationEmailSubject(storyTitle: string): string {
  return `Tu historia «${storyTitleLine(storyTitle)}» ya está en AlmaMundi`;
}

function storyPublicUrl(shortCode: string): string {
  return publishedStoryShortUrl(shortCode);
}

function authorShareChannels(title: string, placeName: string, shortCode: string) {
  const link = publishedStoryShortUrl(shortCode);
  const text = publishedAuthorShareText("es", title, placeName, link);
  return {
    text,
    ...buildStoryShareChannelUrls(
      link,
      { short: text, long: text, emailSubject: publicationEmailSubject(title) },
      { exact: true }
    ),
  };
}

export function buildPublicationEmailText(params: SendPublicationEmailParams): string {
  const name = capitalizeAlias(params.authorName);
  const greeting = name ? `Hola, ${name}:` : "Hola:";
  const title = storyTitleLine(params.storyTitle);
  const storyUrl = storyPublicUrl(params.shortCode);
  const share = authorShareChannels(title, params.placeName, params.shortCode);
  const ecoUrl = params.ecoUrl?.trim() ?? "";
  return [
    greeting,
    "",
    publishedLead(title, params.placeName),
    "",
    "Si quieres, compártela con quien tú elijas.",
    "",
    share.text,
    "",
    `Ver mi historia: ${storyUrl}`,
    `WhatsApp: ${share.whatsapp}`,
    `Facebook: ${share.facebook}`,
    `X: ${share.x}`,
    `LinkedIn: ${share.linkedin}`,
    `Contar otra historia: ${absoluteEmailUrl("/contar")}`,
    ...(ecoUrl
      ? [
          "",
          "En tu espacio personal puedes ver cuántas personas respondieron a tu historia y volver a descargar tu relato en colores.",
          `Ir a mi espacio: ${ecoUrl}`,
        ]
      : []),
    "",
    "Gracias por contarla.",
    "Equipo AlmaMundi",
    "",
    `${absoluteEmailUrl("/")} · Política de privacidad: ${absoluteEmailUrl("/privacidad")}`,
    "Recibiste este correo porque enviaste una historia en AlmaMundi.",
  ].join("\n");
}

export function buildPublicationEmailHtml(params: SendPublicationEmailParams): string {
  const authorName = escapeHtml(capitalizeAlias(params.authorName));
  const place = placeLine(params.placeName);
  const historiasUrl = storyPublicUrl(params.shortCode);
  const share = authorShareChannels(storyTitleLine(params.storyTitle), place, params.shortCode);
  const ecoHref = params.ecoUrl?.trim() ?? "";
  const greeting = authorName ? `Hola, ${authorName}:` : "Hola:";
  const lead = escapeHtml(publishedLead(storyTitleLine(params.storyTitle), place));
  const ecoBlock = ecoHref
    ? `
      ${paragraphHtml("En tu espacio personal puedes ver cuántas personas respondieron a tu historia y volver a descargar tu relato en colores.")}
      ${primaryButtonHtml("Ir a mi espacio", ecoHref)}`
    : "";

  const bodyHtml = `
      ${greetingHtml(greeting)}
      ${paragraphHtml(lead)}
      ${paragraphHtml("Si quieres, compártela con quien tú elijas.", "0 0 28px")}
      ${primaryButtonHtml("Ver mi historia", historiasUrl)}
      ${primaryButtonHtml("WhatsApp", share.whatsapp)}
      ${primaryButtonHtml("Facebook", share.facebook)}
      ${primaryButtonHtml("X", share.x)}
      ${primaryButtonHtml("LinkedIn", share.linkedin)}
      ${invitationHtml()}
      ${ecoBlock}
      ${paragraphHtml("Gracias por contarla.<br>Equipo AlmaMundi", "0")}`;

  return emailShell({ bodyHtml });
}

export type SendPublicationEmailResult =
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

export async function sendPublicationEmail(
  params: SendPublicationEmailParams
): Promise<SendPublicationEmailResult> {
  const { getResend } = await import("@/lib/emailSubmission");
  const { noteEmailSent } = await import("@/lib/ops/usage-state");
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = publicationEmailSubject(params.storyTitle);

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      replyTo: AUTHOR_REPLY_TO,
      subject,
      html: buildPublicationEmailHtml(params),
      text: buildPublicationEmailText(params),
    });
    if (sent.error) {
      const msg = sent.error.message || "Error de Resend";
      console.error("sendPublicationEmail", sent.error);
      return { ok: false, error: msg };
    }
    await noteEmailSent();
    return { ok: true, emailId: sent.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar el correo";
    console.error("sendPublicationEmail", err);
    return { ok: false, error: msg };
  }
}
