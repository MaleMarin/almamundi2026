/**
 * Un solo camino: al recibir un envío, avisar al autor y dejar el resultado en el documento.
 * Si no hay correo válido, no envía y no lanza error.
 */
import type { DocumentSnapshot, Firestore } from 'firebase-admin/firestore';
import { isValidRecipientEmail } from '@/lib/email-html';
import { sendReceivedEmail } from '@/lib/email/send-received-email';

export type ReceivedMailStatus = 'sent' | 'skipped_no_email' | 'failed';

export type ReceivedMailRecord = {
  status: ReceivedMailStatus;
  to: string | null;
  error: string | null;
  at: string;
  resendId: string | null;
};

export const RECEIVED_MAIL_COLLECTIONS = ['submissions', 'story_submissions'] as const;
export type ReceivedMailCollection = (typeof RECEIVED_MAIL_COLLECTIONS)[number];

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickValidEmail(...cands: unknown[]): string | null {
  for (const c of cands) {
    if (typeof c === 'string' && isValidRecipientEmail(c)) return c.trim();
  }
  return null;
}

function pickText(...cands: unknown[]): string {
  for (const c of cands) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

export function resolveAuthorEmailFromSubmission(data: Record<string, unknown>): string | null {
  const autor = asRecord(data.autor);
  return pickValidEmail(data.email, data.authorEmail, data.autorEmail, autor?.email);
}

export function resolveAuthorNameFromSubmission(data: Record<string, unknown>): string {
  const autor = asRecord(data.autor);
  return pickText(data.alias, data.authorName, data.nombre, autor?.nombre, autor?.alias);
}

export async function notifyAuthorStoryReceived(args: {
  db: Firestore;
  collection: ReceivedMailCollection;
  submissionId: string;
}): Promise<ReceivedMailRecord> {
  const { db, collection, submissionId } = args;
  const ref = db.collection(collection).doc(submissionId);
  const at = new Date().toISOString();

  let snap: DocumentSnapshot;
  try {
    snap = await ref.get();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No se pudo leer el envío';
    console.error('notifyAuthorStoryReceived get', err);
    return {
      status: 'failed',
      to: null,
      error: msg,
      at,
      resendId: null,
    };
  }

  const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;

  const persist = async (rec: ReceivedMailRecord) => {
    if (!snap.exists) return rec;
    try {
      await ref.update({ receivedMail: rec });
    } catch (err) {
      console.error('notifyAuthorStoryReceived persist', err);
    }
    return rec;
  };

  const to = resolveAuthorEmailFromSubmission(data);
  if (!to) {
    return persist({
      status: 'skipped_no_email',
      to: null,
      error: null,
      at,
      resendId: null,
    });
  }

  const sent = await sendReceivedEmail({
    authorName: resolveAuthorNameFromSubmission(data),
    authorEmail: to,
  });

  if (sent.ok) {
    return persist({
      status: 'sent',
      to,
      error: null,
      at,
      resendId: sent.emailId ?? null,
    });
  }

  return persist({
    status: 'failed',
    to,
    error: sent.error,
    at,
    resendId: null,
  });
}
