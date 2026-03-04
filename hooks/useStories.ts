'use client';

import { useEffect, useState } from 'react';
import type { StoryPoint } from '@/lib/map-data/stories';

/** 8 puntos demo cuando no hay historias en Firestore (lat/lng reales). */
const DEMO_POINTS: (StoryPoint & { isDemo: true })[] = [
  { id: 'demo-scl', lat: -33.4489, lng: -70.6693, label: 'Santiago', title: 'Una historia aún no contada', city: 'Santiago', country: 'Chile', topic: 'identidad', isDemo: true },
  { id: 'demo-valpo', lat: -33.0472, lng: -71.6127, label: 'Valparaíso', title: 'Una historia aún no contada', city: 'Valparaíso', country: 'Chile', topic: 'identidad', isDemo: true },
  { id: 'demo-bue', lat: -34.6037, lng: -58.3816, label: 'Buenos Aires', title: 'Una historia aún no contada', city: 'Buenos Aires', country: 'Argentina', topic: 'identidad', isDemo: true },
  { id: 'demo-cdmx', lat: 19.4326, lng: -99.1332, label: 'Ciudad de México', title: 'Una historia aún no contada', city: 'Ciudad de México', country: 'México', topic: 'identidad', isDemo: true },
  { id: 'demo-mad', lat: 40.4168, lng: -3.7038, label: 'Madrid', title: 'Una historia aún no contada', city: 'Madrid', country: 'España', topic: 'identidad', isDemo: true },
  { id: 'demo-bog', lat: 4.711, lng: -74.0721, label: 'Bogotá', title: 'Una historia aún no contada', city: 'Bogotá', country: 'Colombia', topic: 'identidad', isDemo: true },
  { id: 'demo-lim', lat: -12.0464, lng: -77.0428, label: 'Lima', title: 'Una historia aún no contada', city: 'Lima', country: 'Perú', topic: 'identidad', isDemo: true },
  { id: 'demo-sp', lat: -23.5505, lng: -46.6333, label: 'São Paulo', title: 'Una historia aún no contada', city: 'São Paulo', country: 'Brasil', topic: 'identidad', isDemo: true },
];

/**
 * Carga las historias publicadas desde /api/stories (Firestore).
 * Si la API devuelve [] o falla, retorna 8 puntos demo (isDemo: true) para que el mapa no quede vacío.
 */
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
          setStories(data.stories.length > 0 ? data.stories : DEMO_POINTS);
        }
      } catch (err) {
        console.warn('[useStories] API no disponible, usando puntos demo:', err);
        if (!cancelled) {
          setStories(DEMO_POINTS);
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
