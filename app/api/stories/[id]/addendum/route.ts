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
    const body = (await req.json()) as { text?: string };
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > 200) {
      return NextResponse.json({ error: 'Texto inválido.' }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection('stories').doc(id).collection('addendums').add({
      text,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[addendum]', err);
    return NextResponse.json({ error: 'Error.' }, { status: 500 });
  }
}
