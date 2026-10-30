import { escapeHtml } from "@/lib/email-html";
import {
  absoluteEmailUrl,
  EMAIL_FONT,
  EMAIL_INK,
  EMAIL_MUTED,
  emailShell,
  paragraphHtml,
  primaryButtonHtml,
} from "@/lib/email/almamundi-email-layout";
import type { AlmaLocale } from "@/lib/i18n/locale";
import { newsletterConfirmMail } from "@/lib/newsletter/copy";

export function newsletterConfirmUrl(token: string): string {
  return absoluteEmailUrl(`/newsletter/confirmar?t=${encodeURIComponent(token)}`);
}

export function buildNewsletterConfirmHtml(locale: AlmaLocale, token: string): string {
  const copy = newsletterConfirmMail(locale);
  const definition = `<p class="email-text" style="margin:0 0 16px;font-size:16px;line-height:1.6;font-style:italic;color:${EMAIL_INK};font-family:${EMAIL_FONT};">${escapeHtml(copy.definition)}</p>`;
  const note = `<p class="email-footer" style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${EMAIL_MUTED};font-family:${EMAIL_FONT};">${escapeHtml(copy.note)}</p>`;
  return emailShell({
    preheader: copy.body,
    locale,
    footer: "newsletter",
    bodyHtml: `${definition}${paragraphHtml(escapeHtml(copy.body))}${primaryButtonHtml(copy.button, newsletterConfirmUrl(token))}${note}`,
  });
}

export function buildNewsletterConfirmText(locale: AlmaLocale, token: string): string {
  const copy = newsletterConfirmMail(locale);
  return [copy.definition, "", copy.body, "", `${copy.button}: ${newsletterConfirmUrl(token)}`, "", copy.note].join("\n");
}
