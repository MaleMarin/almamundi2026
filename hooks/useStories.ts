'use client';

import { useEffect, useState } from 'react';
import type { StoryPoint } from '@/lib/map-data/stories';

/** Carga historias públicas desde `/api/stories` (Firestore). Sin fallbacks inventados. */
export function useStories(): StoryPoint[] {
  const [stories, setStories] = useState<StoryPoint[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/stories');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { stories: StoryPoint[] };
        if (!cancelled && Array.isArray(data.stories)) {
          setStories(data.stories);
        }
      } catch (err) {
        console.warn('[useStories] API no disponible:', err);
        if (!cancelled) setStories([]);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return stories;
}
