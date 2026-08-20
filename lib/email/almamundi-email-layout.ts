import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const EMAIL_PUBLIC_ORIGIN = "https://www.almamundi.org";
export const BRAND_ORANGE = "#FF4A1C";
export const LOGO_CID = "almamundi-logo";

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

/** Logo (o wordmark de texto) enlazado a la home. Una sola imagen, CID, sin PNG remotos. */
export function brandHeaderHtml(hasInlineLogo: boolean): string {
  // El PNG es 500x500. En Gmail, width + max-height aplasta el dibujo.
  const inner = hasInlineLogo
    ? `<img src="cid:${LOGO_CID}" alt="AlmaMundi" width="180" height="180"
        style="display:block;margin:0 auto;width:180px;height:180px;border:0;outline:none;text-decoration:none">`
    : `<span style="font-size:22px;font-weight:300;letter-spacing:0.04em;color:${BRAND_ORANGE};font-family:${WORDMARK_FONT}">AlmaMundi</span>`;

  return `<a href="${EMAIL_PUBLIC_ORIGIN}" target="_blank" rel="noopener noreferrer"
      style="text-decoration:none;border:0;display:inline-block">
      ${inner}
    </a>`;
}

export function invitationHtml(): string {
  return `<p style="margin:0 0 24px;font-size:16px;color:#4A5568;line-height:1.6">
    Si tienes otra que quieras contar, puedes
    <a href="${EMAIL_PUBLIC_ORIGIN}/subir"
      style="color:${BRAND_ORANGE};text-decoration:underline">dejarla aquí</a>.
  </p>`;
}

export function emailShell(opts: {
  headerHtml: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 20px">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#E8EBF2;border-radius:24px;
  box-shadow:14px 14px 34px rgba(136,150,170,0.48),
  -14px -14px 38px rgba(255,255,255,0.98)">
  <tr>
    <td style="padding:32px 40px 24px;text-align:center;
      border-bottom:1px solid rgba(255,255,255,0.6)">
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
      <p style="margin:0;font-size:13px;color:#9299a8">El equipo de AlmaMundi</p>
      <p style="margin:8px 0 0;font-size:12px;color:#9299a8">
        <a href="${EMAIL_PUBLIC_ORIGIN}/privacidad" style="color:#9299a8">Política de privacidad</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
