import { NextResponse } from 'next/server';
import { createMuestra, type Muestra } from '@/lib/almamundi/perfil-queries';
import { requireFirebaseUser } from '@/lib/require-user';
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

type Body = Omit<Muestra, 'id' | 'createdAt'>;

/**
 * POST /api/perfil/muestras — requiere Firebase Auth; autorId debe coincidir con el uid del token.
 */
export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const rl = getRateLimiter('perfil-muestras', 20, 3600);
  const blocked = await enforceRateLimit(rl, `muestras:${ip}`, {
    max: 20,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  const user = await requireFirebaseUser(request);
  if (user instanceof NextResponse) return user;

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
    if (autorId !== user.uid) {
      return NextResponse.json({ error: 'No autorizado para este perfil.' }, { status: 403 });
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
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
