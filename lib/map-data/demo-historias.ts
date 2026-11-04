/**
 * Historias inventadas SOLO para probar la tarjeta de historia en la vista previa (?demo=historias).
 * No se guardan en la base de datos y nunca se muestran en el sitio oficial (producción).
 */
import type { StoryPoint } from '@/lib/map-data/stories';

export function demoHistoriasActiva(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') return false;
  return new URLSearchParams(window.location.search).get('demo') === 'historias';
}

export const DEMO_HISTORIAS: StoryPoint[] = [
  {
    id: 'demoVideo00001',
    lat: -12.05,
    lng: -77.04,
    label: 'El mercado de los sábados',
    title: 'El mercado de los sábados',
    authorName: 'Rosa',
    city: 'Lima',
    country: 'Perú',
    format: 'video',
    hasVideo: true,
    videoUrl: '/sonido%20ciudad.mp4',
    body: 'Cada sábado mi mamá me llevaba al mercado de Surquillo. Yo cargaba la bolsa de las frutas y ella regateaba con todos. Todavía voy, ahora con mi hija.',
  },
  {
    id: 'demoAudio00002',
    lat: -18.48,
    lng: -70.31,
    label: 'La radio de mi padre',
    title: 'La radio de mi padre',
    authorName: 'Héctor',
    city: 'Arica',
    country: 'Chile',
    format: 'audio',
    hasAudio: true,
    audioUrl: '/audio/amanecer.mp3',
    body: 'La radio no era mía, era de mi viejo. Una Philips de plástico, color crema.',
  },
  {
    id: 'demoTexto00003',
    lat: 19.43,
    lng: -99.13,
    label: 'La última carta',
    title: 'La última carta',
    authorName: 'Mariana',
    city: 'Ciudad de México',
    country: 'México',
    format: 'texto',
    hasText: true,
    body: 'Mi abuela me escribió una carta cuando me fui a estudiar lejos. La guardé sin abrir durante un año, porque me daba miedo extrañarla más.\nCuando por fin la leí, solo decía que comiera bien y que no me olvidara de mirar el cielo de noche. Desde entonces, cada vez que veo la luna, le respondo en voz baja.\nLa carta sigue en mi velador. El papel ya está amarillo, pero su letra sigue igual de firme.',
  },
  {
    id: 'demoFoto000004',
    lat: 4.71,
    lng: -74.07,
    label: 'Las cintas del patio',
    title: 'Las cintas del patio',
    authorName: 'Lucía',
    city: 'Bogotá',
    country: 'Colombia',
    format: 'foto',
    imageUrl: '/cintas/web/morado.webp',
    imagenes: [
      { url: '/cintas/web/morado.webp', titulo: 'Cintas moradas', anio: '1994', lugar: 'Bogotá' },
      { url: '/cintas/web/limon.webp', titulo: 'Fiesta del barrio', anio: '1996', lugar: 'Bogotá' },
    ],
    body: 'En el patio de la casa de mis abuelos colgábamos cintas de colores para las fiestas del barrio.',
  },
];
