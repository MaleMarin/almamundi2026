import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { isPublicStoryDocumentStatus } from '@/lib/story-public';
import {
  assertSafeStoryId,
  savePublishedMediaObject,
} from '@/lib/server-storage';
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

const MAX_ECO_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter('story-eco', 20, 3600);
  const blocked = await enforceRateLimit(rl, `eco:${ip}`, {
    max: 20,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  try {
    const form = await req.formData();
    const audio = form.get('audio') as File | null;
    const storyIdRaw = form.get('storyId') as string | null;

    if (!audio || !storyIdRaw) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    }

    let storyId: string;
    try {
      storyId = assertSafeStoryId(storyIdRaw);
    } catch {
      return NextResponse.json({ error: 'Historia no válida.' }, { status: 400 });
    }

    if (audio.size <= 0 || audio.size > MAX_ECO_BYTES) {
      return NextResponse.json({ error: 'Audio demasiado grande.' }, { status: 413 });
    }

    const db = getAdminDb();
    const storySnap = await db.collection('stories').doc(storyId).get();
    const storyData = storySnap.data() as Record<string, unknown> | undefined;
    if (!storySnap.exists || !isPublicStoryDocumentStatus(storyData?.status)) {
      return NextResponse.json({ error: 'Historia no encontrada.' }, { status: 404 });
    }

    const ecoId = `eco_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const destPath = `published/ecos/${storyId}/${ecoId}.webm`;
    const { publicUrl } = await savePublishedMediaObject({
      destPath,
      buffer: Buffer.from(await audio.arrayBuffer()),
      contentType: 'audio/webm',
    });

    await db.collection('stories').doc(storyId).collection('ecos').doc(ecoId).set({
      audioUrl: publicUrl,
      storagePath: destPath,
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
