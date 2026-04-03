/**
 * Historias en video de demostración para /historias/videos.
 * Cada archivo en public/ con video debe tener una entrada aquí para verse en CinemaGallery.
 * Se fusionan con las historias con video de la API (ver page.tsx).
 *
 * demo-video-1: recurso local. demo-video-2…12: narrativa en historias-demo-narrative-batch.
 */
import type { StoryPoint } from '@/lib/map-data/stories';
import { DEMO_VIDEO_STORIES_EXTRA } from '@/lib/historias/historias-demo-narrative-batch';

export const DEMO_VIDEO_STORIES: (StoryPoint & { isDemo?: boolean })[] = [
  {
    id: 'demo-video-1',
    lat: -33.4489,
    lng: -70.6693,
    label: 'Santiago',
    title: 'El mundo desde aquí',
    authorName: 'María',
    city: 'Santiago',
    country: 'Chile',
    videoUrl: '/Earth_wAtmos_spin_02_1080p60.mp4',
    hasVideo: true,
    publishedAt: '2026-04-28T12:00:00.000Z',
    isDemo: true,
  },
  ...DEMO_VIDEO_STORIES_EXTRA,
];
