/**
 * Correos para quien deja una pregunta en «Me pregunto…»: recibida, publicada y nueva respuesta.
 * En el idioma guardado al enviarla.
 */

import { escapeHtml } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  authorEmailFooterNote,
  conductaHtml,
  conductaText,
  EMAIL_BOX,
  EMAIL_FONT,
  EMAIL_INK,
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
  reasonSentence,
  type RespuestaMailResult,
} from "@/lib/email/respuesta-mail";
import type { AlmaLocale } from "@/lib/i18n/locale";

type Tipo = "recibida" | "publicada" | "respuesta" | "rechazada";

function q(texto: string, html: boolean): string {
  const t = texto.trim();
  return `«${html ? escapeHtml(t) : t}»`;
}

function copy(locale: AlmaLocale) {
  if (locale === "pt") {
    return {
      subject: {
        recibida: "Recebemos sua pergunta",
        publicada: "Sua pergunta já está no AlmaMundi",
        respuesta: "Alguém respondeu sua pergunta",
        rechazada: "Sobre sua pergunta no AlmaMundi",
      },
      rechazada: (p: string) => `Revisamos sua pergunta ${p} e, desta vez, não vamos publicá-la.`,
      motivo: "Motivo",
      volver: "Voltar ao AlmaMundi",
      recibida: (p: string) => `Recebemos sua pergunta ${p}. Uma pessoa da equipe vai lê-la antes de publicá-la.`,
      publicada: (p: string) =>
        `Sua pergunta ${p} já está publicada no AlmaMundi. A partir de agora, outras pessoas podem respondê-la.`,
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
        publicada: "Your question is now on AlmaMundi",
        respuesta: "Someone answered your question",
        rechazada: "About your question on AlmaMundi",
      },
      rechazada: (p: string) => `We reviewed your question ${p} and this time we will not publish it.`,
      motivo: "Reason",
      volver: "Back to AlmaMundi",
      recibida: (p: string) => `We received your question ${p}. Someone on our team will read it before it's published.`,
      publicada: (p: string) =>
        `Your question ${p} is now published on AlmaMundi. From now on, other people can answer it.`,
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
      publicada: "Tu pregunta ya está en AlmaMundi",
      respuesta: "Alguien respondió tu pregunta",
      rechazada: "Sobre tu pregunta en AlmaMundi",
    },
    rechazada: (p: string) => `Revisamos tu pregunta ${p} y esta vez no la publicaremos.`,
    motivo: "Motivo",
    volver: "Volver a AlmaMundi",
    recibida: (p: string) => `Recibimos tu pregunta ${p}. Una persona del equipo la leerá antes de publicarla.`,
    publicada: (p: string) =>
      `Tu pregunta ${p} ya está publicada en AlmaMundi. Desde ahora, otras personas pueden responderla.`,
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
  /** Solo para «rechazada»: el motivo que verá la persona. */
  publicReason?: string;
}): Promise<RespuestaMailResult> {
  const locale = mailLang(opts.locale);
  const c = copy(locale);
  const greeting = hello(opts.alias, locale);
  if (opts.tipo === "rechazada") {
    const motivo = reasonSentence(opts.publicReason ?? "");
    const volver = absoluteEmailUrl("/#cintas");
    const subjectR = c.subject.rechazada;
    const htmlR = emailShell({
      preheader: subjectR,
      footer: "respuesta",
      locale,
      bodyHtml: [
        greetingHtml(escapeHtml(greeting)),
        paragraphHtml(c.rechazada(q(opts.pregunta, true))),
        motivo
          ? `<p class="email-text email-box" style="margin:0 0 24px;padding:16px 18px;background:${EMAIL_BOX};border-radius:8px;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">${c.motivo}: ${escapeHtml(motivo)}</p>`
          : "",
        conductaHtml(locale),
        primaryButtonHtml(c.volver, volver),
        contactLine(locale),
        paragraphHtml(c.team, "0"),
      ].join(""),
    });
    const textR = [
      greeting,
      "",
      c.rechazada(q(opts.pregunta, false)),
      ...(motivo ? ["", `${c.motivo}: ${motivo}`] : []),
      "",
      conductaText(locale),
      "",
      `${c.volver}: ${volver}`,
      "",
      `${c.doubts} ${EMAIL_CONTACT_ADDRESS}.`,
      "",
      c.team,
      "",
      authorEmailFooterNote(locale, "respuesta"),
    ].join("\n");
    return deliver({ to: opts.to, subject: subjectR, html: htmlR, text: textR });
  }
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
