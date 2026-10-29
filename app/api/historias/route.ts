/**
 * GET /api/historias
 * Todas las historias aprobadas para el listado, estén o no en el globo.
 */

import { NextResponse } from 'next/server';
import { getPublicCatalogAsync } from '@/lib/map-data/stories-server';

export const revalidate = 60;

export async function GET() {
  try {
    const stories = await getPublicCatalogAsync();
    return NextResponse.json(
      { stories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    console.error('[/api/historias GET]', err);
    return NextResponse.json({ stories: [] }, { status: 500 });
  }
}
