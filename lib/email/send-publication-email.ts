/**
 * Correo al autor cuando su historia queda publicada en el mapa (curación).
 */

import { escapeHtml } from "@/lib/email-html";
import { getResend } from "@/lib/emailSubmission";
import {
  brandHeaderHtml,
  EMAIL_PUBLIC_ORIGIN,
  emailLogoAttachment,
  emailShell,
  invitationHtml,
  loadInlineWordmark,
  primaryButtonHtml,
  secondaryLinkHtml,
  whatsappShareHref,
} from "@/lib/email/almamundi-email-layout";
import { noteEmailSent } from "@/lib/ops/usage-state";

export type SendPublicationEmailParams = {
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  storyId: string;
  placeName: string;
  /** Rincón privado del autor (`/historias/[id]/mi-eco?t=`). */
  ecoUrl?: string;
};

function displayName(authorName: string): string {
  return authorName.trim().replace(/[\r\n]+/g, " ").slice(0, 80);
}

export function publicationEmailSubject(): string {
  return "Tu historia ya está en AlmaMundi";
}

function storyPublicUrl(storyId: string): string {
  return `${EMAIL_PUBLIC_ORIGIN}/historias/${encodeURIComponent(storyId)}`;
}

export function buildPublicationEmailText(params: SendPublicationEmailParams): string {
  const name = displayName(params.authorName);
  const greeting = name ? `Hola ${name},` : "Hola,";
  const storyUrl = storyPublicUrl(params.storyId);
  const shareText = `Te invito a leer esta historia en AlmaMundi: ${storyUrl}`;
  return [
    greeting,
    "",
    `Tu historia "${params.storyTitle.trim() || "sin título"}" ya está en AlmaMundi.`,
    `Puede verse desde cualquier parte del mundo, anclada en ${params.placeName.trim() || "el mapa"}.`,
    "",
    "Si quieres, compártela con quien quieras. Cada historia despierta otra.",
    "",
    `Ver mi historia: ${storyUrl}`,
    `Compartir por WhatsApp: ${whatsappShareHref(shareText)}`,
    `Contar otra historia: ${EMAIL_PUBLIC_ORIGIN}/contar`,
    params.ecoUrl?.trim() ? `Tu rincón privado: ${params.ecoUrl.trim()}` : "",
    "",
    "Un abrazo,",
    "Equipo AlmaMundi",
    "",
    `${EMAIL_PUBLIC_ORIGIN} · Política de privacidad: ${EMAIL_PUBLIC_ORIGIN}/privacidad`,
    "Recibiste este correo porque enviaste una historia en AlmaMundi.",
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");
}

export function buildPublicationEmailHtml(
  params: SendPublicationEmailParams,
  hasInlineLogo = false
): string {
  const authorName = escapeHtml(displayName(params.authorName));
  const storyTitle = escapeHtml(params.storyTitle.trim() || "sin título");
  const placeName = escapeHtml(params.placeName.trim() || "el mapa");
  const historiasUrl = storyPublicUrl(params.storyId);
  const shareText = `Te invito a leer esta historia en AlmaMundi: ${historiasUrl}`;
  const ecoHref = params.ecoUrl?.trim() ?? "";
  const greeting = authorName ? `Hola ${authorName},` : "Hola,";
  const ecoBlock = ecoHref
    ? `
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568;line-height:1.6">
        En este rincón puedes ver cuántas personas resonaron con tu historia
        y volver a descargar tu cinta de colores.
      </p>
      ${secondaryLinkHtml("Ir a mi eco", ecoHref)}`
    : "";

  const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568;line-height:1.6">
        Tu historia <strong>"${storyTitle}"</strong> ya está en AlmaMundi.
        Puede verse desde cualquier parte del mundo, anclada en <strong>${placeName}</strong>.
      </p>
      <p style="margin:0 0 28px;font-size:16px;color:#4A5568;line-height:1.6">
        Si quieres, compártela con quien quieras. Cada historia despierta otra.
      </p>
      ${primaryButtonHtml("Ver mi historia", historiasUrl)}
      ${secondaryLinkHtml("Compartir por WhatsApp", whatsappShareHref(shareText))}
      ${invitationHtml()}
      ${ecoBlock}
      <p style="margin:0;font-size:16px;color:#4A5568;line-height:1.6">
        Un abrazo,<br>
        Equipo AlmaMundi
      </p>`;

  return emailShell({
    headerHtml: brandHeaderHtml(hasInlineLogo),
    bodyHtml,
  });
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
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }

  const from = mailFromAddress();
  const subject = publicationEmailSubject();
  const logo = await loadInlineWordmark();

  try {
    const sent = await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildPublicationEmailHtml(params, Boolean(logo)),
      text: buildPublicationEmailText(params),
      ...(logo ? { attachments: [emailLogoAttachment(logo)] } : {}),
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
