/**
 * Notificación por email cuando un envío cambia de estado (ej. aprobado).
 * Usar Resend si RESEND_API_KEY está configurado.
 *
 * Al aprobar un submission (en panel de curaduría), llamar:
 *   await sendSubmissionStatusEmail(email, 'approved', publicLink);
 */

import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendSubmissionStatusEmail(
  email: string,
  status: "approved" | "rejected",
  link?: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    // TODO: integrar mailer cuando exista. Llamar desde el flujo de curaduría al aprobar/rechazar.
    return false;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? process.env.MAIL_FROM ?? "AlmaMundi <hola@almamundi.org>";
  const subject = status === "approved"
    ? "Tu envío fue aprobado en AlmaMundi"
    : "Actualización sobre tu envío en AlmaMundi";

  const body =
    status === "approved"
      ? link
        ? `<p>Tu envío ha pasado la curaduría y ya está publicado.</p><p><a href="${link}">Ver en el mapa</a></p>`
        : "<p>Tu envío ha pasado la curaduría.</p>"
      : "<p>Lamentablemente tu envío no pudo ser publicado en esta ocasión.</p>";

  try {
    await resend.emails.send({
      from,
      to: email,
      subject,
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.5">${body}</div>`,
    });
    return true;
  } catch (err) {
    console.error("sendSubmissionStatusEmail", err);
    return false;
  }
}
