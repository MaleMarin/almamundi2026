/**
 * GET /api/stories/[id]/similar
 * Retorna hasta 3 historias con valores emocionales similares.
 * Sin ML — distancia euclidiana entre 4 ejes de emotions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { isAudiencePublicStoryStatus } from '@/lib/editorial/status';

export const runtime = 'nodejs';

type EmotionAxes = {
  calmaAgitacion: number;
  sombraLuz: number;
  intimoUniversal: number;
  tristezaAlegria: number;
};

function emotionDistance(a: EmotionAxes, b: EmotionAxes): number {
  return Math.sqrt(
    Math.pow(a.calmaAgitacion - b.calmaAgitacion, 2) +
      Math.pow(a.sombraLuz - b.sombraLuz, 2) +
      Math.pow(a.intimoUniversal - b.intimoUniversal, 2) +
      Math.pow(a.tristezaAlegria - b.tristezaAlegria, 2)
  );
}

type SimilarDoc = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  label: string;
  description: string;
  city: string | null;
  country: string | null;
  format: string;
  publishedAt: string | null;
  emotions: EmotionAxes | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    const storySnap = await db.collection('stories').doc(id).get();
    if (!storySnap.exists) {
      return NextResponse.json({ similar: [] });
    }

    const current = storySnap.data() as Record<string, unknown>;
    const currentEmot = current.emotions as EmotionAxes | null;

    const snap = await db
      .collection('stories')
      .orderBy('publishedAt', 'desc')
      .limit(50)
      .get();

    const candidates: SimilarDoc[] = snap.docs
      .filter((doc) => doc.id !== id)
      .filter((doc) => {
        const d = doc.data() as Record<string, unknown>;
        return isAudiencePublicStoryStatus(d.status);
      })
      .map((doc) => {
        const d = doc.data() as Record<string, unknown>;
        const publishedAt =
          d.publishedAt && typeof (d.publishedAt as { toDate?: () => Date }).toDate === 'function'
            ? (d.publishedAt as { toDate: () => Date }).toDate().toISOString()
            : null;
        const text = (d.text as string) ?? '';
        return {
          id: doc.id,
          lat: Number(d.lat),
          lng: Number(d.lng),
          title: (d.title as string) ?? '',
          label: (d.authorName as string) ?? 'Anónimo',
          description: text.slice(0, 120),
          city: (d.city as string) ?? null,
          country: (d.country as string) ?? null,
          format: (d.format as string) ?? 'text',
          publishedAt,
          emotions: (d.emotions as EmotionAxes) ?? null,
        };
      });

    let similar: SimilarDoc[] = candidates;
    if (currentEmot && typeof currentEmot === 'object') {
      const withEmotions = candidates
        .filter((c) => c.emotions != null)
        .sort((a, b) => {
          const da = emotionDistance(currentEmot, a.emotions!);
          const db_ = emotionDistance(currentEmot, b.emotions!);
          return da - db_;
        });
      const withoutEmotions = candidates.filter((c) => !c.emotions);
      similar = [...withEmotions, ...withoutEmotions];
    }

    return NextResponse.json({ similar: similar.slice(0, 3) });
  } catch (err) {
    console.error('[/api/stories/[id]/similar]', err);
    return NextResponse.json({ similar: [] });
  }
}
