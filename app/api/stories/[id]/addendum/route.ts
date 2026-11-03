import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { clientIpFromRequest, enforceRateLimit, getRateLimiter } from '@/lib/rate-limit';
import { assertSafeStoryId } from '@/lib/server-storage';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Límite por IP y solo historias que existen: evita que se llene la base con escrituras falsas.
  const ip = clientIpFromRequest(req);
  const blocked = await enforceRateLimit(getRateLimiter('story-addendum', 5, 3600), `story-addendum:${ip}`, {
    max: 5,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;
  try {
    const { id: rawId } = await params;
    let id = '';
    try {
      id = assertSafeStoryId(rawId);
    } catch {
      return NextResponse.json({ error: 'Historia no válida.' }, { status: 400 });
    }
    const existe = await getAdminDb().collection('stories').doc(id).get();
    if (!existe.exists) return NextResponse.json({ error: 'Historia no encontrada.' }, { status: 404 });
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
