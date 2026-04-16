/**
 * Correo al autor cuando su historia queda publicada en el mapa (curación).
 */

import { getResend } from '@/lib/emailSubmission';

export type SendPublicationEmailParams = {
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  storyId: string;
  placeName: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPublicationEmailHtml(params: SendPublicationEmailParams): string {
  const authorName = escapeHtml(params.authorName);
  const storyTitle = escapeHtml(params.storyTitle);
  const placeName = escapeHtml(params.placeName);
  const storyIdEnc = encodeURIComponent(params.storyId);
  const historiasUrl = `https://www.almamundi.org/historias/${storyIdEnc}`;

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 20px">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#E8EBF2;border-radius:24px;
  box-shadow:14px 14px 34px rgba(136,150,170,0.48),
  -14px -14px 38px rgba(255,255,255,0.98)">

  <!-- Header con logos -->
  <tr>
    <td style="padding:32px 40px 24px;text-align:center;
      border-bottom:1px solid rgba(255,255,255,0.6)">
      <img src="https://www.almamundi.org/logo.png"
        alt="AlmaMundi" height="40"
        style="margin-right:16px;vertical-align:middle">
      <img src="https://www.almamundi.org/logo-precisar.png"
        alt="Precisar" height="32"
        style="vertical-align:middle">
    </td>
  </tr>

  <!-- Cuerpo -->
  <tr>
    <td style="padding:40px 40px 32px">
      <p style="margin:0 0 16px;font-size:16px;color:#4A5568">
        Hola ${authorName},
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#4A5568;line-height:1.6">
        Tu historia <strong>"${storyTitle}"</strong> ya está
        publicada en el mapa de AlmaMundi.
        Puede verse desde cualquier parte del mundo.
      </p>
      <p style="margin:0 0 32px;font-size:16px;color:#4A5568;line-height:1.6">
        La historia fue anclada en <strong>${placeName}</strong>
        y forma parte del archivo de historias humanas de Precisar.
      </p>

      <!-- Botón -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto">
        <tr>
          <td style="background:#FF4A1C;border-radius:100px;
            padding:14px 32px">
            <a href="${historiasUrl}"
              style="color:white;text-decoration:none;
              font-size:13px;font-weight:700;
              letter-spacing:0.1em;text-transform:uppercase">
              VER MI HISTORIA EN EL MAPA
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:24px 40px;text-align:center;
      border-top:1px solid rgba(255,255,255,0.6)">
      <p style="margin:0;font-size:13px;color:#9299a8">
        El equipo de AlmaMundi · Precisar
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#9299a8">
        <a href="https://www.almamundi.org/privacidad"
          style="color:#9299a8">Política de privacidad</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendPublicationEmail(
  params: SendPublicationEmailParams
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    return false;
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? 'AlmaMundi <hola@almamundi.org>';
  const subject = 'Tu historia ya está en AlmaMundi';

  try {
    await resend.emails.send({
      from,
      to: params.authorEmail,
      subject,
      html: buildPublicationEmailHtml(params),
    });
    return true;
  } catch (err) {
    console.error('sendPublicationEmail', err);
    return false;
  }
}
