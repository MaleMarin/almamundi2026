/**
 * Un solo camino: al publicar una historia, avisar al autor y dejar el resultado en el documento.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { isValidRecipientEmail } from '@/lib/email-html';
import { sendPublicationEmail } from '@/lib/email/send-publication-email';

export type PublicationMailStatus = 'sent' | 'skipped_no_email' | 'failed';

export type PublicationMailRecord = {
  status: PublicationMailStatus;
  to: string | null;
  error: string | null;
  at: string;
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

export function resolveAuthorEmailFromRecord(data: Record<string, unknown>): string | null {
  const autor = asRecord(data.autor);
  return pickValidEmail(data.authorEmail, data.email, data.autorEmail, autor?.email);
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

export async function notifyAuthorStoryPublished(args: {
  db: Firestore;
  storyId: string;
}): Promise<PublicationMailRecord> {
  const { db, storyId } = args;
  const ref = db.collection('stories').doc(storyId);
  const snap = await ref.get();
  const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
  const at = new Date().toISOString();

  const to =
    resolveAuthorEmailFromRecord(data) ?? (await lookupEmailFromSubmissions(db, storyId, data));

  const persist = async (rec: PublicationMailRecord) => {
    if (!snap.exists) return rec;
    const extra: Record<string, unknown> = { publicationMail: rec };
    if (rec.to && !data.authorEmail) extra.authorEmail = rec.to;
    await ref.update(extra);
    return rec;
  };

  if (!to) {
    return persist({
      status: 'skipped_no_email',
      to: null,
      error: 'La historia no tiene un correo válido del autor',
      at,
      resendId: null,
    });
  }

  const autor = asRecord(data.autor);
  const ubic = asRecord(data.ubicacion);
  const sent = await sendPublicationEmail({
    authorName: pickText(data.authorName, data.alias, autor?.nombre, 'Autor'),
    authorEmail: to,
    storyTitle: pickText(data.title, data.titulo, 'Tu historia'),
    storyId,
    placeName: pickText(
      data.placeLabel,
      data.place,
      data.city,
      typeof ubic?.nombre === 'string' ? ubic.nombre : '',
      typeof ubic?.label === 'string' ? ubic.label : '',
      typeof ubic?.ciudad === 'string' ? ubic.ciudad : '',
      'el mundo'
    ),
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
