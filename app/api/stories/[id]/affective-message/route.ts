import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { checkAffectiveTone } from '@/lib/affective-tone-check';

export const runtime = 'nodejs';

const MAX_LEN = 2000;
const MIN_LEN = 3;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Falta id de historia.' }, { status: 400 });
    }

    const body = (await req.json()) as { message?: string };
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
    const storySnap = await storyRef.get();
    if (!storySnap.exists) {
      return NextResponse.json({ error: 'Historia no encontrada.' }, { status: 404 });
    }

    await storyRef.collection('affective_messages').add({
      text: message,
      createdAt: FieldValue.serverTimestamp(),
      source: 'exhibition',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[affective-message]', err);
    return NextResponse.json({ error: 'No se pudo enviar el mensaje.' }, { status: 500 });
  }
}
