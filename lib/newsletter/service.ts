import "server-only";

import { getResend } from "@/lib/emailSubmission";
import { AUTHOR_REPLY_TO } from "@/lib/email/almamundi-email-layout";
import {
  buildNewsletterConfirmHtml,
  buildNewsletterConfirmText,
} from "@/lib/email/newsletter-confirm-template";
import { noteEmailSent } from "@/lib/ops/usage-state";
import type { AlmaLocale } from "@/lib/i18n/locale";
import { newsletterConfirmMail, type NewsletterOrigin } from "@/lib/newsletter/copy";
import {
  NEWSLETTER_CONSENT_VERSION,
  NEWSLETTER_RESEND_WINDOW_MS,
  newNewsletterToken,
  newsletterTokenOk,
  normalizeNewsletterEmail,
  subscriberRef,
  type SubscriberDoc,
} from "@/lib/newsletter/subscribers";

async function sendConfirmation(email: string, locale: AlmaLocale, token: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.error("[newsletter] falta RESEND_API_KEY");
    return false;
  }
  const fromRaw = (
    process.env.RESEND_FROM_EMAIL ??
    process.env.MAIL_FROM ??
    "AlmaMundi <hola@almamundi.org>"
  ).trim();
  const from = fromRaw.includes("<") ? fromRaw : `AlmaMundi <${fromRaw}>`;
  const copy = newsletterConfirmMail(locale);
  try {
    const sent = await resend.emails.send({
      from,
      to: email,
      replyTo: AUTHOR_REPLY_TO,
      subject: copy.subject,
      html: buildNewsletterConfirmHtml(locale, token),
      text: buildNewsletterConfirmText(locale, token),
    });
    if (sent.error) {
      console.error("[newsletter] send", sent.error.name || "send");
      return false;
    }
    await noteEmailSent();
    return true;
  } catch (err) {
    console.error("[newsletter] send", err instanceof Error ? err.name : "send");
    return false;
  }
}

/**
 * Alta o reenvío de confirmación. Si el correo ya está confirmado, no cambia nada
 * y no revela si existe: la respuesta es la misma que la de un alta nueva.
 */
export async function requestNewsletterConfirmation(input: {
  email: string;
  locale: AlmaLocale;
  origin: NewsletterOrigin;
}): Promise<{ ok: true } | { ok: false; error: "invalid" | "send" }> {
  const email = normalizeNewsletterEmail(input.email);
  if (!email) return { ok: false, error: "invalid" };
  const locale = input.locale === "pt" || input.locale === "en" ? input.locale : "es";
  const origin = input.origin === "contar" ? "contar" : "franja";
  const ref = subscriberRef(email);
  const snap = await ref.get();
  const now = new Date().toISOString();
  const current = snap.exists ? (snap.data() as Partial<SubscriberDoc>) : null;
  if (current?.estado === "confirmed") return { ok: true };

  const sentAt = current?.confirmSentAt ? Date.parse(current.confirmSentAt) : NaN;
  const recent =
    current?.estado === "pending" &&
    Number.isFinite(sentAt) &&
    Date.now() - sentAt < NEWSLETTER_RESEND_WINDOW_MS &&
    typeof current.token === "string" &&
    newsletterTokenOk(current.token);
  if (recent) return { ok: true };

  const token = newNewsletterToken();
  const doc: SubscriberDoc = {
    email,
    estado: "pending",
    idioma: locale,
    consentedAt: now,
    consentVersion: NEWSLETTER_CONSENT_VERSION,
    origen: origin,
    token,
  };
  await ref.set(doc);
  const sent = await sendConfirmation(email, locale, token);
  if (!sent) return { ok: false, error: "send" };
  await ref.update({ confirmSentAt: new Date().toISOString() });
  return { ok: true };
}
