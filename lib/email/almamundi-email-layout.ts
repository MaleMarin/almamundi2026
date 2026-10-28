import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { escapeHtml } from "@/lib/email-html";

const PRODUCTION_SITE_FALLBACK = "https://www.almamundi.org";

export const BRAND_ORANGE = "#D13D17";
export const EMAIL_INK = "#1C1C2E";
export const EMAIL_MUTED = "#4E5160";
export const EMAIL_CANVAS = "#F2F3F7";
export const EMAIL_CARD = "#FFFFFF";
export const EMAIL_BOX = "#F6F7FA";
export const EMAIL_FONT = "Montserrat, Arial, Helvetica, sans-serif";
export const LOGO_CID = "almamundi-logo";
export const EMAIL_CONTACT_ADDRESS = "hola@almamundi.org";
/** Responder un correo dirigido a quien contó la historia llega al equipo. */
export const AUTHOR_REPLY_TO = EMAIL_CONTACT_ADDRESS;

const WORDMARK_PATH = fileURLToPath(
  new URL("./almamundi-wordmark-orange.png", import.meta.url)
);

/**
 * Producción: NEXT_PUBLIC_SITE_URL.
 * Cualquier otro VERCEL_ENV: host del despliegue (VERCEL_URL), para probar los enlaces.
 */
export function emailPublicOrigin(): string {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv !== "production") {
    const host = deploymentHost();
    if (host) return host;
  }
  return productionSiteOrigin();
}

export function absoluteEmailUrl(path: string): string {
  const origin = emailPublicOrigin();
  if (!path || path === "/") return `${origin}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

function deploymentHost(): string | null {
  const raw = process.env.VERCEL_URL?.trim();
  if (!raw) return null;
  const bare = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!bare || bare.includes("/") || bare.includes(" ")) return null;
  return `https://${bare}`;
}

function productionSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return PRODUCTION_SITE_FALLBACK;
  try {
    const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
    return new URL(normalized).origin;
  } catch {
    return PRODUCTION_SITE_FALLBACK;
  }
}

export async function loadInlineWordmark(): Promise<Buffer | null> {
  try {
    return await readFile(WORDMARK_PATH);
  } catch {
    return null;
  }
}

export function emailLogoAttachment(logo: Buffer) {
  return {
    filename: "almamundi-logo.png",
    content: logo,
    contentType: "image/png" as const,
    contentId: LOGO_CID,
    contentDisposition: "inline" as const,
  };
}

/** La persona elige a quién enviarle su historia. No es un canal hacia AlmaMundi. */
export function whatsappShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function brandHeaderHtml(): string {
  const home = absoluteEmailUrl("/");
  return `<p style="margin:0 0 28px;text-align:left;">
      <a href="${escapeHtml(home)}" target="_blank" rel="noopener noreferrer"
        class="email-brand"
        style="color:${BRAND_ORANGE};text-decoration:none;font-family:${EMAIL_FONT};font-size:18px;font-weight:700;letter-spacing:0.22em;">
        ALMAMUNDI
      </a>
    </p>`;
}

export function paragraphHtml(inner: string, margin = "0 0 16px"): string {
  return `<p class="email-text" style="margin:${margin};font-size:16px;line-height:1.6;color:${EMAIL_INK};font-family:${EMAIL_FONT};">
        ${inner}
      </p>`;
}

export function greetingHtml(inner: string): string {
  return `<p class="email-text" style="margin:0 0 16px;font-size:20px;line-height:1.4;font-weight:700;color:${EMAIL_INK};font-family:${EMAIL_FONT};">
        ${inner}
      </p>`;
}

/**
 * Botón de 48 px. El color va en la celda para Outlook y en el enlace para el resto.
 */
export function primaryButtonHtml(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 16px;">
        <tr>
          <td align="center" bgcolor="${BRAND_ORANGE}" height="48"
            style="height:48px;background-color:${BRAND_ORANGE};border-radius:8px;text-align:center;">
            <a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="email-btn"
              style="display:inline-block;height:48px;line-height:48px;padding:0 28px;background-color:${BRAND_ORANGE};color:#ffffff;text-decoration:none;font-family:${EMAIL_FONT};font-size:16px;font-weight:700;border-radius:8px;">
              ${safeLabel}
            </a>
          </td>
        </tr>
      </table>`;
}

export function secondaryLinkHtml(label: string, href: string): string {
  return `<p class="email-text" style="margin:0 0 24px;text-align:center;font-size:16px;line-height:1.6;font-family:${EMAIL_FONT};">
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="email-link"
          style="color:${BRAND_ORANGE};text-decoration:underline;">
          ${escapeHtml(label)}
        </a>
      </p>`;
}

export function invitationHtml(): string {
  return primaryButtonHtml("Contar otra historia", absoluteEmailUrl("/contar"));
}

function receivedFooterHtml(): string {
  const privacy = absoluteEmailUrl("/privacidad");
  return `<p class="email-footer" style="margin:0;font-size:13px;line-height:1.6;color:${EMAIL_MUTED};font-family:${EMAIL_FONT};">
        Recibes este correo porque enviaste una historia a AlmaMundi. AlmaMundi es una iniciativa de Precisar.
        <a href="${escapeHtml(privacy)}" target="_blank" rel="noopener noreferrer" class="email-footer-link"
          style="color:${EMAIL_MUTED};text-decoration:underline;">Política de privacidad</a>.
      </p>`;
}

function respuestaFooterHtml(): string {
  const privacy = absoluteEmailUrl("/privacidad");
  return `<p class="email-footer" style="margin:0;font-size:13px;line-height:1.6;color:${EMAIL_MUTED};font-family:${EMAIL_FONT};">
        Recibes este correo porque enviaste una respuesta a AlmaMundi. AlmaMundi es una iniciativa de Precisar.
        <a href="${escapeHtml(privacy)}" target="_blank" rel="noopener noreferrer" class="email-footer-link"
          style="color:${EMAIL_MUTED};text-decoration:underline;">Política de privacidad</a>.
      </p>`;
}

function accountFooterHtml(): string {
  const home = absoluteEmailUrl("/");
  const privacy = absoluteEmailUrl("/privacidad");
  return `<p class="email-footer" style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${EMAIL_MUTED};font-family:${EMAIL_FONT};">
        <a href="${escapeHtml(home)}" target="_blank" rel="noopener noreferrer" class="email-footer-link"
          style="color:${EMAIL_MUTED};text-decoration:none;">almamundi.org</a>
        ·
        <a href="${escapeHtml(privacy)}" target="_blank" rel="noopener noreferrer" class="email-footer-link"
          style="color:${EMAIL_MUTED};text-decoration:underline;">Política de privacidad</a>
      </p>
      <p class="email-footer" style="margin:0;font-size:13px;line-height:1.6;color:${EMAIL_MUTED};font-family:${EMAIL_FONT};">
        Recibiste este correo porque enviaste una historia en AlmaMundi.
      </p>`;
}

function darkModeCss(): string {
  return `
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background: #12121C !important; }
      .email-card, .email-pad { background: #1C1C2E !important; }
      .email-text, .email-text p, .email-text li { color: #F7F8FC !important; }
      .email-box { background: #2A2A40 !important; }
      .email-link { color: #FFB199 !important; }
      .email-footer, .email-footer-link { color: #D5D7E2 !important; }
      .email-brand { color: #D13D17 !important; }
      .email-btn, .email-btn span { color: #ffffff !important; background: #D13D17 !important; }
    }
    @media only screen and (max-width: 620px) {
      .email-card { width: 100% !important; }
      .email-pad { padding: 24px !important; }
    }
  `;
}

export function emailShell(opts: {
  preheader?: string;
  bodyHtml: string;
  footer?: "received" | "account" | "respuesta";
}): string {
  const preheader = opts.preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
        ${escapeHtml(opts.preheader)}
      </div>`
    : "";
  const footer =
    opts.footer === "received"
      ? receivedFooterHtml()
      : opts.footer === "respuesta"
        ? respuestaFooterHtml()
        : accountFooterHtml();

  return `<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap">
  <style>${darkModeCss()}</style>
</head>
<body class="email-bg" style="margin:0;padding:0;background:${EMAIL_CANVAS};font-family:${EMAIL_FONT};color:${EMAIL_INK};">
  ${preheader}
  <table class="email-bg" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL_CANVAS}" style="background:${EMAIL_CANVAS};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table class="email-card" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL_CARD}"
          style="width:600px;max-width:600px;background:${EMAIL_CARD};">
          <tr>
            <td class="email-pad email-text" style="padding:32px;font-family:${EMAIL_FONT};color:${EMAIL_INK};">
              ${brandHeaderHtml()}
              ${opts.bodyHtml}
              <div style="margin-top:28px;">
                ${footer}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
