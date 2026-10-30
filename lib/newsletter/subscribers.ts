import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { isValidRecipientEmail } from "@/lib/email-html";
import { getAdminDb } from "@/lib/firebase/admin";
import type { AlmaLocale } from "@/lib/i18n/locale";
import { parseAlmaLocale } from "@/lib/i18n/locale";
import { NEWSLETTER_CONSENT_VERSION, type NewsletterOrigin } from "@/lib/newsletter/copy";

export const NEWSLETTER_COLLECTION = "newsletter_subscribers";

const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;
export const NEWSLETTER_RESEND_WINDOW_MS = 15 * 60 * 1000;

export type NewsletterStatus = "pending" | "confirmed" | "unsubscribed";

export type SubscriberDoc = {
  email: string;
  estado: NewsletterStatus;
  idioma: AlmaLocale;
  consentedAt: string;
  consentVersion: string;
  origen: NewsletterOrigin;
  token: string;
  confirmSentAt?: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
};

export type NewsletterTokenResult =
  | { kind: "confirmed"; locale: AlmaLocale }
  | { kind: "unsubscribed"; locale: AlmaLocale }
  | { kind: "invalid" };

export function newsletterDocId(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

export function normalizeNewsletterEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!isValidRecipientEmail(email)) return null;
  return email;
}

export function newNewsletterToken(): string {
  return randomBytes(32).toString("base64url");
}

export function newsletterTokenOk(token: string): boolean {
  return TOKEN_RE.test(token);
}

function audienceResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function audienceId(): string {
  return process.env.RESEND_AUDIENCE_ID?.trim() ?? "";
}

/** Mismo origen que los otros correos, sin cargar el módulo del diseño. */
function siteOrigin(): string {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv !== "production") {
    const raw = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (raw && !raw.includes("/") && !raw.includes(" ")) return `https://${raw}`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      return new URL(site).origin;
    } catch {
      /* sigue el origen público */
    }
  }
  return "https://www.almamundi.org";
}

function absolutePath(path: string): string {
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

async function addToAudience(email: string, token: string): Promise<void> {
  const id = audienceId();
  const resend = audienceResend();
  if (!id || !resend) {
    console.warn("[newsletter] falta RESEND_AUDIENCE_ID; confirmado solo en Firestore");
    return;
  }
  const properties = {
    baja: absolutePath(`/newsletter/baja?t=${encodeURIComponent(token)}`),
    baja_cabecera: absolutePath(`/api/newsletter/baja?t=${encodeURIComponent(token)}`),
  };
  const created = await resend.contacts.create({
    email,
    audienceId: id,
    unsubscribed: false,
    properties,
  });
  if (!created.error) return;
  const updated = await resend.contacts.update({
    email,
    audienceId: id,
    unsubscribed: false,
    properties,
  });
  if (updated.error) console.error("[newsletter] audience", updated.error.name || "update");
}

async function removeFromAudience(email: string): Promise<void> {
  const id = audienceId();
  const resend = audienceResend();
  if (!id || !resend) return;
  const removed = await resend.contacts.remove({ email, audienceId: id });
  if (removed.error && removed.error.name !== "not_found") {
    console.error("[newsletter] audience remove", removed.error.name || "remove");
  }
}

async function subscriberByToken(token: string) {
  if (!TOKEN_RE.test(token)) return null;
  const db = getAdminDb();
  const snap = await db.collection(NEWSLETTER_COLLECTION).where("token", "==", token).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0] ?? null;
}

export async function confirmNewsletterToken(token: string): Promise<NewsletterTokenResult> {
  const doc = await subscriberByToken(token);
  if (!doc) return { kind: "invalid" };
  const data = doc.data() as Partial<SubscriberDoc>;
  const locale = parseAlmaLocale(typeof data.idioma === "string" ? data.idioma : undefined);
  const estado = data.estado;
  const email = typeof data.email === "string" ? data.email : "";
  if (!email || (estado !== "pending" && estado !== "confirmed" && estado !== "unsubscribed")) {
    return { kind: "invalid" };
  }
  if (estado === "unsubscribed") return { kind: "unsubscribed", locale };
  if (estado === "pending") {
    await doc.ref.update({ estado: "confirmed", confirmedAt: new Date().toISOString() });
  }
  await addToAudience(email, token);
  return { kind: "confirmed", locale };
}

export async function unsubscribeNewsletterToken(token: string): Promise<NewsletterTokenResult> {
  const doc = await subscriberByToken(token);
  if (!doc) return { kind: "invalid" };
  const data = doc.data() as Partial<SubscriberDoc>;
  const locale = parseAlmaLocale(typeof data.idioma === "string" ? data.idioma : undefined);
  const email = typeof data.email === "string" ? data.email : "";
  const estado = data.estado;
  if (!email || (estado !== "pending" && estado !== "confirmed" && estado !== "unsubscribed")) {
    return { kind: "invalid" };
  }
  if (estado !== "unsubscribed") {
    await doc.ref.update({ estado: "unsubscribed", unsubscribedAt: new Date().toISOString() });
  }
  await removeFromAudience(email);
  return { kind: "unsubscribed", locale };
}

export function subscriberRef(email: string) {
  return getAdminDb().collection(NEWSLETTER_COLLECTION).doc(newsletterDocId(email));
}

export { NEWSLETTER_CONSENT_VERSION };
