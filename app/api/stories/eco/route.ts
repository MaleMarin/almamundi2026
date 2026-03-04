import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get('audio') as File | null;
    const storyId = form.get('storyId') as string | null;

    if (!audio || !storyId) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    }

    const ecoId = `eco_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const path = `ecos/${storyId}/${ecoId}.webm`;
    const bucket = getAdminStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? undefined);
    const file = bucket.file(path);

    await file.save(Buffer.from(await audio.arrayBuffer()), {
      metadata: { contentType: 'audio/webm' },
    });

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    const db = getAdminDb();
    await db.collection('stories').doc(storyId).collection('ecos').doc(ecoId).set({
      audioUrl: url,
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection('stories').doc(storyId).update({
      ecosCount: FieldValue.increment(1),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/stories/eco]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
