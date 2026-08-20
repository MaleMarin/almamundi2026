import "server-only";
import { escapeHtml } from "@/lib/email-html";
import { getResend } from "@/lib/emailSubmission";
import {
  monthProgressCopy,
  projectionCopy,
  USAGE_ALERT_TO,
  type UsageAlert,
  type UsageSnapshot,
} from "@/lib/ops/usage-alerts";
import { noteEmailSent } from "@/lib/ops/usage-state";

function mailFromAddress(): string {
  const raw = (
    process.env.RESEND_FROM_EMAIL ??
    process.env.MAIL_FROM ??
    "AlmaMundi <hola@almamundi.org>"
  ).trim();
  if (!raw) return "AlmaMundi <hola@almamundi.org>";
  return raw.includes("<") ? raw : `AlmaMundi <${raw}>`;
}

function extraContext(alert: UsageAlert, snap: UsageSnapshot): string {
  if (alert.key.includes(":storage:")) {
    if (snap.storageBytes == null) return "";
    return projectionCopy(snap, snap.storageBytes / 1e9, "GB");
  }
  if (alert.key.includes(":egress:")) {
    if (snap.egressBytes == null) return "";
    return projectionCopy(snap, snap.egressBytes / 1e9, "GB de tráfico");
  }
  if (alert.key.includes(":cost:")) {
    if (snap.estimatedUsd == null) return "";
    return projectionCopy(snap, snap.estimatedUsd, "dólares (solo Storage)");
  }
  if (alert.key.includes("resend")) {
    return projectionCopy(snap, snap.emailsSent, "correos");
  }
  return "";
}

export function buildUsageAlertHtml(
  alert: UsageAlert,
  snap: UsageSnapshot
): string {
  const extra = extraContext(alert, snap);
  const egressLine =
    snap.egressBytes == null &&
    (alert.key.includes(":egress:") || alert.key.includes(":cost:"))
      ? "<p>El tráfico de salida no se pudo leer desde Google Monitoring. Las alertas de presupuesto de Google Cloud cubren esa parte en dólares.</p>"
      : "";
  const storageNote =
    snap.storageBytesSource === "listing" && alert.key.includes(":storage:")
      ? "<p>El tamaño se calculó listando el bucket (Monitoring no respondió). Puede tardar un poco en días con muchos archivos.</p>"
      : "";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;color:#111">
  <div style="max-width:560px;margin:32px auto;padding:32px 28px;background:#fff;border-radius:16px">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#FF4A1C">AlmaMundi · aviso de uso</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:600;line-height:1.3">${escapeHtml(alert.subject.replace("AlmaMundi — ", ""))}</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55">${escapeHtml(alert.what)}</p>
    <p style="margin:0 0 8px;font-size:16px"><strong>Usado ahora:</strong> ${escapeHtml(alert.usedLabel)}</p>
    <p style="margin:0 0 16px;font-size:16px"><strong>Límite de este aviso:</strong> ${escapeHtml(alert.limitLabel)}</p>
    <p style="margin:0 0 8px;font-size:16px">${escapeHtml(monthProgressCopy(snap))}</p>
    ${extra ? `<p style="margin:0 0 16px;font-size:16px">${escapeHtml(extra)}</p>` : ""}
    ${egressLine}
    ${storageNote}
    <p style="margin:20px 0 8px;font-size:16px"><strong>Qué conviene hacer</strong></p>
    <p style="margin:0;font-size:16px;line-height:1.55">${escapeHtml(alert.advice)}</p>
  </div>
</body>
</html>`;
}

export async function sendUsageAlertEmail(
  alert: UsageAlert,
  snap: UsageSnapshot
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.error("[usage] Resend no configurado; no se envió", alert.key);
    return false;
  }
  try {
    const sent = await resend.emails.send({
      from: mailFromAddress(),
      to: USAGE_ALERT_TO,
      subject: alert.subject,
      html: buildUsageAlertHtml(alert, snap),
    });
    if (sent.error) {
      console.error("[usage] send", sent.error);
      return false;
    }
    await noteEmailSent();
    return true;
  } catch (e) {
    console.error("[usage] sendUsageAlertEmail", e);
    return false;
  }
}
