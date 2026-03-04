/**
 * POST /api/pulse — Registra una "huella" anónima cuando alguien termina de leer.
 * GET  /api/pulse — Retorna las huellas de los últimos 5 minutos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      lat?: number;
      lng?: number;
      storyId?: string;
    };

    if (
      typeof body.lat !== 'number' ||
      typeof body.lng !== 'number' ||
      !body.storyId
    ) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    const lat = Math.round(body.lat * 10) / 10;
    const lng = Math.round(body.lng * 10) / 10;

    const db = getAdminDb();
    await db.collection('pulses').add({
      lat,
      lng,
      storyId: body.storyId,
      createdAt: FieldValue.serverTimestamp(),
      expireAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/pulse]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const storyId = new URL(req.url ?? '', 'http://localhost').searchParams.get('storyId');

    if (storyId) {
      const snap = await db
        .collection('pulses')
        .where('storyId', '==', storyId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const pulses = snap.docs.map((doc) => {
        const d = doc.data();
        return { id: doc.id, lat: d.lat, lng: d.lng, storyId: d.storyId };
      });
      return NextResponse.json({ pulses });
    }

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const snap = await db
      .collection('pulses')
      .where('createdAt', '>=', fiveMinAgo)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const pulses = snap.docs.map((doc) => {
      const d = doc.data();
      const createdAt = d.createdAt && typeof (d.createdAt as { toDate?: () => Date }).toDate === 'function'
        ? (d.createdAt as { toDate: () => Date }).toDate().toISOString()
        : null;
      return {
        id: doc.id,
        lat: d.lat,
        lng: d.lng,
        storyId: d.storyId,
        createdAt,
      };
    });

    return NextResponse.json({ pulses });
  } catch (err) {
    console.error('[GET /api/pulse]', err);
    return NextResponse.json({ pulses: [] }, { status: 500 });
  }
}
