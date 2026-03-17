/**
 * GET /api/stories/[id]
 * Retorna una historia por id (para /historias/[id] y detalle).
 */
import { NextResponse } from 'next/server';
import { getStoryByIdAsync } from '@/lib/map-data/stories-server';

export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const story = await getStoryByIdAsync(id);
  if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(
    { story },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
