/**
 * Sanitización para interpolar texto de usuarios en plantillas HTML de correo.
 */

const MAX_EMAIL_LEN = 254;
const MAX_LOCAL_PART = 64;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Recorta y escapa texto plano para asunto o cuerpo. */
export function safeEmailText(text: string, maxLen: number): string {
  const t = text.normalize("NFKC").slice(0, maxLen);
  return escapeHtml(t);
}

/**
 * Valida destinatario para envío (anti-abuso básico).
 */
export function isValidRecipientEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  if (!e || e.length > MAX_EMAIL_LEN) return false;
  const at = e.indexOf("@");
  if (at <= 0 || at === e.length - 1) return false;
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (local.length > MAX_LOCAL_PART || local.includes("..")) return false;
  if (!/^[a-z0-9._+-]+$/i.test(local)) return false;
  if (domain.length > 253 || !domain.includes(".")) return false;
  if (!/^[a-z0-9.-]+$/i.test(domain)) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  return true;
}

/**
 * Solo http(s) permitidos; descarta javascript:, data:, etc.
 */
export function safeHrefForEmail(url: string, allowedOriginHints: string[]): string {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return "#";
    const host = u.hostname.toLowerCase();
    const ok =
      allowedOriginHints.some((h) => host === h || host.endsWith(`.${h}`)) ||
      host.endsWith(".vercel.app") ||
      host === "localhost";
    if (!ok && allowedOriginHints.length > 0) return "#";
    return u.href.slice(0, 2048);
  } catch {
    return "#";
  }
}

/** URL para usar en atributo style background-image (escapada). */
export function safeCssUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    const s = u.href.replace(/["'()\\\s]/g, "");
    return s.slice(0, 2048);
  } catch {
    return "";
  }
}
