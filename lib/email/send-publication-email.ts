/**
 * Correo al autor cuando su historia queda publicada en el mapa (curación).
 */

import { escapeHtml } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  authorEmailFooterNote,
  AUTHOR_REPLY_TO,
  emailShell,
  greetingHtml,
  paragraphHtml,
  primaryButtonHtml,
} from "@/lib/email/almamundi-email-layout";
import { capitalizeAlias } from "@/lib/email/received-email-template";
import type { AlmaLocale } from "@/lib/i18n/locale";
import { formatPublicPlace, formatPublicName } from "@/lib/historias/story-ubicacion";
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
  locale?: AlmaLocale;
};

function mailLang(locale: AlmaLocale | undefined): AlmaLocale {
  return locale === "pt" || locale === "en" ? locale : "es";
}

function publicationCopy(locale: AlmaLocale) {
  if (locale === "pt") {
    return {
      fallback: "sua história",
      hello: (name: string) => (name ? `Olá, ${name}:` : "Olá:"),
      subject: (title: string) => `Sua história “${title}” já está no AlmaMundi`,
      lead: (title: string, where: string) => {
        const base = `Sua história “${title}” já está publicada no mapa do AlmaMundi`;
        const located = where ? `${base}, em ${where}` : base;
        return `${located}. A partir de hoje, qualquer pessoa que visite o site pode vê-la.`;
      },
      share: "Se quiser, compartilhe com quem você escolher.",
      see: "Ver minha história",
      another: "Conte outra história",
      thanks: "Agradecemos por contá-la.<br>Equipe AlmaMundi",
      thanksText: "Agradecemos por contá-la.",
      team: "Equipe AlmaMundi",
      privacy: "Política de privacidade",
    };
  }
  if (locale === "en") {
    return {
      fallback: "your story",
      hello: (name: string) => (name ? `Hello, ${name}:` : "Hello:"),
      subject: (title: string) => `Your story “${title}” is now on AlmaMundi`,
      lead: (title: string, where: string) => {
        const base = `Your story “${title}” is now published on the AlmaMundi map`;
        const located = where ? `${base}, in ${where}` : base;
        return `${located}. Starting today, anyone who visits the site can see it.`;
      },
      share: "If you'd like, share it with anyone you choose.",
      see: "See my story",
      another: "Tell another story",
      thanks: "Thank you for telling it.<br>The AlmaMundi team",
      thanksText: "Thank you for telling it.",
      team: "The AlmaMundi team",
      privacy: "Privacy policy",
    };
  }
  return {
    fallback: "tu historia",
    hello: (name: string) => (name ? `Hola, ${name}:` : "Hola:"),
    subject: (title: string) => `Tu historia «${title}» ya está en AlmaMundi`,
    lead: (title: string, where: string) => {
      const base = `Tu historia «${title}» ya está publicada en el mapa de AlmaMundi`;
      const located = where ? `${base}, en ${where}` : base;
      return `${located}. Desde hoy, cualquier persona que visite el sitio puede verla.`;
    },
    share: "Si quieres, compártela con quien tú elijas.",
    see: "Ver mi historia",
    another: "Contar otra historia",
    thanks: "Gracias por contarla.<br>Equipo AlmaMundi",
    thanksText: "Gracias por contarla.",
    team: "Equipo AlmaMundi",
    privacy: "Política de privacidad",
  };
}

function storyTitleLine(storyTitle: string, locale: AlmaLocale): string {
  return storyTitle.replace(/[\r\n]+/g, " ").trim().slice(0, 200) || publicationCopy(locale).fallback;
}

function placeLine(placeName: string): string {
  const raw = placeName.replace(/[\r\n]+/g, " ").trim();
  if (!raw || raw === "—" || raw === "-") return "";
  const comma = raw.indexOf(",");
  if (comma === -1) return formatPublicName(raw);
  return formatPublicPlace(raw.slice(0, comma), raw.slice(comma + 1));
}

function publishedLead(title: string, place: string, locale: AlmaLocale): string {
  return publicationCopy(locale).lead(title, placeLine(place));
}

export function publicationEmailSubject(storyTitle: string, locale: AlmaLocale = "es"): string {
  return publicationCopy(locale).subject(storyTitleLine(storyTitle, locale));
}

function storyPublicUrl(shortCode: string): string {
  return publishedStoryShortUrl(shortCode);
}

function authorShareChannels(title: string, placeName: string, shortCode: string, locale: AlmaLocale) {
  const link = publishedStoryShortUrl(shortCode);
  const text = publishedAuthorShareText(locale, title, placeName, link);
  return {
    text,
    ...buildStoryShareChannelUrls(
      link,
      { short: text, long: text, emailSubject: publicationEmailSubject(title, locale) },
      { exact: true }
    ),
  };
}

export function buildPublicationEmailText(params: SendPublicationEmailParams): string {
  const locale = mailLang(params.locale);
  const copy = publicationCopy(locale);
  const name = capitalizeAlias(params.authorName);
  const title = storyTitleLine(params.storyTitle, locale);
  const storyUrl = storyPublicUrl(params.shortCode);
  const share = authorShareChannels(title, params.placeName, params.shortCode, locale);
  return [
    copy.hello(name),
    "",
    publishedLead(title, params.placeName, locale),
    "",
    copy.share,
    "",
    share.text,
    "",
    `${copy.see}: ${storyUrl}`,
    `WhatsApp: ${share.whatsapp}`,
    `Facebook: ${share.facebook}`,
    `X: ${share.x}`,
    `LinkedIn: ${share.linkedin}`,
    `${copy.another}: ${absoluteEmailUrl("/contar")}`,
    "",
    copy.thanksText,
    copy.team,
    "",
    authorEmailFooterNote(locale, "historia"),
    `${copy.privacy}: ${absoluteEmailUrl("/privacidad")}`,
  ].join("\n");
}

export function buildPublicationEmailHtml(params: SendPublicationEmailParams): string {
  const locale = mailLang(params.locale);
  const copy = publicationCopy(locale);
  const authorName = escapeHtml(capitalizeAlias(params.authorName));
  const place = placeLine(params.placeName);
  const historiasUrl = storyPublicUrl(params.shortCode);
  const title = storyTitleLine(params.storyTitle, locale);
  const share = authorShareChannels(title, place, params.shortCode, locale);
  const lead = escapeHtml(publishedLead(title, place, locale));

  const bodyHtml = `
      ${greetingHtml(copy.hello(authorName))}
      ${paragraphHtml(lead)}
      ${paragraphHtml(copy.share, "0 0 28px")}
      ${primaryButtonHtml(copy.see, historiasUrl)}
      ${primaryButtonHtml("WhatsApp", share.whatsapp)}
      ${primaryButtonHtml("Facebook", share.facebook)}
      ${primaryButtonHtml("X", share.x)}
      ${primaryButtonHtml("LinkedIn", share.linkedin)}
      ${primaryButtonHtml(copy.another, absoluteEmailUrl("/contar"))}
      ${paragraphHtml(copy.thanks, "0")}`;

  return emailShell({ bodyHtml, footer: "received", locale });
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
  const subject = publicationEmailSubject(params.storyTitle, mailLang(params.locale));

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
