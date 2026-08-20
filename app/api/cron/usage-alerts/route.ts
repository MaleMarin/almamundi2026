import { NextResponse } from "next/server";
import { sendUsageAlertEmail } from "@/lib/email/send-usage-alert-email";
import { unauthorizedCronResponse } from "@/lib/ops/cron-auth";
import {
  alertsForSnapshot,
  collectUsageSnapshot,
  pauseUploadsIfNeeded,
} from "@/lib/ops/usage-alerts";
import { markAlertFired, wasAlertFired } from "@/lib/ops/usage-state";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = unauthorizedCronResponse(req);
  if (denied) return denied;

  try {
    const snap = await collectUsageSnapshot();
    const alerts = alertsForSnapshot(snap);
    const pauseAlert = await pauseUploadsIfNeeded(snap);
    if (pauseAlert) alerts.push(pauseAlert);

    const sent: string[] = [];
    const skipped: string[] = [];
    for (const alert of alerts) {
      if (await wasAlertFired(alert.key)) {
        skipped.push(alert.key);
        continue;
      }
      const ok = await sendUsageAlertEmail(alert, snap);
      if (ok) {
        await markAlertFired(alert.key);
        sent.push(alert.key);
      }
    }

    return NextResponse.json({
      ok: true,
      monthKey: snap.monthKey,
      storageBytes: snap.storageBytes,
      storageBytesSource: snap.storageBytesSource,
      egressBytes: snap.egressBytes,
      emailsSent: snap.emailsSent,
      estimatedUsd: snap.estimatedUsd,
      uploadsPaused: snap.uploadsPaused || Boolean(pauseAlert),
      sent,
      skipped,
    });
  } catch (e) {
    console.error("[cron/usage-alerts]", e);
    return NextResponse.json({ error: "usage_alerts_failed" }, { status: 500 });
  }
}
