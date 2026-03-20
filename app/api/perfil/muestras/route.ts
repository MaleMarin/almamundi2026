import { NextResponse } from 'next/server';
import { createMuestra, type Muestra } from '@/lib/almamundi/perfil-queries';

export const runtime = 'nodejs';

type Body = Omit<Muestra, 'id' | 'createdAt'>;

/**
 * POST /api/perfil/muestras — crea una muestra (requiere auth en el futuro).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const {
      autorId,
      autorNombre,
      titulo,
      sentido,
      portadaUrl,
      historias = [],
      isPublic = true,
    } = body;

    if (!autorId || !autorNombre || !titulo?.trim() || !sentido?.trim()) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: autorId, autorNombre, titulo, sentido' },
        { status: 400 }
      );
    }
    if (sentido.trim().length < 20) {
      return NextResponse.json(
        { error: 'sentido debe tener al menos 20 caracteres' },
        { status: 400 }
      );
    }

    const id = await createMuestra({
      autorId,
      autorNombre,
      titulo: titulo.trim(),
      sentido: sentido.trim(),
      portadaUrl,
      historias: Array.isArray(historias) ? historias : [],
      historiasCount: Array.isArray(historias) ? historias.length : 0,
      isPublic: isPublic !== false,
    });

    return NextResponse.json({ id });
  } catch (e) {
    console.error('POST /api/perfil/muestras', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'server_error', detail: message }, { status: 500 });
  }
}
