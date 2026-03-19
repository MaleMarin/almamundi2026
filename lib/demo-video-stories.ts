/**
 * Historias en video de demostración para el prototipo (/historias/videos).
 * Se muestran cuando no hay historias con video desde la API.
 */
import type { StoryPoint } from '@/lib/map-data/stories';

/** Vídeo local del globo (NASA). Todas las demos usan este para el prototipo sin depender de URLs externas. */
const GLOBE_VIDEO = '/Earth_wAtmos_spin_02_1080p60.mp4';

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
    videoUrl: GLOBE_VIDEO,
    hasVideo: true,
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo-video-2',
    lat: -34.6037,
    lng: -58.3816,
    label: 'Buenos Aires',
    title: 'Una ventana al planeta',
    authorName: 'Carlos',
    city: 'Buenos Aires',
    country: 'Argentina',
    videoUrl: GLOBE_VIDEO,
    hasVideo: true,
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo-video-3',
    lat: 40.7128,
    lng: -74.006,
    label: 'New York',
    title: 'Historias en movimiento',
    authorName: 'Ana',
    city: 'New York',
    country: 'Estados Unidos',
    videoUrl: GLOBE_VIDEO,
    hasVideo: true,
    publishedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo-video-4',
    lat: 19.4326,
    lng: -99.1332,
    label: 'Ciudad de México',
    title: 'Lo que veo desde mi ciudad',
    authorName: 'Luis',
    city: 'Ciudad de México',
    country: 'México',
    videoUrl: GLOBE_VIDEO,
    hasVideo: true,
    publishedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo-video-5',
    lat: 40.4168,
    lng: -3.7038,
    label: 'Madrid',
    title: 'Un lugar en el mundo',
    authorName: 'Elena',
    city: 'Madrid',
    country: 'España',
    videoUrl: GLOBE_VIDEO,
    hasVideo: true,
    publishedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    isDemo: true,
  },
];
