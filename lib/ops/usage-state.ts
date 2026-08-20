import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

const RUNTIME_DOC = "ops/runtime";
const ALERT_STATE_DOC = "ops/alertState";

export function utcMonthKey(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthDocPath(monthKey: string): string {
  return `ops/month-${monthKey}`;
}

export async function noteEmailSent(): Promise<void> {
  try {
    const db = getAdminDb();
    await db.doc(monthDocPath(utcMonthKey())).set(
      {
        emailsSent: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.error("[usage] noteEmailSent", e);
  }
}

export async function noteBytesUploaded(bytes: number): Promise<void> {
  if (!Number.isFinite(bytes) || bytes <= 0) return;
  try {
    const db = getAdminDb();
    await db.doc(monthDocPath(utcMonthKey())).set(
      {
        bytesUploaded: FieldValue.increment(Math.round(bytes)),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.error("[usage] noteBytesUploaded", e);
  }
}

export async function readMonthEmailCount(monthKey: string): Promise<number> {
  const snap = await getAdminDb().doc(monthDocPath(monthKey)).get();
  const n = snap.data()?.emailsSent;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export async function areUploadsPaused(): Promise<boolean> {
  const snap = await getAdminDb().doc(RUNTIME_DOC).get();
  return snap.data()?.uploadsPaused === true;
}

export async function setUploadsPaused(paused: boolean, reason: string): Promise<void> {
  await getAdminDb().doc(RUNTIME_DOC).set(
    {
      uploadsPaused: paused,
      uploadsPausedReason: reason,
      uploadsPausedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function wasAlertFired(key: string): Promise<boolean> {
  const snap = await getAdminDb().doc(ALERT_STATE_DOC).get();
  const fired = snap.data()?.fired;
  return Boolean(fired && typeof fired === "object" && (fired as Record<string, unknown>)[key]);
}

export async function markAlertFired(key: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.doc(ALERT_STATE_DOC);
  const iso = new Date().toISOString();
  try {
    await ref.update({
      [`fired.${key}`]: iso,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch {
    await ref.set(
      {
        fired: { [key]: iso },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}
