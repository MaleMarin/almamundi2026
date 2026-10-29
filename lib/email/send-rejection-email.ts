/**
 * Correo al autor cuando su historia no se publica (curación).
 * Tono respetuoso, motivo claro, canal para pedir una nueva revisión.
 */

import { escapeHtml } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  AUTHOR_REPLY_TO,
  EMAIL_BOX,
  EMAIL_FONT,
  EMAIL_INK,
  emailShell,
  greetingHtml,
  paragraphHtml,
} from "@/lib/email/almamundi-email-layout";
import { capitalizeAlias } from "@/lib/email/received-email-template";
import type { AlmaLocale } from "@/lib/i18n/locale";

export const REJECTION_CONTACT_EMAIL = "hola@almamundi.org";

function storyTitleLine(storyTitle: string, locale: AlmaLocale): string {
  return storyTitle.replace(/[\r\n]+/g, " ").trim().slice(0, 200) || rejectionCopy(locale).fallback;
}

export function rejectionEmailSubject(storyTitle: string, locale: AlmaLocale = "es"): string {
  return rejectionCopy(locale).subject(storyTitleLine(storyTitle, locale));
}

export type SendRejectionEmailParams = {
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  publicReason: string;
  locale?: AlmaLocale;
};

function mailLang(locale: AlmaLocale | undefined): AlmaLocale {
  return locale === "pt" || locale === "en" ? locale : "es";
}

function rejectionCopy(locale: AlmaLocale) {
  if (locale === "pt") {
    return {
      fallback: "sua história",
      hello: (name: string) => (name ? `Olá, ${name}:` : "Olá:"),
      subject: (title: string) => `Sobre sua história «${title}» no AlmaMundi`,
      reviewed: (title: string) =>
        `Revisamos sua história «${title}» e, desta vez, não poderemos publicá-la no AlmaMundi.`,
      reason: "Motivo",
      retry: (contact: string) =>
        `Se você acha que houve um erro, responda este e-mail ou escreva para ${contact} e vamos revisá-la de novo.`,
      thanks: "Agradecemos por confiar sua história a nós.<br>Equipe AlmaMundi",
      thanksText: "Agradecemos por confiar sua história a nós.",
      team: "Equipe AlmaMundi",
      privacy: "Política de privacidade",
      because: "Você recebeu este e-mail porque enviou uma história no AlmaMundi.",
    };
  }
  if (locale === "en") {
    return {
      fallback: "your story",
      hello: (name: string) => (name ? `Hello, ${name}:` : "Hello:"),
      subject: (title: string) => `About your story «${title}» on AlmaMundi`,
      reviewed: (title: string) =>
        `We reviewed your story «${title}» and this time we will not be able to publish it on AlmaMundi.`,
      reason: "Reason",
      retry: (contact: string) =>
        `If you think there was a mistake, reply to this email or write to ${contact} and we will review it again.`,
      thanks: "Thank you for trusting us with your story.<br>The AlmaMundi team",
      thanksText: "Thank you for trusting us with your story.",
      team: "The AlmaMundi team",
      privacy: "Privacy policy",
      because: "You received this email because you sent a story on AlmaMundi.",
    };
  }
  return {
    fallback: "tu historia",
    hello: (name: string) => (name ? `Hola, ${name}:` : "Hola:"),
    subject: (title: string) => `Sobre tu historia «${title}» en AlmaMundi`,
    reviewed: (title: string) =>
      `Revisamos tu historia «${title}» y esta vez no podremos publicarla en AlmaMundi.`,
    reason: "Motivo",
    retry: (contact: string) =>
      `Si crees que hubo un error, responde este correo o escríbenos a ${contact} y volveremos a revisarla.`,
    thanks: "Gracias por confiarnos tu historia.<br>Equipo AlmaMundi",
    thanksText: "Gracias por confiarnos tu historia.",
    team: "Equipo AlmaMundi",
    privacy: "Política de privacidad",
    because: "Recibiste este correo porque enviaste una historia en AlmaMundi.",
  };
}

function greetingLine(authorName: string, locale: AlmaLocale): string {
  return rejectionCopy(locale).hello(capitalizeAlias(authorName));
}

export function buildRejectionEmailHtml(params: SendRejectionEmailParams): string {
  const locale = mailLang(params.locale);
  const copy = rejectionCopy(locale);
  const greeting = escapeHtml(greetingLine(params.authorName, locale));
  const storyTitle = escapeHtml(storyTitleLine(params.storyTitle, locale));
  const reason = escapeHtml(params.publicReason.trim());
  const contact = escapeHtml(REJECTION_CONTACT_EMAIL);
  const retry = copy.retry(
    `<a href="mailto:${contact}" class="email-link" style="color:#FF4A1C;font-weight:600;text-decoration:underline;">${contact}</a>`
  );

  const bodyHtml = `
      ${greetingHtml(greeting)}
      ${paragraphHtml(copy.reviewed(storyTitle))}
      <p class="email-text email-box" style="margin:0 0 24px;padding:16px 18px;background:${EMAIL_BOX};border-radius:8px;font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">
        ${copy.reason}: ${reason}
      </p>
      ${paragraphHtml(retry)}
      ${paragraphHtml(copy.thanks, "0")}`;

  return emailShell({ bodyHtml, locale });
}

export function buildRejectionEmailText(params: SendRejectionEmailParams): string {
  const locale = mailLang(params.locale);
  const copy = rejectionCopy(locale);
  const storyTitle = storyTitleLine(params.storyTitle, locale);
  return [
    greetingLine(params.authorName, locale),
    "",
    copy.reviewed(storyTitle),
    "",
    `${copy.reason}: ${params.publicReason.trim()}`,
    "",
    copy.retry(REJECTION_CONTACT_EMAIL),
    "",
    copy.thanksText,
    copy.team,
    "",
    `${copy.privacy}: ${absoluteEmailUrl("/privacidad")}`,
    copy.because,
  ].join("\n");
}

export type SendRejectionEmailResult =
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

export async function sendRejectionEmail(
  params: SendRejectionEmailParams
): Promise<SendRejectionEmailResult> {
  const { getResend } = await import("@/lib/emailSubmission");
  const { noteEmailSent } = await import("@/lib/ops/usage-state");
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = rejectionEmailSubject(params.storyTitle, mailLang(params.locale));

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      replyTo: AUTHOR_REPLY_TO,
      subject,
      html: buildRejectionEmailHtml(params),
      text: buildRejectionEmailText(params),
    });
    if (sent.error) {
      const msg = sent.error.message || "Error de Resend";
      console.error("sendRejectionEmail", sent.error);
      return { ok: false, error: msg };
    }
    await noteEmailSent();
    return { ok: true, emailId: sent.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar el correo";
    console.error("sendRejectionEmail", err);
    return { ok: false, error: msg };
  }
}
