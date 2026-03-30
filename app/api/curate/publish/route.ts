/**
 * POST /api/curate/publish
 *
 * Llamado desde el panel /admin cuando el curador aprueba una historia.
 * Recibe: { storyId, temas[], curadorId, curadorNota?, ubicacion?, quote? }
 * Hace:
 *   1. Valida que existe y está en estado 'pending' o 'reviewing'
 *   2. Completa el formato (si falta, lo detecta)
 *   3. Asigna los temas confirmados por el curador
 *   4. Cambia status → 'published' y guarda publishedAt
 *   5. La historia aparece automáticamente en /historias/[formato] y /temas/[tema]
 *      porque esas páginas filtran por status === 'published'
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  FIRESTORE_COLLECTION,
  buildPublishUpdate,
  detectarFormato,
  type PublishPayload,
  type StoryData,
} from '@/lib/story-schema';
import { TEMAS_MAP } from '@/lib/temas';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const curadorId = auth.email;

  try {
    const body = (await req.json()) as {
      storyId: string;
      temas: string[];
      curadorNota?: string;
      ubicacion?: StoryData['ubicacion'];
      quote?: string;
    };

    const { storyId, temas, curadorNota, ubicacion, quote } = body;

    // ── Validar input ────────────────────────────────────────────────────────
    if (!storyId) {
      return NextResponse.json(
        { error: 'storyId es requerido' },
        { status: 400 }
      );
    }
    if (!Array.isArray(temas) || temas.length === 0) {
      return NextResponse.json(
        { error: 'Debes asignar al menos un tema' },
        { status: 400 }
      );
    }

    // Validar que los slugs de temas existen
    const temasInvalidos = temas.filter((t) => !TEMAS_MAP[t]);
    if (temasInvalidos.length > 0) {
      return NextResponse.json(
        { error: `Temas no reconocidos: ${temasInvalidos.join(', ')}` },
        { status: 400 }
      );
    }

    // ── Leer la historia de Firestore ────────────────────────────────────────
    const db = getAdminDb();
    const ref = db.collection(FIRESTORE_COLLECTION).doc(storyId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Historia no encontrada' }, { status: 404 });
    }

    const story = snap.data() as StoryData;

    if (!['pending', 'reviewing'].includes(story.status)) {
      return NextResponse.json(
        { error: `No se puede publicar una historia con status '${story.status}'` },
        { status: 409 }
      );
    }

    // ── Completar formato si falta ───────────────────────────────────────────
    const formato = story.formato ?? detectarFormato(story);

    // ── Construir el update ──────────────────────────────────────────────────
    const payload: PublishPayload = { temas, curadorId, curadorNota, ubicacion, quote };
    const update = {
      ...buildPublishUpdate(payload),
      formato, // asegura que formato quede guardado
    };

    // ── Guardar en Firestore ─────────────────────────────────────────────────
    await ref.update(update);

    // ── Log para auditoría ───────────────────────────────────────────────────
    await db.collection('curation_log').add({
      storyId,
      action: 'published',
      curadorId,
      curadorNota: curadorNota ?? null,
      temas,
      formato,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      storyId,
      formato,
      temas,
      publishedAt: update.publishedAt,
      message: `Historia publicada en /historias/${formato} y en ${temas.length} tema(s)`,
    });
  } catch (err) {
    console.error('[curate/publish]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
