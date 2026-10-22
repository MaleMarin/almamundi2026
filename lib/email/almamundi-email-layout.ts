import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { escapeHtml } from "@/lib/email-html";

export const EMAIL_PUBLIC_ORIGIN = "https://www.almamundi.org";
export const EMAIL_LOGO_PUBLIC_URL = `${EMAIL_PUBLIC_ORIGIN}/email/almamundi-wordmark-orange.png`;
export const BRAND_ORANGE = "#FF4A1C";
export const LOGO_CID = "almamundi-logo";
export const EMAIL_TAGLINE =
  "Tus historias no se pierden en el scroll, despiertan otras historias.";
export const EMAIL_WHATSAPP_INVITE =
  "Te invito a contar tu historia en AlmaMundi: https://www.almamundi.org";

const WORDMARK_PATH = fileURLToPath(
  new URL("./almamundi-wordmark-orange.png", import.meta.url)
);
const WORDMARK_FONT =
  "Avenir, 'Avenir Light', 'Avenir Next', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

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

export function whatsappShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Logo: URL pública absoluta + CID si el PNG viaja adjunto
 * (Gmail, Outlook y Apple Mail lo muestran sin pedir «mostrar imágenes»).
 */
export function brandHeaderHtml(hasInlineLogo = false): string {
  const src = hasInlineLogo ? `cid:${LOGO_CID}` : EMAIL_LOGO_PUBLIC_URL;
  return `<a href="${EMAIL_PUBLIC_ORIGIN}" target="_blank" rel="noopener noreferrer"
      style="text-decoration:none;border:0;display:inline-block">
      <img src="${src}" alt="AlmaMundi" width="180" height="180"
        style="display:block;margin:0 auto;width:180px;max-width:180px;height:auto;border:0;outline:none;text-decoration:none;background:#F7F4EE">
    </a>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#6B6B60;font-family:${WORDMARK_FONT}">
      ${escapeHtml(EMAIL_TAGLINE)}
    </p>`;
}

export function invitationHtml(): string {
  return primaryButtonHtml("Contar otra historia", `${EMAIL_PUBLIC_ORIGIN}/contar`);
}

export function primaryButtonHtml(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:0 auto 16px">
        <tr>
          <td style="background:${BRAND_ORANGE};border-radius:100px;padding:14px 32px">
            <a href="${escapeHtml(href)}"
              style="color:#ffffff;text-decoration:none;
              font-size:15px;font-weight:700;">
              ${escapeHtml(label)}
            </a>
          </td>
        </tr>
      </table>`;
}

export function secondaryLinkHtml(label: string, href: string): string {
  return `<p style="margin:0 0 24px;text-align:center;font-size:14px;line-height:1.5">
        <a href="${escapeHtml(href)}" style="color:${BRAND_ORANGE};text-decoration:underline">
          ${escapeHtml(label)}
        </a>
      </p>`;
}

export function emailShell(opts: {
  headerHtml: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="padding:40px 20px">
<table width="600" cellpadding="0" cellspacing="0" role="presentation"
  style="background:#E8EBF2;border-radius:24px;
  box-shadow:14px 14px 34px rgba(136,150,170,0.48),
  -14px -14px 38px rgba(255,255,255,0.98)">
  <tr>
    <td style="padding:32px 40px 24px;text-align:center;
      border-bottom:1px solid rgba(255,255,255,0.6);background:#F7F4EE">
      ${opts.headerHtml}
    </td>
  </tr>
  <tr>
    <td style="padding:40px 40px 32px">
      ${opts.bodyHtml}
    </td>
  </tr>
  <tr>
    <td style="padding:24px 40px;text-align:center;
      border-top:1px solid rgba(255,255,255,0.6)">
      <p style="margin:0;font-size:13px;color:#9299a8">
        <a href="${EMAIL_PUBLIC_ORIGIN}" style="color:#9299a8;text-decoration:none">almamundi.org</a>
        ·
        <a href="${EMAIL_PUBLIC_ORIGIN}/privacidad" style="color:#9299a8">Política de privacidad</a>
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#9299a8">
        Recibiste este correo porque enviaste una historia en AlmaMundi.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
