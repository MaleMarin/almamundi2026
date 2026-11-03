/**
 * Correos para quien deja una pregunta en «Me pregunto…»: recibida, publicada y nueva respuesta.
 * En el idioma guardado al enviarla.
 */

import { escapeHtml } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  authorEmailFooterNote,
  EMAIL_CONTACT_ADDRESS,
  emailActionsText,
  emailShell,
  greetingHtml,
  paragraphHtml,
  primaryButtonHtml,
} from "@/lib/email/almamundi-email-layout";
import {
  contactLine,
  deliver,
  hello,
  mailLang,
  type RespuestaMailResult,
} from "@/lib/email/respuesta-mail";
import type { AlmaLocale } from "@/lib/i18n/locale";

type Tipo = "recibida" | "publicada" | "respuesta";

function q(texto: string, html: boolean): string {
  const t = texto.trim();
  return `«${html ? escapeHtml(t) : t}»`;
}

function copy(locale: AlmaLocale) {
  if (locale === "pt") {
    return {
      subject: {
        recibida: "Recebemos sua pergunta",
        publicada: "Sua pergunta já está em Me pergunto…",
        respuesta: "Alguém respondeu sua pergunta",
      },
      recibida: (p: string) => `Recebemos sua pergunta ${p}. Uma pessoa da equipe vai lê-la antes de publicá-la.`,
      publicada: (p: string) =>
        `Sua pergunta ${p} já está em Me pergunto… A partir de agora, qualquer pessoa do mundo pode respondê-la.`,
      respuesta: (p: string, lugar: string) =>
        `Alguém${lugar ? ` de ${lugar}` : ""} respondeu sua pergunta ${p}. Leia no mapa:`,
      ver: "Ver no mapa",
      doubts: "Tem dúvidas? Escreva para",
      team: "Equipe AlmaMundi",
    };
  }
  if (locale === "en") {
    return {
      subject: {
        recibida: "We received your question",
        publicada: "Your question is now in I wonder…",
        respuesta: "Someone answered your question",
      },
      recibida: (p: string) => `We received your question ${p}. Someone on our team will read it before it's published.`,
      publicada: (p: string) =>
        `Your question ${p} is now in I wonder… From now on, anyone in the world can answer it.`,
      respuesta: (p: string, lugar: string) =>
        `Someone${lugar ? ` from ${lugar}` : ""} answered your question ${p}. Read it on the map:`,
      ver: "See it on the map",
      doubts: "Questions? Write to",
      team: "The AlmaMundi team",
    };
  }
  return {
    subject: {
      recibida: "Recibimos tu pregunta",
      publicada: "Tu pregunta ya está en Me pregunto…",
      respuesta: "Alguien respondió tu pregunta",
    },
    recibida: (p: string) => `Recibimos tu pregunta ${p}. Una persona del equipo la leerá antes de publicarla.`,
    publicada: (p: string) =>
      `Tu pregunta ${p} ya está en Me pregunto… Desde ahora, cualquier persona del mundo puede responderla.`,
    respuesta: (p: string, lugar: string) =>
      `Alguien${lugar ? ` desde ${lugar}` : ""} respondió tu pregunta ${p}. Léela en el mapa:`,
    ver: "Ver en el mapa",
    doubts: "¿Tienes dudas? Escríbenos a",
    team: "Equipo AlmaMundi",
  };
}

export async function sendMePreguntaEmail(opts: {
  tipo: Tipo;
  to: string;
  alias: string;
  pregunta: string;
  locale?: AlmaLocale;
  /** Solo para «respuesta»: ciudad y país de quien respondió, y el id de la respuesta. */
  lugar?: string;
  respuestaId?: string;
  /** `mp-<id>`: el botón del correo de pregunta publicada abre su punto en el globo. */
  preguntaId?: string;
}): Promise<RespuestaMailResult> {
  const locale = mailLang(opts.locale);
  const c = copy(locale);
  const greeting = hello(opts.alias, locale);
  const lugar = (opts.lugar ?? "").trim();
  const bodyText =
    opts.tipo === "recibida"
      ? c.recibida(q(opts.pregunta, false))
      : opts.tipo === "publicada"
        ? c.publicada(q(opts.pregunta, false))
        : c.respuesta(q(opts.pregunta, false), lugar);
  const bodyHtml =
    opts.tipo === "recibida"
      ? c.recibida(q(opts.pregunta, true))
      : opts.tipo === "publicada"
        ? c.publicada(q(opts.pregunta, true))
        : c.respuesta(q(opts.pregunta, true), escapeHtml(lugar));
  const url =
    opts.tipo === "respuesta" && opts.respuestaId
      ? absoluteEmailUrl(`/?respuesta=${encodeURIComponent(opts.respuestaId)}`)
      : opts.tipo === "publicada"
        ? absoluteEmailUrl(
            opts.preguntaId ? `/?capa=me-pregunto&mp=${encodeURIComponent(opts.preguntaId)}#mapa` : "/?capa=me-pregunto#mapa"
          )
        : "";
  const subject = c.subject[opts.tipo];
  const html = emailShell({
    preheader: subject,
    footer: "respuesta",
    locale,
    actions: "respuesta",
    bodyHtml: [
      greetingHtml(escapeHtml(greeting)),
      paragraphHtml(bodyHtml),
      url && opts.tipo !== "recibida" ? primaryButtonHtml(c.ver, url) : "",
    ].join(""),
    afterActionsHtml: [contactLine(locale), paragraphHtml(c.team, "0")].join(""),
  });
  const text = [
    greeting,
    "",
    bodyText,
    ...(url && opts.tipo !== "recibida" ? ["", url] : []),
    "",
    `${c.doubts} ${EMAIL_CONTACT_ADDRESS}.`,
    "",
    c.team,
    "",
    ...emailActionsText(locale, "respuesta"),
    "",
    authorEmailFooterNote(locale, "respuesta"),
  ].join("\n");
  return deliver({ to: opts.to, subject, html, text });
}
