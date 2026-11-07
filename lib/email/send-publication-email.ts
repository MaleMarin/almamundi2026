/**
 * Correo al autor cuando su historia queda publicada en el mapa (curación).
 */

import { escapeHtml } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  authorEmailFooterNote,
  AUTHOR_REPLY_TO,
  BRAND_ORANGE,
  EMAIL_FONT,
  emailShell,
  greetingHtml,
  paragraphHtml,
  primaryButtonHtml,
} from "@/lib/email/almamundi-email-layout";
import { capitalizeAlias } from "@/lib/email/received-email-template";
import type { AlmaLocale } from "@/lib/i18n/locale";
import { displayCountryName } from "@/lib/i18n/country-name";
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
        void where;
        return `Sua história “${title}” já está no mapa do AlmaMundi, junto às histórias de outras pessoas.`;
      },
      find: (title: string) =>
        `O botão abaixo leva você direto a ela. Se mais adiante quiser encontrá-la de novo, entre em almamundi.org, desça até o mapa e toque em “Buscar uma história”. Ali você pode escrever o título, “${title}”, ou algumas palavras do que contou.`,
      share: "Compartilhe ou presenteie sua história:",
      see: "Ver minha história",
      cinta: "Estas são as cores da sua história. São suas.",
      cintaBoton: "Baixar imagem",
      cintaAlt: "As cores da sua história",
      another: "Conte outra história",
      thanks: "Agradecemos por contá-la.<br>Equipe AlmaMundi",
      thanksText: "Agradecemos por contá-la.",
      team: "Equipe AlmaMundi",
      privacy: "Aviso de privacidade",
    };
  }
  if (locale === "en") {
    return {
      fallback: "your story",
      hello: (name: string) => (name ? `Hi ${name},` : "Hi,"),
      subject: (title: string) => `Your story “${title}” is now on AlmaMundi`,
      lead: (title: string, where: string) => {
        void where;
        return `Your story “${title}” is now on the AlmaMundi map, alongside the stories of other people.`;
      },
      find: (title: string) =>
        `The button below takes you straight to it. If you want to find it again later, go to almamundi.org, scroll down to the map and tap “Search a story”. There you can type its title, “${title}”, or a few words from what you told.`,
      share: "Share or gift your story:",
      see: "See my story",
      cinta: "These are the colors of your story. They are yours.",
      cintaBoton: "Download image",
      cintaAlt: "The colors of your story",
      another: "Tell another story",
      thanks: "Thank you for telling it.<br>The AlmaMundi team",
      thanksText: "Thank you for telling it.",
      team: "The AlmaMundi team",
      privacy: "Privacy notice",
    };
  }
  return {
    fallback: "tu historia",
    hello: (name: string) => (name ? `Hola, ${name}:` : "Hola:"),
    subject: (title: string) => `Tu historia «${title}» ya está en AlmaMundi`,
    lead: (title: string, where: string) => {
      void where;
      return `Tu historia «${title}» ya está en el mapa de AlmaMundi, junto a las historias de otras personas.`;
    },
    find: (title: string) =>
      `El botón de abajo te lleva directo a ella. Si más adelante quieres volver a encontrarla, entra a almamundi.org, baja al mapa y toca «Buscar una historia». Ahí puedes escribir su título, «${title}», o algunas palabras de lo que contaste.`,
    share: "Comparte o regala tu historia:",
    see: "Ver mi historia",
    cinta: "Estos son los colores de tu historia. Son tuyos.",
    cintaBoton: "Descargar imagen",
    cintaAlt: "Los colores de tu historia",
    another: "Contar otra historia",
    thanks: "Gracias por contarla.<br>Equipo AlmaMundi",
    thanksText: "Gracias por contarla.",
    team: "Equipo AlmaMundi",
    privacy: "Aviso de privacidad",
  };
}

function storyTitleLine(storyTitle: string, locale: AlmaLocale): string {
  return storyTitle.replace(/[\r\n]+/g, " ").trim().slice(0, 200) || publicationCopy(locale).fallback;
}

function placeLine(placeName: string, locale: AlmaLocale): string {
  const raw = placeName.replace(/[\r\n]+/g, " ").trim();
  if (!raw || raw === "—" || raw === "-") return "";
  const comma = raw.indexOf(",");
  if (comma === -1) return displayCountryName(raw, locale) || formatPublicName(raw);
  return formatPublicPlace(raw.slice(0, comma), raw.slice(comma + 1), locale);
}

function publishedLead(title: string, place: string, locale: AlmaLocale): string {
  return publicationCopy(locale).lead(title, placeLine(place, locale));
}

export function publicationEmailSubject(storyTitle: string, locale: AlmaLocale = "es"): string {
  return publicationCopy(locale).subject(storyTitleLine(storyTitle, locale));
}

const CINTA_VERSION = 2;

/** Imagen de cintas de la historia publicada (la misma de la pantalla final). */
function cintaImageUrl(storyId: string): string {
  // v: subir el número cuando cambie la imagen, para no mostrar la copia guardada en Vercel.
  return absoluteEmailUrl(`/og/cinta/${encodeURIComponent(storyId)}?v=${CINTA_VERSION}`);
}

/** Instagram no permite compartir desde un enlace: abre Instagram y la persona sube la imagen. */
const INSTAGRAM_URL = "https://www.instagram.com/";

function enlace(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="email-link" style="color:${BRAND_ORANGE};font-weight:400;text-decoration:underline;font-family:${EMAIL_FONT};">${escapeHtml(label)}</a>`;
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
    `${copy.see}: ${storyUrl}`,
    "",
    copy.cinta,
    `${copy.cintaBoton}: ${cintaImageUrl(params.storyId)}&descargar=1`,
    "",
    copy.share,
    `Instagram: ${INSTAGRAM_URL}`,
    `X: ${share.x}`,
    `Facebook: ${share.facebook}`,
    `WhatsApp: ${share.whatsapp}`,
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
  const place = placeLine(params.placeName, locale);
  const historiasUrl = storyPublicUrl(params.shortCode);
  const title = storyTitleLine(params.storyTitle, locale);
  const share = authorShareChannels(title, place, params.shortCode, locale);
  const lead = escapeHtml(publishedLead(title, place, locale));
  const cintaUrl = cintaImageUrl(params.storyId);

  const bodyHtml = `
      ${greetingHtml(copy.hello(authorName))}
      ${paragraphHtml(lead)}
      ${primaryButtonHtml(copy.see, historiasUrl)}
      ${paragraphHtml(escapeHtml(copy.cinta), "32px 0 16px")}
      <p style="margin:0 0 12px;"><img src="${escapeHtml(cintaUrl)}" alt="${escapeHtml(copy.cintaAlt)}" width="480" style="display:block;width:100%;max-width:480px;height:auto;border-radius:12px;border:0;" /></p>
      ${paragraphHtml(enlace(copy.cintaBoton, `${cintaUrl}&descargar=1`), "0 0 28px")}
      ${paragraphHtml(
        `${escapeHtml(copy.share)} ${[
          enlace("Instagram", INSTAGRAM_URL),
          enlace("X", share.x),
          enlace("Facebook", share.facebook),
          enlace("WhatsApp", share.whatsapp),
        ].join(" · ")}`,
        "0 0 28px"
      )}
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
