import type { Firestore } from "firebase-admin/firestore";
import type { EditorialModerationAction } from "@/lib/editorial/transitions";

export type EditorialAuditEventType =
  | EditorialModerationAction
  /** alias explícitos para logs legibles */
  | "approve_from_submission"
  | "reject_moderation"
  | "publish_spanish_inplace";

export type EditorialAuditPayload = {
  storyId?: string;
  submissionId?: string;
  submissionCollection?: "story_submissions" | "submissions";
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  extras?: Record<string, unknown>;
};

const COLLECTION = "editorial_audit_log";

/** Log append-only best-effort; no debe romper la transacción editorial si Firestore falla al auditar. */
export async function appendEditorialAuditLog(
  db: Firestore,
  actorEmail: string,
  event: EditorialAuditEventType,
  payload: EditorialAuditPayload
): Promise<void> {
  try {
    await db.collection(COLLECTION).add({
      actorEmail,
      event,
      ...payload,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[editorial_audit_log]", event, e);
  }
}
