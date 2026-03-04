/**
 * GET /api/stories
 * Retorna las historias publicadas para el globo.
 * Cache 60s para no sobrecargar Firestore.
 */

import { NextResponse } from 'next/server';
import { getStoriesAsync } from '@/lib/map-data/stories-server';

export const revalidate = 60;

export async function GET() {
  try {
    const stories = await getStoriesAsync();
    return NextResponse.json(
      { stories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    console.error('[/api/stories GET]', err);
    return NextResponse.json({ stories: [] }, { status: 500 });
  }
}
