import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { checkAffectiveTone } from '@/lib/affective-tone-check';
import { foldEcoVad, meanVadFromText, parseEcoVadState } from '@/lib/huella/eco-vad';
import { getRateLimiter } from '@/lib/rate-limit';
import { verifyTurnstileStrict } from '@/lib/security/turnstile-strict';
import {
  MSG_LIMIT,
  MSG_UPSTASH,
  MSG_VERIFY,
  clientIpFromHeaders,
  isProductionVercel,
  isUpstashConfigured,
} from '@/lib/security/validate-data-request';

export const runtime = 'nodejs';

const MAX_LEN = 2000;
const MIN_LEN = 3;

async function enforceAffectiveIpLimits(ip: string): Promise<NextResponse | null> {
  if (!isUpstashConfigured()) {
    if (isProductionVercel()) {
      return NextResponse.json({ error: MSG_UPSTASH }, { status: 503 });
    }
    return null;
  }
  const hour = getRateLimiter('affective-ip-hour', 3, 3600);
  const day = getRateLimiter('affective-ip-day', 6, 86400);
  if (!hour || !day) {
    if (isProductionVercel()) {
      return NextResponse.json({ error: MSG_UPSTASH }, { status: 503 });
    }
    return null;
  }
  const id = `ip:${ip}`;
  const h = await hour.limit(id);
  if (!h.success) return NextResponse.json({ error: MSG_LIMIT }, { status: 429 });
  const d = await day.limit(id);
  if (!d.success) return NextResponse.json({ error: MSG_LIMIT }, { status: 429 });
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const ipBlock = await enforceAffectiveIpLimits(ip);
    if (ipBlock) return ipBlock;

    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Falta id de historia.' }, { status: 400 });
    }

    const body = (await req.json()) as { message?: string; turnstileToken?: string };
    const turnstile = await verifyTurnstileStrict(
      typeof body.turnstileToken === 'string' ? body.turnstileToken : '',
      ip
    );
    if (!turnstile.ok) {
      return NextResponse.json({ error: MSG_VERIFY }, { status: 400 });
    }
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (message.length < MIN_LEN) {
      return NextResponse.json(
        { error: 'El mensaje es demasiado corto.', reformulate: false },
        { status: 400 }
      );
    }
    if (message.length > MAX_LEN) {
      return NextResponse.json(
        { error: `Máximo ${MAX_LEN} caracteres.`, reformulate: false },
        { status: 400 }
      );
    }

    const tone = await checkAffectiveTone(message);
    if (!tone.allowed) {
      return NextResponse.json(
        {
          ok: false,
          reformulate: true,
          hint: tone.suggestion,
        },
        { status: 422 }
      );
    }

    const db = getAdminDb();
    const storyRef = db.collection('stories').doc(id);
    const messageVad = meanVadFromText(message, 'es');

    await db.runTransaction(async (tx) => {
      const storySnap = await tx.get(storyRef);
      if (!storySnap.exists) {
        throw new Error('story_not_found');
      }
      const msgRef = storyRef.collection('affective_messages').doc();
      tx.set(msgRef, {
        text: message,
        createdAt: FieldValue.serverTimestamp(),
        source: 'exhibition',
        status: 'pending',
      });
      if (messageVad) {
        const prev = parseEcoVadState(storySnap.data()?.ecoVad);
        tx.update(storyRef, { ecoVad: foldEcoVad(prev, messageVad) });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[affective-message]', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'story_not_found') {
      return NextResponse.json({ error: 'Historia no encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'No se pudo enviar el mensaje.' }, { status: 500 });
  }
}
