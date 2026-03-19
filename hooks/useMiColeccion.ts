'use client';

/**
 * Mi colección: historias guardadas por el usuario (localStorage).
 * Usado en las 4 páginas de formato (Videos, Audio, Escrito, Fotografía) para guardar, compartir y crear desde.
 */
import { useState, useEffect, useCallback } from 'react';
import type { StoryPoint } from '@/lib/map-data/stories';

const STORAGE_KEY = 'almamundi-mi-coleccion';

export type SavedStory = {
  id: string;
  savedAt: string;
  title?: string;
  format?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  city?: string;
  country?: string;
  authorName?: string;
  /** Snapshot mínimo para mostrar en Mi colección sin re-fetch */
  story?: StoryPoint;
};

function getStored(): SavedStory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(items: SavedStory[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function storyToSaved(s: StoryPoint): SavedStory {
  const format = s.format ?? (s.videoUrl ? 'video' : s.audioUrl ? 'audio' : s.imageUrl || s.images?.length ? 'foto' : 'texto');
  return {
    id: s.id,
    savedAt: new Date().toISOString(),
    title: s.title ?? s.label,
    format,
    thumbnailUrl: s.thumbnailUrl ?? s.imageUrl,
    imageUrl: s.imageUrl,
    city: s.city,
    country: s.country,
    authorName: s.authorName ?? s.author?.name,
    story: s,
  };
}

export function useMiColeccion() {
  const [saved, setSaved] = useState<SavedStory[]>([]);

  useEffect(() => {
    setSaved(getStored());
    const onStorage = () => setSaved(getStored());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((story: StoryPoint) => {
    setSaved((prev) => {
      if (prev.some((x) => x.id === story.id)) return prev;
      const next = [...prev, storyToSaved(story)];
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.filter((x) => x.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (id: string) => saved.some((x) => x.id === id),
    [saved]
  );

  const toggle = useCallback(
    (story: StoryPoint) => {
      if (isSaved(story.id)) remove(story.id);
      else add(story);
    },
    [add, remove, isSaved]
  );

  return { saved, add, remove, isSaved, toggle };
}
