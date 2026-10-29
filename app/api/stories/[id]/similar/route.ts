/**
 * GET /api/stories/[id]/similar
 * Hasta 3 historias con perfil de tono (VAD) cercano.
 * Mismo semillero de texto que el color del globo. Sin embeddings ni canción.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_AUDIENCE_PUBLIC_STATUSES,
  GLOBE_PUBLIC_STORY_CAP,
  isAudiencePublicStoryStatus,
} from '@/lib/editorial/status';
import {
  rankRelatedByTone,
  storyToneProfile,
  toneSeedFromFirestoreDoc,
  type StoryToneSeed,
} from '@/lib/huella/related-by-tone';
import { normalizeAntecedentes, omitAntecedentesFromPublicText } from '@/lib/antecedentes';
import { publicCityCountry } from '@/lib/historias/story-ubicacion';

export const runtime = 'nodejs';

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
};

type Rankable = SimilarDoc & { seed: StoryToneSeed };

function publishedAtIso(raw: unknown): string | null {
  if (raw && typeof (raw as { toDate?: () => Date }).toDate === 'function') {
    return (raw as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof raw === 'string' && raw.trim()) return raw;
  return null;
}

function similarFromFirestore(id: string, d: Record<string, unknown>): Rankable {
  const note = normalizeAntecedentes(d.antecedentes);
  const text = omitAntecedentesFromPublicText(typeof d.text === 'string' ? d.text : '', note);
  const body = omitAntecedentesFromPublicText(typeof d.body === 'string' ? d.body : '', note);
  const excerpt = omitAntecedentesFromPublicText(typeof d.excerpt === 'string' ? d.excerpt : '', note);
  const formatRaw = (d.format as string | undefined) ?? (d.formato as string | undefined);
  const place = publicCityCountry(
    typeof d.city === 'string' ? d.city : typeof d.placeLabel === 'string' ? d.placeLabel : '',
    typeof d.country === 'string' ? d.country : ''
  );
  return {
    id,
    lat: Number(d.lat) || 0,
    lng: Number(d.lng) || 0,
    title: (d.title as string) ?? '',
    label: (d.authorName as string) ?? 'Anónimo',
    description: (excerpt || text || body).slice(0, 120),
    city: place.city ?? null,
    country: place.country ?? null,
    format: formatRaw || 'text',
    publishedAt: publishedAtIso(d.publishedAt),
    seed: toneSeedFromFirestoreDoc(d),
  };
}

function toPublic(item: Rankable): SimilarDoc {
  const { seed, ...rest } = item;
  void seed;
  return rest;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ similar: [] });

    let currentSeed: StoryToneSeed | null = null;
    const byId = new Map<string, Rankable>();

    try {
      const { getAdminDb } = await import('@/lib/firebase/admin');
      const db = getAdminDb();
      const currentSnap = await db.collection('stories').doc(id).get();
      if (currentSnap.exists) {
        const d = currentSnap.data() as Record<string, unknown>;
        if (isAudiencePublicStoryStatus(d.status)) {
          currentSeed = toneSeedFromFirestoreDoc(d);
        }
      }

      const snap = await db
        .collection('stories')
        .where('status', 'in', [...FIRESTORE_AUDIENCE_PUBLIC_STATUSES])
        .orderBy('publishedAt', 'desc')
        .limit(GLOBE_PUBLIC_STORY_CAP)
        .get();

      for (const doc of snap.docs) {
        byId.set(doc.id, similarFromFirestore(doc.id, doc.data() as Record<string, unknown>));
      }
    } catch (err) {
      console.warn('[/api/stories/[id]/similar] Firestore no disponible.', err);
    }

    const currentVad = currentSeed ? storyToneProfile(currentSeed) : null;
    if (!currentVad) {
      return NextResponse.json({ similar: [] });
    }

    const similar = rankRelatedByTone({
      currentId: id,
      current: currentVad,
      items: [...byId.values()],
      idOf: (item) => item.id,
      profileOf: (item) => storyToneProfile(item.seed),
      limit: 3,
    }).map(toPublic);

    return NextResponse.json({ similar });
  } catch (err) {
    console.error('[/api/stories/[id]/similar]', err);
    return NextResponse.json({ similar: [] });
  }
}
