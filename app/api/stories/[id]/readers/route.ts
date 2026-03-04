import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const readerId = req.headers.get('x-reader-id') ?? `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const db = getAdminDb();
    const ref = db.collection('stories').doc(id).collection('readers').doc(readerId);

    await ref.set({
      updatedAt: FieldValue.serverTimestamp(),
      expireAt: new Date(Date.now() + 30_000),
    });

    const thirtySecAgo = new Date(Date.now() - 30_000);
    const snap = await db
      .collection('stories')
      .doc(id)
      .collection('readers')
      .where('updatedAt', '>=', thirtySecAgo)
      .count()
      .get();

    const count = snap.data().count ?? 0;
    return NextResponse.json({ count, readerId });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const readerId = req.headers.get('x-reader-id');
    if (readerId) {
      const db = getAdminDb();
      await db.collection('stories').doc(id).collection('readers').doc(readerId).delete();
    }
  } catch {}
  return NextResponse.json({ ok: true });
}
