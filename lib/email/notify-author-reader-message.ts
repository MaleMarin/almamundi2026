/**
 * Tras guardar un mensaje de quien lee, reenviar el texto al correo del autor
 * si existe. Misma resolución de email que el aviso de publicación.
 * Sin correo del autor no es error: el mensaje queda guardado y no se intenta aviso.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { isValidRecipientEmail } from '@/lib/email-html';
import { resolveAuthorEmailFromRecord } from '@/lib/email/notify-author-published';
import { readAuthorContactEmail } from '@/lib/author-contacts';
import { sendReaderMessageEmail } from '@/lib/email/send-reader-message-email';

export type ReaderMessageMailStatus = 'sent' | 'skipped_no_email' | 'failed';

export type ReaderMessageMailRecord = {
  status: ReaderMessageMailStatus;
  error: string | null;
  resendId: string | null;
};

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

async function lookupEmailFromSubmissions(
  db: Firestore,
  storyId: string,
  data: Record<string, unknown>
): Promise<string | null> {
  const sourceId =
    typeof data.sourceSubmissionId === 'string' && data.sourceSubmissionId.trim()
      ? data.sourceSubmissionId.trim()
      : storyId;
  for (const col of ['story_submissions', 'submissions'] as const) {
    for (const id of Array.from(new Set([sourceId, storyId]))) {
      const snap = await db.collection(col).doc(id).get();
      if (!snap.exists) continue;
      const d = snap.data() as Record<string, unknown>;
      const found = pickValidEmail(d.authorEmail, d.email, d.autorEmail);
      if (found) return found;
    }
  }
  return null;
}

export async function notifyAuthorReaderMessage(args: {
  db: Firestore;
  storyId: string;
  readerMessage: string;
}): Promise<ReaderMessageMailRecord> {
  const { db, storyId, readerMessage } = args;
  const ref = db.collection('stories').doc(storyId);
  const snap = await ref.get();
  const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;

  const contact = await readAuthorContactEmail(db, storyId);
  const to =
    (contact && isValidRecipientEmail(contact) ? contact : null) ??
    resolveAuthorEmailFromRecord(data) ??
    (await lookupEmailFromSubmissions(db, storyId, data));

  if (!to) {
    return {
      status: 'skipped_no_email',
      error: null,
      resendId: null,
    };
  }

  const autor = asRecord(data.autor);
  const sent = await sendReaderMessageEmail({
    authorName: pickText(data.authorName, data.alias, autor?.nombre),
    authorEmail: to,
    storyTitle: pickText(data.title, data.titulo, 'tu historia'),
    readerMessage,
  });

  if (sent.ok) {
    return {
      status: 'sent',
      error: null,
      resendId: sent.emailId ?? null,
    };
  }

  return {
    status: 'failed',
    error: sent.error,
    resendId: null,
  };
}
