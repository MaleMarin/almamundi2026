/**
 * Correo al autor cuando su historia queda publicada en el mapa (curación).
 */

import { escapeHtml } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  authorEmailFooterNote,
  AUTHOR_REPLY_TO,
  emailActionsText,
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
        return `Sua história “${title}” já está no mapa do AlmaMundi, junto às histórias que outras pessoas contaram.`;
      },
      find: (title: string) =>
        `O botão abaixo leva você direto a ela. Se mais adiante quiser encontrá-la de novo, entre em almamundi.org, desça até o mapa e toque em “Buscar uma história”. Ali você pode escrever o título, “${title}”, ou algumas palavras do que contou.`,
      share: "Se quiser, compartilhe com quem você escolher.",
      see: "Ver minha história no mapa",
      cinta: "Também enviamos a imagem com as cores da sua história, a mesma que você recebeu ao enviá-la. É sua: guarde ou compartilhe quando quiser.",
      cintaBoton: "Baixar minha imagem",
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
        return `Your story “${title}” is now on the AlmaMundi map, alongside the stories other people have told.`;
      },
      find: (title: string) =>
        `The button below takes you straight to it. If you want to find it again later, go to almamundi.org, scroll down to the map and tap “Search a story”. There you can type its title, “${title}”, or a few words from what you told.`,
      share: "If you'd like, share it with anyone you choose.",
      see: "See my story on the map",
      cinta: "We are also sending you the image with the colors of your story, the same one you got when you sent it. It is yours: save it or share it whenever you like.",
      cintaBoton: "Download my image",
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
      return `Tu historia «${title}» ya está en el mapa de AlmaMundi, junto a las historias que han contado otras personas.`;
    },
    find: (title: string) =>
      `El botón de abajo te lleva directo a ella. Si más adelante quieres volver a encontrarla, entra a almamundi.org, baja al mapa y toca «Buscar una historia». Ahí puedes escribir su título, «${title}», o algunas palabras de lo que contaste.`,
    share: "Si quieres, compártela con quien tú elijas.",
    see: "Ver mi historia en el mapa",
    cinta: "Te enviamos también la imagen con los colores de tu historia, la misma que recibiste al enviarla. Es tuya: guárdala o compártela cuando quieras.",
    cintaBoton: "Descargar mi imagen",
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

/** Imagen de cintas de la historia publicada (la misma de la pantalla final). */
function cintaImageUrl(storyId: string): string {
  return absoluteEmailUrl(`/og/cinta/${encodeURIComponent(storyId)}`);
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
    copy.find(title),
    "",
    `${copy.see}: ${storyUrl}`,
    "",
    copy.cinta,
    `${copy.cintaBoton}: ${cintaImageUrl(params.storyId)}`,
    "",
    copy.share,
    "",
    share.text,
    "",
    `WhatsApp: ${share.whatsapp}`,
    `Facebook: ${share.facebook}`,
    `X: ${share.x}`,
    `LinkedIn: ${share.linkedin}`,
    "",
    copy.thanksText,
    copy.team,
    "",
    ...emailActionsText(locale, "historia"),
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
      ${paragraphHtml(escapeHtml(copy.find(title)))}
      ${primaryButtonHtml(copy.see, historiasUrl)}
      ${paragraphHtml(escapeHtml(copy.cinta), "28px 0 16px")}
      <p style="margin:0 0 16px;"><img src="${escapeHtml(cintaUrl)}" alt="${escapeHtml(copy.cintaAlt)}" width="480" style="display:block;width:100%;max-width:480px;height:auto;border-radius:12px;border:0;" /></p>
      ${primaryButtonHtml(copy.cintaBoton, cintaUrl)}
      ${paragraphHtml(copy.share, "28px 0 28px")}
      ${primaryButtonHtml("WhatsApp", share.whatsapp)}
      ${primaryButtonHtml("Facebook", share.facebook)}
      ${primaryButtonHtml("X", share.x)}
      ${primaryButtonHtml("LinkedIn", share.linkedin)}
      ${paragraphHtml(copy.thanks, "0")}`;

  return emailShell({ bodyHtml, footer: "received", locale, actions: "historia" });
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
