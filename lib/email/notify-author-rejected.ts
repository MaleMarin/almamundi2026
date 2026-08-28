/**
 * Avisar al autor cuando su envío no se publica. No lanza si Resend falla.
 */
import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { isValidRecipientEmail } from "@/lib/email-html";
import { sendRejectionEmail } from "@/lib/email/send-rejection-email";
import {
  resolveAuthorEmailFromSubmission,
  resolveAuthorNameFromSubmission,
} from "@/lib/email/notify-author-received";
import { resolveAuthorEmailFromRecord } from "@/lib/email/notify-author-published";

export type RejectionMailStatus = "sent" | "skipped_no_email" | "failed";

export type RejectionMailRecord = {
  status: RejectionMailStatus;
  to: string | null;
  error: string | null;
  at: string;
  resendId: string | null;
};

export const REJECTION_MAIL_COLLECTIONS = ["submissions", "story_submissions", "stories"] as const;
export type RejectionMailCollection = (typeof REJECTION_MAIL_COLLECTIONS)[number];

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickText(...cands: unknown[]): string {
  for (const c of cands) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

function pickValidEmail(...cands: unknown[]): string | null {
  for (const c of cands) {
    if (typeof c === "string" && isValidRecipientEmail(c)) return c.trim();
  }
  return null;
}

async function lookupEmailFromLinkedDocs(
  db: Firestore,
  docId: string,
  data: Record<string, unknown>
): Promise<string | null> {
  const sourceId =
    typeof data.sourceSubmissionId === "string" && data.sourceSubmissionId.trim()
      ? data.sourceSubmissionId.trim()
      : docId;
  for (const col of ["submissions", "story_submissions"] as const) {
    for (const id of Array.from(new Set([sourceId, docId]))) {
      const snap = await db.collection(col).doc(id).get();
      if (!snap.exists) continue;
      const d = snap.data() as Record<string, unknown>;
      const found = pickValidEmail(d.email, d.authorEmail, d.autorEmail, asRecord(d.autor)?.email);
      if (found) return found;
    }
  }
  return null;
}

/** Misma búsqueda que el aviso de rechazo: documento, autor anidado y envío vinculado. */
export async function resolveAuthorEmailForStoryDoc(
  db: Firestore,
  docId: string,
  data: Record<string, unknown>
): Promise<string | null> {
  return (
    resolveAuthorEmailFromSubmission(data) ??
    resolveAuthorEmailFromRecord(data) ??
    (await lookupEmailFromLinkedDocs(db, docId, data))
  );
}

export async function notifyAuthorStoryRejected(args: {
  db: Firestore;
  collection: RejectionMailCollection;
  docId: string;
  publicReason: string;
}): Promise<RejectionMailRecord> {
  const { db, collection, docId, publicReason } = args;
  const ref = db.collection(collection).doc(docId);
  const at = new Date().toISOString();

  let snap: DocumentSnapshot;
  try {
    snap = await ref.get();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "No se pudo leer el envío";
    console.error("notifyAuthorStoryRejected get", err);
    return { status: "failed", to: null, error: msg, at, resendId: null };
  }

  const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;

  const persist = async (rec: RejectionMailRecord) => {
    if (!snap.exists) return rec;
    try {
      await ref.update({ rejectionMail: rec });
    } catch (err) {
      console.error("notifyAuthorStoryRejected persist", err);
    }
    return rec;
  };

  const to =
    (await resolveAuthorEmailForStoryDoc(db, docId, data));

  if (!to) {
    return persist({
      status: "skipped_no_email",
      to: null,
      error: null,
      at,
      resendId: null,
    });
  }

  const autor = asRecord(data.autor);
  const sent = await sendRejectionEmail({
    authorName: pickText(
      resolveAuthorNameFromSubmission(data),
      data.authorName,
      data.alias,
      data.nombre,
      autor?.nombre
    ),
    authorEmail: to,
    storyTitle: pickText(data.storyTitle, data.title, data.titulo, "tu historia"),
    publicReason,
  });

  if (sent.ok) {
    return persist({
      status: "sent",
      to,
      error: null,
      at,
      resendId: sent.emailId ?? null,
    });
  }

  return persist({
    status: "failed",
    to,
    error: sent.error,
    at,
    resendId: null,
  });
}
