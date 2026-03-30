/**
 * POST /api/curate/reject
 *
 * Llamado desde CurationPanel cuando el curador rechaza una historia.
 * Recibe: { storyId, curadorId, nota? }
 * Actualiza story_submissions (o stories) con status 'rejected' y guarda log.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const curadorId = auth.email;

  try {
    const body = (await req.json()) as {
      storyId: string;
      nota?: string;
    };

    const { storyId, nota } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: 'storyId es requerido' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Intentar en story_submissions primero; si no existe, en stories (flujo admin)
    const subRef = db.collection('story_submissions').doc(storyId);
    const storiesRef = db.collection('stories').doc(storyId);
    const subSnap = await subRef.get();
    const storySnap = await storiesRef.get();

    const ref = subSnap.exists ? subRef : storySnap.exists ? storiesRef : null;
    if (!ref || (!subSnap.exists && !storySnap.exists)) {
      return NextResponse.json(
        { error: 'Historia no encontrada' },
        { status: 404 }
      );
    }

    const rejectedAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    await ref.update({
      status: 'rejected',
      curadorId,
      curadorNota: nota ?? null,
      rejectedAt,
      updatedAt,
    });

    await db.collection('curation_log').add({
      storyId,
      action: 'rejected',
      curadorId,
      curadorNota: nota ?? null,
      timestamp: rejectedAt,
    });

    return NextResponse.json({
      ok: true,
      storyId,
      rejectedAt,
    });
  } catch (err) {
    console.error('[curate/reject]', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
