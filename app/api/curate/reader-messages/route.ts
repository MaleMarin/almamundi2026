import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminDb } from '@/lib/firebase/admin';
import { notifyAuthorReaderMessage } from '@/lib/email/notify-author-reader-message';

export const runtime = 'nodejs';

function createdAtIso(raw: unknown): string | null {
  if (raw && typeof (raw as { toDate?: () => Date }).toDate === 'function') {
    try {
      return (raw as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof raw === 'string' && raw.trim()) {
    const t = Date.parse(raw);
    return Number.isFinite(t) ? new Date(t).toISOString() : null;
  }
  return null;
}

function createdMs(iso: string | null): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function pickText(...cands: unknown[]): string {
  for (const c of cands) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

async function listPendingDocs() {
  const db = getAdminDb();
  try {
    const snap = await db.collectionGroup('affective_messages').where('status', '==', 'pending').get();
    return snap.docs;
  } catch {
    const stories = await db.collection('stories').limit(200).get();
    const docs: QueryDocumentSnapshot[] = [];
    for (const story of stories.docs) {
      const msgs = await story.ref.collection('affective_messages').where('status', '==', 'pending').get();
      docs.push(...msgs.docs);
    }
    return docs;
  }
}

/** GET /api/curate/reader-messages — mensajes de lectores pendientes de revisión. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const db = getAdminDb();
    const docs = await listPendingDocs();
    const storyIds = Array.from(
      new Set(
        docs
          .map((d) => d.ref.parent.parent?.id)
          .filter((id): id is string => Boolean(id))
      )
    );
    const titles = new Map<string, string>();
    await Promise.all(
      storyIds.map(async (id) => {
        const snap = await db.collection('stories').doc(id).get();
        const data = (snap.data() ?? {}) as Record<string, unknown>;
        titles.set(id, pickText(data.title, data.titulo, 'Sin título'));
      })
    );

    const messages = docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        const storyId = d.ref.parent.parent?.id ?? '';
        const createdAt = createdAtIso(data.createdAt);
        return {
          storyId,
          messageId: d.id,
          storyTitle: titles.get(storyId) || 'Sin título',
          text: pickText(data.text, data.message),
          createdAt,
          _ms: createdMs(createdAt),
        };
      })
      .sort((a, b) => b._ms - a._ms)
      .map(({ _ms, ...row }) => row);

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[curate/reader-messages] list', err);
    return NextResponse.json({ error: 'No se pudieron listar los mensajes.' }, { status: 500 });
  }
}

/** POST /api/curate/reader-messages — aprobar (y enviar correo) o rechazar. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json()) as {
      storyId?: string;
      messageId?: string;
      action?: string;
    };
    const storyId = typeof body.storyId === 'string' ? body.storyId.trim() : '';
    const messageId = typeof body.messageId === 'string' ? body.messageId.trim() : '';
    const action = body.action === 'approve' || body.action === 'reject' ? body.action : null;

    if (!storyId || !messageId || !action) {
      return NextResponse.json(
        { error: 'storyId, messageId y action (approve|reject) son requeridos.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const msgRef = db.collection('stories').doc(storyId).collection('affective_messages').doc(messageId);
    const snap = await msgRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Mensaje no encontrado.' }, { status: 404 });
    }

    const data = (snap.data() ?? {}) as Record<string, unknown>;
    if (data.status !== 'pending') {
      return NextResponse.json({ error: 'Este mensaje ya no está pendiente.' }, { status: 409 });
    }

    const text = pickText(data.text, data.message);
    if (action === 'reject') {
      await msgRef.update({
        status: 'rejected',
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: auth.email,
      });
      return NextResponse.json({ ok: true, action: 'reject' });
    }

    await msgRef.update({
      status: 'approved',
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: auth.email,
    });

    const mail = await notifyAuthorReaderMessage({
      db,
      storyId,
      readerMessage: text,
    });
    console.info('[curate/reader-messages] author-mail', {
      storyId,
      messageId,
      status: mail.status,
      hasResendId: Boolean(mail.resendId),
    });
    if (mail.status === 'failed') {
      console.error('[curate/reader-messages] author-mail-failed', mail.error);
    }

    return NextResponse.json({ ok: true, action: 'approve', authorMail: mail });
  } catch (err) {
    console.error('[curate/reader-messages] action', err);
    return NextResponse.json({ error: 'No se pudo actualizar el mensaje.' }, { status: 500 });
  }
}
