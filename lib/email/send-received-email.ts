/**
 * Correo inmediato al autor cuando AlmaMundi recibe su historia (antes de curación).
 */

import { escapeHtml } from "@/lib/email-html";
import { getResend } from "@/lib/emailSubmission";
import {
  brandHeaderHtml,
  EMAIL_PUBLIC_ORIGIN,
  EMAIL_WHATSAPP_INVITE,
  emailLogoAttachment,
  emailShell,
  invitationHtml,
  loadInlineWordmark,
  secondaryLinkHtml,
  whatsappShareHref,
} from "@/lib/email/almamundi-email-layout";
import { noteEmailSent } from "@/lib/ops/usage-state";

export type SendReceivedEmailParams = {
  /** Vacío si la persona no dejó nombre ni alias. */
  authorName: string;
  authorEmail: string;
};

function displayName(authorName: string): string {
  return authorName.trim().replace(/[\r\n]+/g, " ").slice(0, 80);
}

function greetingLine(authorName: string): string {
  const n = displayName(authorName);
  return n ? `Hola ${n},` : "Hola,";
}

export function receivedEmailSubject(authorName: string): string {
  const n = displayName(authorName);
  return n ? `${n}, tu historia ya llegó a AlmaMundi` : "Tu historia ya llegó a AlmaMundi";
}

export function buildReceivedEmailText(params: SendReceivedEmailParams): string {
  const greeting = greetingLine(params.authorName);
  return [
    greeting,
    "",
    "Tu historia ya llegó a AlmaMundi. Gracias por confiarnos este momento.",
    "",
    "Ahora la vamos a leer con calma y te escribiremos apenas aparezca en el mapa, junto a historias de personas de muchos lugares.",
    "",
    "Mientras tanto, ¿conoces a alguien que también tenga algo que contar? Comparte almamundi.org con quien quieras. Cada historia despierta otra.",
    "",
    `Contar otra historia: ${EMAIL_PUBLIC_ORIGIN}/contar`,
    `Compartir por WhatsApp: ${whatsappShareHref(EMAIL_WHATSAPP_INVITE)}`,
    "",
    "Un abrazo,",
    "Equipo AlmaMundi",
    "",
    `${EMAIL_PUBLIC_ORIGIN} · Política de privacidad: ${EMAIL_PUBLIC_ORIGIN}/privacidad`,
    "Recibiste este correo porque enviaste una historia en AlmaMundi.",
  ].join("\n");
}

export function buildReceivedEmailHtml(
  params: SendReceivedEmailParams,
  hasInlineLogo = false
): string {
  const greeting = escapeHtml(greetingLine(params.authorName));
  const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568;line-height:1.6">
        Tu historia ya llegó a AlmaMundi. Gracias por confiarnos este momento.
      </p>
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568;line-height:1.6">
        Ahora la vamos a leer con calma y te escribiremos apenas aparezca en el mapa, junto a historias de personas de muchos lugares.
      </p>
      <p style="margin:0 0 28px;font-size:16px;color:#4A5568;line-height:1.6">
        Mientras tanto, ¿conoces a alguien que también tenga algo que contar? Comparte almamundi.org con quien quieras. Cada historia despierta otra.
      </p>
      ${invitationHtml()}
      ${secondaryLinkHtml("Compartir por WhatsApp", whatsappShareHref(EMAIL_WHATSAPP_INVITE))}
      <p style="margin:0;font-size:16px;color:#4A5568;line-height:1.6">
        Un abrazo,<br>
        Equipo AlmaMundi
      </p>`;

  return emailShell({
    headerHtml: brandHeaderHtml(hasInlineLogo),
    bodyHtml,
  });
}

export type SendReceivedEmailResult =
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

export async function sendReceivedEmail(
  params: SendReceivedEmailParams
): Promise<SendReceivedEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = receivedEmailSubject(params.authorName);
  const logo = await loadInlineWordmark();

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildReceivedEmailHtml(params, Boolean(logo)),
      text: buildReceivedEmailText(params),
      ...(logo ? { attachments: [emailLogoAttachment(logo)] } : {}),
    });
    if (sent.error) {
      const msg = sent.error.message || "Error de Resend";
      console.error("sendReceivedEmail", sent.error);
      return { ok: false, error: msg };
    }
    await noteEmailSent();
    return { ok: true, emailId: sent.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar el correo";
    console.error("sendReceivedEmail", err);
    return { ok: false, error: msg };
  }
}
