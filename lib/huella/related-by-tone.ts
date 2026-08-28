/**
 * Historias relacionadas por perfil de tono (VAD del léxico).
 * No usa embeddings ni la canción relacionada.
 */

import { normalizeAntecedentes } from '@/lib/antecedentes';
import type { AlmaLocale } from '@/lib/i18n/locale';
import type { StoryPoint } from '@/lib/map-data/stories';
import { meanVadFromText } from '@/lib/huella/eco-vad';
import { pickStoryGlobeColorSeed } from '@/lib/huella/story-globe-color';
import type { VadTriple } from '@/lib/huella/vad-color';

export type StoryToneSeed = {
  antecedentes?: string;
  context?: string;
  textBody?: string;
  body?: string;
  transcription?: string;
};

export function toneSeedFromStoryPoint(
  s: Pick<StoryPoint, 'antecedentes' | 'body' | 'transcription'> & {
    context?: string;
    text?: string;
  }
): StoryToneSeed {
  return {
    antecedentes: s.antecedentes,
    context: s.context,
    textBody: s.text,
    body: s.body,
    transcription: s.transcription,
  };
}

export function toneSeedFromFirestoreDoc(d: Record<string, unknown>): StoryToneSeed {
  const str = (key: string): string | undefined =>
    typeof d[key] === 'string' ? (d[key] as string) : undefined;
  return {
    antecedentes: normalizeAntecedentes(d.antecedentes),
    context: str('context'),
    textBody: str('text'),
    body: str('body'),
    transcription: str('transcription'),
  };
}

export function storyToneProfile(
  seed: StoryToneSeed,
  locale: AlmaLocale = 'es'
): VadTriple | null {
  const text = pickStoryGlobeColorSeed(seed);
  if (!text) return null;
  return meanVadFromText(text, locale);
}

export function vadEuclidean(a: VadTriple, b: VadTriple): number {
  const dv = a.v - b.v;
  const da = a.a - b.a;
  const dd = a.d - b.d;
  return Math.sqrt(dv * dv + da * da + dd * dd);
}

export function rankRelatedByTone<T>(opts: {
  currentId: string;
  current: VadTriple;
  items: T[];
  idOf: (item: T) => string;
  profileOf: (item: T) => VadTriple | null;
  limit?: number;
}): T[] {
  const limit = opts.limit ?? 3;
  const scored: { item: T; dist: number }[] = [];
  for (const item of opts.items) {
    if (opts.idOf(item) === opts.currentId) continue;
    const profile = opts.profileOf(item);
    if (!profile) continue;
    scored.push({ item, dist: vadEuclidean(opts.current, profile) });
  }
  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, limit).map((row) => row.item);
}

export function inferStoryFormat(s: StoryPoint): string {
  const f = (s.format ?? '').trim().toLowerCase();
  if (f) return f;
  if (s.hasVideo || s.videoUrl) return 'video';
  if (s.hasAudio || s.audioUrl) return 'audio';
  if (s.imagenes && s.imagenes.length > 0) return 'foto';
  if (s.hasText || s.body) return 'text';
  return 'text';
}
