'use client';

import { useEffect, useState } from 'react';
import { PUBLIC_GLOBE_DEMO_FALLBACK_POINTS, showPublicDemoStories } from '@/lib/demo-stories-public';
import type { StoryPoint } from '@/lib/map-data/stories';

/**
 * Carga historias desde `/api/stories` (Firestore + merge opcional en servidor si env).
 * Fallback local de 8 puntos solo si `NEXT_PUBLIC_SHOW_DEMO_STORIES=true`.
 */
export function useStories(): StoryPoint[] {
  const [stories, setStories] = useState<StoryPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    const demosOn = showPublicDemoStories();
    const fallback = demosOn ? PUBLIC_GLOBE_DEMO_FALLBACK_POINTS : [];

    const load = async () => {
      try {
        const res = await fetch('/api/stories');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { stories: StoryPoint[] };
        if (!cancelled && Array.isArray(data.stories)) {
          setStories(data.stories.length > 0 ? data.stories : fallback);
        }
      } catch (err) {
        console.warn('[useStories] API no disponible; fallback demo según env:', err);
        if (!cancelled) {
          setStories(fallback);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return stories;
}
