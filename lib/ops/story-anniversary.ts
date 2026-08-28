import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import { resolveAuthorEmailForStoryDoc } from "@/lib/email/notify-author-rejected";
import { resolveAuthorNameFromSubmission } from "@/lib/email/notify-author-received";
import { sendAnniversaryEmail } from "@/lib/email/send-anniversary-email";
import { isBetaDemoStatus } from "@/lib/editorial/status";
import { markAlertFired, wasAlertFired } from "@/lib/ops/usage-state";

const ELIGIBLE_STATUSES = new Set([
  "approved",
  "featured",
  "published",
  "active",
  "archived",
]);

const STORY_SCAN_LIMIT = 1000;

export function anniversaryFiredKey(storyId: string, utcYear: number): string {
  return `anniversary:${storyId}:${utcYear}`;
}

export function publishedAtToDate(raw: unknown): Date | null {
  if (!raw) return null;
  if (typeof (raw as { toDate?: () => Date }).toDate === "function") {
    const d = (raw as { toDate: () => Date }).toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "string" && raw.trim()) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  return null;
}

/** Mismo día y mes UTC, y al menos un año de diferencia (el año de publicación es anterior). */
export function isUtcAnniversaryToday(published: Date, now = new Date()): boolean {
  if (published.getUTCFullYear() >= now.getUTCFullYear()) return false;
  return (
    published.getUTCMonth() === now.getUTCMonth() && published.getUTCDate() === now.getUTCDate()
  );
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickText(...cands: unknown[]): string {
  for (const c of cands) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

export type AnniversaryCronResult = {
  ok: true;
  utcDay: string;
  scanned: number;
  matched: number;
  sent: string[];
  skippedFired: string[];
  skippedNoEmail: string[];
  skippedNoDate: number;
  failed: string[];
};

export async function runStoryAnniversaryCron(now = new Date()): Promise<AnniversaryCronResult> {
  const db = getAdminDb();
  const utcYear = now.getUTCFullYear();
  const utcDay = now.toISOString().slice(0, 10);
  const snap = await db.collection("stories").limit(STORY_SCAN_LIMIT).get();

  const sent: string[] = [];
  const skippedFired: string[] = [];
  const skippedNoEmail: string[] = [];
  const failed: string[] = [];
  let skippedNoDate = 0;
  let matched = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    if (!ELIGIBLE_STATUSES.has(String(data.status ?? ""))) continue;
    if (isBetaDemoStatus(data.status) || data.isDemo === true) continue;

    const published = publishedAtToDate(data.publishedAt);
    if (!published) {
      skippedNoDate += 1;
      continue;
    }
    if (!isUtcAnniversaryToday(published, now)) continue;

    matched += 1;
    const key = anniversaryFiredKey(doc.id, utcYear);
    if (await wasAlertFired(key)) {
      skippedFired.push(doc.id);
      continue;
    }

    const to = await resolveAuthorEmailForStoryDoc(db, doc.id, data);
    if (!to) {
      skippedNoEmail.push(doc.id);
      continue;
    }

    const autor = asRecord(data.autor);
    const sentMail = await sendAnniversaryEmail({
      authorName: pickText(
        resolveAuthorNameFromSubmission(data),
        data.authorName,
        data.alias,
        data.nombre,
        autor?.nombre
      ),
      authorEmail: to,
      storyTitle: pickText(data.title, data.titulo, data.storyTitle, "tu historia"),
      storyId: doc.id,
    });

    if (sentMail.ok) {
      await markAlertFired(key);
      sent.push(doc.id);
    } else {
      failed.push(doc.id);
      console.error("[story-anniversary] send failed", doc.id, sentMail.error);
    }
  }

  return {
    ok: true,
    utcDay,
    scanned: snap.size,
    matched,
    sent,
    skippedFired,
    skippedNoEmail,
    skippedNoDate,
    failed,
  };
}
