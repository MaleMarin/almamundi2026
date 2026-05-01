/**
 * GET /api/stories
 * Retorna las historias publicadas para el globo.
 * Cache 60s para no sobrecargar Firestore.
 */

import { NextResponse } from 'next/server';
import { mergeGlobeFirestoreWithDemoFallback, showPublicDemoStories } from '@/lib/demo-stories-public';
import { getStoriesAsync } from '@/lib/map-data/stories-server';

export const revalidate = 60;

export async function GET() {
  try {
    const fromFs = await getStoriesAsync();
    const stories = showPublicDemoStories() ? mergeGlobeFirestoreWithDemoFallback(fromFs) : fromFs;
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
