/**
 * Historias de demostración compartidas: carrusel (cliente) y API / servidor (getStoryByIdAsync).
 * Sin 'use client': importable desde Server Components y stories-server.
 */
import { MOCK_STORIES } from '@/lib/almamundi/mock-data';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import type { StoryPoint } from '@/lib/map-data/stories';

/** Demo texto — mismo contenido que en /historias/escrito. */
export const DEMO_TEXT_STORY_POINT: StoryPoint = {
  id: 'demo-texto-1',
  lat: -34.6037,
  lng: -58.3816,
  label: MOCK_STORIES.texto.titulo,
  title: MOCK_STORIES.texto.titulo,
  subtitle: MOCK_STORIES.texto.subtitulo,
  authorName: MOCK_STORIES.texto.autor.nombre,
  author: {
    name: MOCK_STORIES.texto.autor.nombre,
    avatar: MOCK_STORIES.texto.autor.avatar,
  },
  city: 'Buenos Aires',
  country: 'Argentina',
  body: MOCK_STORIES.texto.contenido,
  hasText: true,
  publishedAt: `${MOCK_STORIES.texto.fecha}T12:00:00.000Z`,
  tags: MOCK_STORIES.texto.tags,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-texto-demo/800/600',
  excerpt: `${MOCK_STORIES.texto.contenido.slice(0, 140).trim()}…`,
  quote: 'Eres un puente, no una fractura.',
  isDemo: true,
};

/** Demo fotos — mismas imágenes que en /historias/fotos. */
export const DEMO_FOTO_STORY_POINT = {
  id: 'demo-foto-1',
  lat: 20.6597,
  lng: -103.3496,
  label: MOCK_STORIES.fotos.titulo,
  title: MOCK_STORIES.fotos.titulo,
  subtitle: MOCK_STORIES.fotos.subtitulo,
  authorName: MOCK_STORIES.fotos.autor.nombre,
  author: {
    name: MOCK_STORIES.fotos.autor.nombre,
    avatar: MOCK_STORIES.fotos.autor.avatar,
  },
  city: 'Guadalajara',
  country: 'México',
  publishedAt: `${MOCK_STORIES.fotos.fecha}T12:00:00.000Z`,
  tags: MOCK_STORIES.fotos.tags,
  thumbnailUrl: MOCK_STORIES.fotos.imagenes[0]?.url,
  imagenes: MOCK_STORIES.fotos.imagenes,
  isDemo: true,
} as StoryPoint;

/** Demo audio — mismo audio que en /historias/audios. */
export const DEMO_AUDIO_STORY_POINT: StoryPoint = {
  id: 'demo-audio-1',
  lat: 17.0732,
  lng: -96.7266,
  label: MOCK_STORIES.audio.titulo,
  title: MOCK_STORIES.audio.titulo,
  subtitle: MOCK_STORIES.audio.subtitulo,
  authorName: MOCK_STORIES.audio.autor.nombre,
  author: {
    name: MOCK_STORIES.audio.autor.nombre,
    avatar: MOCK_STORIES.audio.autor.avatar,
  },
  city: 'Oaxaca',
  country: 'México',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: MOCK_STORIES.audio.thumbnailUrl,
  hasAudio: true,
  publishedAt: `${MOCK_STORIES.audio.fecha}T12:00:00.000Z`,
  tags: MOCK_STORIES.audio.tags,
  quote: MOCK_STORIES.audio.citaDestacada,
  isDemo: true,
};

/** Variantes demo (mismo recurso de audio) para carrusel tipo /historias/videos. */
const DEMO_AUDIO_STORY_2: StoryPoint = {
  id: 'demo-audio-2',
  lat: -12.0464,
  lng: -77.0428,
  label: 'Voces del valle',
  title: 'Voces del valle',
  subtitle: 'Lima, tarde de lluvia',
  authorName: 'Lucía Prado',
  author: { name: 'Lucía Prado', avatar: 'https://i.pravatar.cc/150?img=32' },
  city: 'Lima',
  country: 'Perú',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-2/800/800',
  hasAudio: true,
  publishedAt: '2026-02-01T12:00:00.000Z',
  tags: ['ciudad', 'memoria'],
  quote: 'La ciudad también susurra cuando calla.',
  isDemo: true,
};

const DEMO_AUDIO_STORY_3: StoryPoint = {
  id: 'demo-audio-3',
  lat: 40.4168,
  lng: -3.7038,
  label: 'Madrid, madrugada',
  title: 'Madrid, madrugada',
  subtitle: 'Un café antes del mundo',
  authorName: 'Iván Ortega',
  author: { name: 'Iván Ortega', avatar: 'https://i.pravatar.cc/150?img=52' },
  city: 'Madrid',
  country: 'España',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-3/800/800',
  hasAudio: true,
  publishedAt: '2026-01-15T12:00:00.000Z',
  tags: ['urbano', 'nocturno'],
  quote: 'A veces el día empieza antes del amanecer.',
  isDemo: true,
};

/** Más demos de audio (misma pista) para llenar el carrusel 3D como en /historias/videos. */
const DEMO_AUDIO_STORY_4: StoryPoint = {
  id: 'demo-audio-4',
  lat: -33.4489,
  lng: -70.6693,
  label: 'Santiago',
  title: 'El mundo desde aquí',
  subtitle: 'Crónica sonora',
  authorName: 'María',
  author: { name: 'María', avatar: 'https://i.pravatar.cc/150?img=11' },
  city: 'Santiago',
  country: 'Chile',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-4/800/800',
  hasAudio: true,
  publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  tags: ['ciudad', 'voz'],
  quote: 'A veces el micrófono es un espejo.',
  isDemo: true,
};

const DEMO_AUDIO_STORY_5: StoryPoint = {
  id: 'demo-audio-5',
  lat: -34.6037,
  lng: -58.3816,
  label: 'Buenos Aires',
  title: 'Una ventana al barrio',
  subtitle: 'Tarde de vereda',
  authorName: 'Carlos',
  author: { name: 'Carlos', avatar: 'https://i.pravatar.cc/150?img=22' },
  city: 'Buenos Aires',
  country: 'Argentina',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-5/800/800',
  hasAudio: true,
  publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  tags: ['barrio', 'escucha'],
  quote: 'El asfalto también tiene eco.',
  isDemo: true,
};

const DEMO_AUDIO_STORY_6: StoryPoint = {
  id: 'demo-audio-6',
  lat: 40.7128,
  lng: -74.006,
  label: 'New York',
  title: 'Historias en movimiento',
  subtitle: 'Subte y neón',
  authorName: 'Ana',
  author: { name: 'Ana', avatar: 'https://i.pravatar.cc/150?img=33' },
  city: 'New York',
  country: 'Estados Unidos',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-6/800/800',
  hasAudio: true,
  publishedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  tags: ['urbano', 'ritmo'],
  quote: 'La ciudad nunca deja de hablar.',
  isDemo: true,
};

const DEMO_AUDIO_STORY_7: StoryPoint = {
  id: 'demo-audio-7',
  lat: 19.4326,
  lng: -99.1332,
  label: 'Ciudad de México',
  title: 'Lo que oigo desde mi ciudad',
  subtitle: 'Radio abierta',
  authorName: 'Luis',
  author: { name: 'Luis', avatar: 'https://i.pravatar.cc/150?img=44' },
  city: 'Ciudad de México',
  country: 'México',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-7/800/800',
  hasAudio: true,
  publishedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  tags: ['mexico', 'comunidad'],
  quote: 'Cada esquina tiene su melodía.',
  isDemo: true,
};

const DEMO_AUDIO_STORY_8: StoryPoint = {
  id: 'demo-audio-8',
  lat: 51.5074,
  lng: -0.1278,
  label: 'Londres',
  title: 'Mi historia en audio',
  subtitle: 'Lluvia sobre el Támesis',
  authorName: 'Sofia',
  author: { name: 'Sofia', avatar: 'https://i.pravatar.cc/150?img=55' },
  city: 'Londres',
  country: 'Reino Unido',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-8/800/800',
  hasAudio: true,
  publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  tags: ['europa', 'lluvia'],
  quote: 'La distancia suena distinto.',
  isDemo: true,
};

const DEMO_AUDIO_STORY_9: StoryPoint = {
  id: 'demo-audio-9',
  lat: 35.6762,
  lng: 139.6503,
  label: 'Tokyo',
  title: 'Una más en la galería',
  subtitle: 'Shibuya al anochecer',
  authorName: 'Yuki',
  author: { name: 'Yuki', avatar: 'https://i.pravatar.cc/150?img=66' },
  city: 'Tokyo',
  country: 'Japón',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-9/800/800',
  hasAudio: true,
  publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  tags: ['asia', 'luz'],
  quote: 'El silencio también cuenta.',
  isDemo: true,
};

const DEMO_AUDIO_STORY_10: StoryPoint = {
  id: 'demo-audio-10',
  lat: 48.2082,
  lng: 16.3738,
  label: 'Viena',
  title: 'Tierra en alta definición',
  subtitle: 'Café y música',
  authorName: 'Thomas',
  author: { name: 'Thomas', avatar: 'https://i.pravatar.cc/150?img=77' },
  city: 'Viena',
  country: 'Austria',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-10/800/800',
  hasAudio: true,
  publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  tags: ['europa', 'música'],
  quote: 'Las notas atraviesan fronteras.',
  isDemo: true,
};

const DEMO_AUDIO_STORY_11: StoryPoint = {
  id: 'demo-audio-11',
  lat: 59.3293,
  lng: 18.0686,
  label: 'Estocolmo',
  title: 'Rotación suave',
  subtitle: 'Luz nórdica',
  authorName: 'Elin',
  author: { name: 'Elin', avatar: 'https://i.pravatar.cc/150?img=88' },
  city: 'Estocolmo',
  country: 'Suecia',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-11/800/800',
  hasAudio: true,
  publishedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  tags: ['norte', 'calma'],
  quote: 'El frío tiene su propio sonido.',
  isDemo: true,
};

const DEMO_AUDIO_STORY_12: StoryPoint = {
  id: 'demo-audio-12',
  lat: 22.3193,
  lng: 114.1694,
  label: 'Hong Kong',
  title: 'Puerto y viento',
  subtitle: 'Noche de neón',
  authorName: 'Ming',
  author: { name: 'Ming', avatar: 'https://i.pravatar.cc/150?img=99' },
  city: 'Hong Kong',
  country: 'China',
  audioUrl: MOCK_STORIES.audio.audioUrl,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-audio-demo-12/800/800',
  hasAudio: true,
  publishedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  tags: ['puerto', 'noche'],
  quote: 'El mar no deja de murmurar.',
  isDemo: true,
};

export const DEMO_AUDIO_STORIES: StoryPoint[] = [
  DEMO_AUDIO_STORY_POINT,
  DEMO_AUDIO_STORY_2,
  DEMO_AUDIO_STORY_3,
  DEMO_AUDIO_STORY_4,
  DEMO_AUDIO_STORY_5,
  DEMO_AUDIO_STORY_6,
  DEMO_AUDIO_STORY_7,
  DEMO_AUDIO_STORY_8,
  DEMO_AUDIO_STORY_9,
  DEMO_AUDIO_STORY_10,
  DEMO_AUDIO_STORY_11,
  DEMO_AUDIO_STORY_12,
];

const DEMO_TEXT_BODY_2 =
  'Escribo esto desde un tren que no lleva prisa. Las ventanas son cuadros que cambian cada minuto: un pueblo, un río, una antena solitaria. Nadie me pidió que guardara estos instantes, pero aquí están, en tinta y pixels, para quien quiera leerlos.';

const DEMO_TEXT_BODY_3 =
  'Mi abuela decía que la verdad no cabe en una sola frase. Por eso aprendí a escuchar en silencio largo. Esta historia es un intento de devolver ese silencio en palabras que no lo rompan.';

const DEMO_TEXT_STORY_2: StoryPoint = {
  id: 'demo-texto-2',
  lat: -33.4489,
  lng: -70.6693,
  label: 'Cartas desde el tren',
  title: 'Cartas desde el tren',
  subtitle: 'Breve crónica en movimiento',
  authorName: 'Valentina Soto',
  author: { name: 'Valentina Soto', avatar: 'https://i.pravatar.cc/150?img=41' },
  city: 'Santiago',
  country: 'Chile',
  body: DEMO_TEXT_BODY_2,
  hasText: true,
  publishedAt: '2026-02-10T12:00:00.000Z',
  tags: ['viaje', 'paisaje'],
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-texto-demo-2/800/600',
  excerpt: `${DEMO_TEXT_BODY_2.slice(0, 120).trim()}…`,
  quote: 'El paisaje no espera al que mira distraído.',
  isDemo: true,
};

const DEMO_TEXT_STORY_3: StoryPoint = {
  id: 'demo-texto-3',
  lat: 4.711,
  lng: -74.0721,
  label: 'Lo que quedó del silencio',
  title: 'Lo que quedó del silencio',
  subtitle: 'Notas a mi abuela',
  authorName: 'Daniela Ríos',
  author: { name: 'Daniela Ríos', avatar: 'https://i.pravatar.cc/150?img=16' },
  city: 'Bogotá',
  country: 'Colombia',
  body: DEMO_TEXT_BODY_3,
  hasText: true,
  publishedAt: '2026-01-28T12:00:00.000Z',
  tags: ['familia', 'escucha'],
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-texto-demo-3/800/600',
  excerpt: `${DEMO_TEXT_BODY_3.slice(0, 120).trim()}…`,
  quote: 'Escuchar es una forma de creer.',
  isDemo: true,
};

function demoTextStory(
  idSuffix: number,
  lat: number,
  lng: number,
  title: string,
  subtitle: string,
  authorName: string,
  pravatarImg: number,
  city: string,
  country: string,
  body: string,
  publishedAtIso: string,
  tags: string[],
  quote: string,
  picsumSeed: string
): StoryPoint {
  return {
    id: `demo-texto-${idSuffix}`,
    lat,
    lng,
    label: title,
    title,
    subtitle,
    authorName,
    author: { name: authorName, avatar: `https://i.pravatar.cc/150?img=${pravatarImg}` },
    city,
    country,
    body,
    hasText: true,
    publishedAt: publishedAtIso,
    tags,
    thumbnailUrl: `https://picsum.photos/seed/${picsumSeed}/800/600`,
    excerpt: `${body.slice(0, 120).trim()}…`,
    quote,
    isDemo: true,
  };
}

const DEMO_TEXT_STORIES_EXTRA: StoryPoint[] = [
  demoTextStory(
    4,
    -33.4489,
    -70.6693,
    'El mundo desde aquí',
    'Notas de Santiago',
    'María',
    11,
    'Santiago',
    'Chile',
    'Camino a la cordillera el aire cambia de peso. Cada curva del camino guarda un nombre que ya no está en los mapas. Escribo para no olvidar el orden de las cosas: primero el viento, luego el silencio, después la voz de quien camina al lado.',
    new Date(Date.now() - 86400000 * 2).toISOString(),
    ['ciudad', 'montaña'],
    'El aire también tiene memoria.',
    'almamundi-texto-demo-4'
  ),
  demoTextStory(
    5,
    -34.6037,
    -58.3816,
    'Una ventana al planeta',
    'Desde Buenos Aires',
    'Carlos',
    22,
    'Buenos Aires',
    'Argentina',
    'La ventana del subte deja ver un segundo de cielo entre túnel y túnel. Apunto esos segundos en un cuaderno: no son paisaje completo, pero son verdad. La ciudad entera parece un libro que se lee en fragmentos.',
    new Date(Date.now() - 86400000 * 5).toISOString(),
    ['urbano', 'fragmento'],
    'Cada mirada es una página.',
    'almamundi-texto-demo-5'
  ),
  demoTextStory(
    6,
    40.7128,
    -74.006,
    'Historias en movimiento',
    'Nueva York, pasos contados',
    'Ana',
    33,
    'New York',
    'Estados Unidos',
    'Cruzo la calle cuando el semáforo parpadea. Aquí nadie espera la frase completa: se entiende igual. Escribo en el teléfono entre dos esquinas; el borrador huele a café y prisa. Aun así, las palabras se quedan.',
    new Date(Date.now() - 86400000 * 10).toISOString(),
    ['prisa', 'café'],
    'La prisa también es un lugar.',
    'almamundi-texto-demo-6'
  ),
  demoTextStory(
    7,
    19.4326,
    -99.1332,
    'Lo que veo desde mi ciudad',
    'Ciudad de México',
    'Luis',
    44,
    'Ciudad de México',
    'México',
    'El mercado abre antes que el sol. Las frutas ordenan el color del día: amarillo, rojo, verde. Mi abuela decía que elegir una fruta es una forma de política menor: alimentar el cuerpo y el barrio a la vez.',
    new Date(Date.now() - 86400000 * 15).toISOString(),
    ['mercado', 'color'],
    'Comer también es escuchar.',
    'almamundi-texto-demo-7'
  ),
  demoTextStory(
    8,
    51.5074,
    -0.1278,
    'Mi historia escrita',
    'Londres, borrador húmedo',
    'Sofia',
    55,
    'Londres',
    'Reino Unido',
    'La lluvia empaña el vidrio del autobús. Las letras del anuncio se derriten en gotas. Pienso en todas las historias que empiezan así: un cristal, una ciudad, una frase que no salió como se planeó.',
    new Date(Date.now() - 86400000 * 1).toISOString(),
    ['lluvia', 'borrador'],
    'Reescribir es un acto de ternura.',
    'almamundi-texto-demo-8'
  ),
  demoTextStory(
    9,
    35.6762,
    139.6503,
    'Una más en la galería',
    'Tokyo, líneas limpias',
    'Yuki',
    66,
    'Tokyo',
    'Japón',
    'En el andén las filas son geometría viva. Respeto el espacio entre cuerpos como se respeta un verso: sin tocar, pero con intención. Escribo esto sentada en un banco, antes de que cambie de tren otra vez.',
    new Date(Date.now() - 86400000 * 7).toISOString(),
    ['orden', 'respeto'],
    'El espacio también habla.',
    'almamundi-texto-demo-9'
  ),
  demoTextStory(
    10,
    48.2082,
    16.3738,
    'Tierra en alta definición',
    'Viena, café y partitura',
    'Thomas',
    77,
    'Viena',
    'Austria',
    'El café llega con una cucharilla que suena demasiado fuerte en la taza. Afuera, la ciudad camina en compás. No soy músico, pero aprendí que una buena frase necesita silencios como una sinfonía.',
    new Date(Date.now() - 86400000 * 4).toISOString(),
    ['música', 'café'],
    'El silencio es parte del texto.',
    'almamundi-texto-demo-10'
  ),
  demoTextStory(
    11,
    59.3293,
    18.0686,
    'Rotación suave',
    'Estocolmo, luz larga',
    'Elin',
    88,
    'Estocolmo',
    'Suecia',
    'En verano el día no termina; solo se vuelve más suave. Camino sin linterna y aun así veo el camino. Estas líneas son un intento de guardar esa claridad para cuando vuelva el invierno.',
    new Date(Date.now() - 86400000 * 6).toISOString(),
    ['luz', 'invierno'],
    'La luz también es relato.',
    'almamundi-texto-demo-11'
  ),
  demoTextStory(
    12,
    22.3193,
    114.1694,
    'Puerto y brisa',
    'Hong Kong, neón',
    'Ming',
    99,
    'Hong Kong',
    'China',
    'El puerto refleja torres como si el agua hubiera aprendido a copiar rascacielos. Cada reflejo dura un segundo y ya es otra ciudad. Escribo para fijar al menos una imagen antes de que cambie la marea.',
    new Date(Date.now() - 86400000 * 9).toISOString(),
    ['agua', 'reflejo'],
    'El agua guarda copias frágiles.',
    'almamundi-texto-demo-12'
  ),
];

export const DEMO_TEXT_STORIES: StoryPoint[] = [
  DEMO_TEXT_STORY_POINT,
  DEMO_TEXT_STORY_2,
  DEMO_TEXT_STORY_3,
  ...DEMO_TEXT_STORIES_EXTRA,
];

const DEMO_FOTO_STORY_2 = {
  id: 'demo-foto-2',
  lat: -34.6037,
  lng: -58.3816,
  label: 'Costanera al atardecer',
  title: 'Costanera al atardecer',
  subtitle: 'Buenos Aires en tres luces',
  authorName: 'Martín Álvarez',
  author: { name: 'Martín Álvarez', avatar: 'https://i.pravatar.cc/150?img=59' },
  city: 'Buenos Aires',
  country: 'Argentina',
  publishedAt: '2026-02-20T12:00:00.000Z',
  tags: ['ciudad', 'luz'],
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-foto2-a/1200/900',
  imagenes: [
    { url: 'https://picsum.photos/seed/almamundi-foto2-a/1200/900', caption: 'Primera luz sobre el río.' },
    { url: 'https://picsum.photos/seed/almamundi-foto2-b/1200/900', caption: 'Siluetas en la vereda.' },
    { url: 'https://picsum.photos/seed/almamundi-foto2-c/900/1200', caption: 'Reflejos en un charco.' },
    { url: 'https://picsum.photos/seed/almamundi-foto2-d/1200/900', caption: 'El cielo antes de la noche.' },
  ],
  isDemo: true,
} as StoryPoint;

const DEMO_FOTO_STORY_3 = {
  id: 'demo-foto-3',
  lat: 19.4326,
  lng: -99.1332,
  label: 'Mercado y color',
  title: 'Mercado y color',
  subtitle: 'Ciudad de México, domingo',
  authorName: 'Gabriela Núñez',
  author: { name: 'Gabriela Núñez', avatar: 'https://i.pravatar.cc/150?img=25' },
  city: 'Ciudad de México',
  country: 'México',
  publishedAt: '2026-01-08T12:00:00.000Z',
  tags: ['comunidad', 'color'],
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-foto3-a/1200/900',
  imagenes: [
    { url: 'https://picsum.photos/seed/almamundi-foto3-a/1200/900', caption: 'Puestos al abrir el día.' },
    { url: 'https://picsum.photos/seed/almamundi-foto3-b/1200/900', caption: 'Frutas como bandera.' },
    { url: 'https://picsum.photos/seed/almamundi-foto3-c/1200/900', caption: 'Manos que conocen el peso.' },
  ],
  isDemo: true,
} as StoryPoint;

function demoFotoAlbum(
  idNum: number,
  lat: number,
  lng: number,
  title: string,
  subtitle: string,
  authorName: string,
  pravatarImg: number,
  city: string,
  country: string,
  publishedAtIso: string,
  tags: string[],
  seedBase: string,
  captions: [string, string, string]
): StoryPoint {
  const a = `https://picsum.photos/seed/${seedBase}-a/1200/900`;
  const b = `https://picsum.photos/seed/${seedBase}-b/1200/900`;
  const c = `https://picsum.photos/seed/${seedBase}-c/900/1200`;
  return {
    id: `demo-foto-${idNum}`,
    lat,
    lng,
    label: title,
    title,
    subtitle,
    authorName,
    author: { name: authorName, avatar: `https://i.pravatar.cc/150?img=${pravatarImg}` },
    city,
    country,
    publishedAt: publishedAtIso,
    tags,
    thumbnailUrl: a,
    imagenes: [
      { url: a, caption: captions[0] },
      { url: b, caption: captions[1] },
      { url: c, caption: captions[2] },
    ],
    isDemo: true,
  } as StoryPoint;
}

const DEMO_FOTO_STORIES_EXTRA: StoryPoint[] = [
  demoFotoAlbum(
    4,
    -33.4489,
    -70.6693,
    'El mundo desde aquí',
    'Santiago en tres tomas',
    'María',
    11,
    'Santiago',
    'Chile',
    new Date(Date.now() - 86400000 * 2).toISOString(),
    ['ciudad', 'cordillera'],
    'almamundi-foto4',
    ['Cerro y cielo despejado.', 'Vereda que sube despacio.', 'Sombra de un árbol antiguo.']
  ),
  demoFotoAlbum(
    5,
    -34.6037,
    -58.3816,
    'Una ventana al planeta',
    'Buenos Aires, tres luces',
    'Carlos',
    22,
    'Buenos Aires',
    'Argentina',
    new Date(Date.now() - 86400000 * 5).toISOString(),
    ['rio', 'tarde'],
    'almamundi-foto5',
    ['Río al atardecer.', 'Edificios y reflejo.', 'Gaviota en el aire.']
  ),
  demoFotoAlbum(
    6,
    40.7128,
    -74.006,
    'Historias en movimiento',
    'Nueva York, tres esquinas',
    'Ana',
    33,
    'New York',
    'Estados Unidos',
    new Date(Date.now() - 86400000 * 10).toISOString(),
    ['avenida', 'prisa'],
    'almamundi-foto6',
    ['Cruce con semáforo.', 'Ventana de cafetería.', 'Sombra larga en acera.']
  ),
  demoFotoAlbum(
    7,
    19.4326,
    -99.1332,
    'Lo que veo desde mi ciudad',
    'Ciudad de México',
    'Luis',
    44,
    'Ciudad de México',
    'México',
    new Date(Date.now() - 86400000 * 15).toISOString(),
    ['plaza', 'color'],
    'almamundi-foto7',
    ['Plaza al mediodía.', 'Puesto de flores.', 'Niños y sombrillas.']
  ),
  demoFotoAlbum(
    8,
    51.5074,
    -0.1278,
    'Mi historia en fotos',
    'Londres, tres gotas',
    'Sofia',
    55,
    'Londres',
    'Reino Unido',
    new Date(Date.now() - 86400000 * 1).toISOString(),
    ['lluvia', 'puente'],
    'almamundi-foto8',
    ['Puente bajo la niebla.', 'Paraguas en fila.', 'Reflejo en charco.']
  ),
  demoFotoAlbum(
    9,
    35.6762,
    139.6503,
    'Una más en la galería',
    'Tokyo, tres líneas',
    'Yuki',
    66,
    'Tokyo',
    'Japón',
    new Date(Date.now() - 86400000 * 7).toISOString(),
    ['neón', 'noche'],
    'almamundi-foto9',
    ['Calle con neón.', 'Estación casi vacía.', 'Escalera mecánica y luz.']
  ),
  demoFotoAlbum(
    10,
    48.2082,
    16.3738,
    'Tierra en alta definición',
    'Viena, tres salas',
    'Thomas',
    77,
    'Viena',
    'Austria',
    new Date(Date.now() - 86400000 * 4).toISOString(),
    ['arquitectura', 'café'],
    'almamundi-foto10',
    ['Fachada clásica.', 'Mesa con taza.', 'Jardín detrás del muro.']
  ),
  demoFotoAlbum(
    11,
    59.3293,
    18.0686,
    'Rotación suave',
    'Estocolmo, tres aguas',
    'Elin',
    88,
    'Estocolmo',
    'Suecia',
    new Date(Date.now() - 86400000 * 6).toISOString(),
    ['muelle', 'calma'],
    'almamundi-foto11',
    ['Muelle al amanecer.', 'Barco pequeño amarrado.', 'Cisne y reflejo.']
  ),
  demoFotoAlbum(
    12,
    22.3193,
    114.1694,
    'Puerto y neón',
    'Hong Kong, tres alturas',
    'Ming',
    99,
    'Hong Kong',
    'China',
    new Date(Date.now() - 86400000 * 9).toISOString(),
    ['torre', 'bahía'],
    'almamundi-foto12',
    ['Bahía con barcazas.', 'Rascacielos y cielo.', 'Ferry saliendo al anochecer.']
  ),
];

export const DEMO_FOTO_STORIES: StoryPoint[] = [
  DEMO_FOTO_STORY_POINT,
  DEMO_FOTO_STORY_2,
  DEMO_FOTO_STORY_3,
  ...DEMO_FOTO_STORIES_EXTRA,
];

export function getDemoStoryPointById(id: string): StoryPoint | null {
  if (!id) return null;
  if (id.startsWith('demo-video-')) {
    const found = DEMO_VIDEO_STORIES.find((s) => s.id === id);
    return found ?? null;
  }
  if (id.startsWith('demo-audio-')) {
    return DEMO_AUDIO_STORIES.find((s) => s.id === id) ?? null;
  }
  if (id.startsWith('demo-texto-')) {
    return DEMO_TEXT_STORIES.find((s) => s.id === id) ?? null;
  }
  if (id.startsWith('demo-foto-')) {
    return DEMO_FOTO_STORIES.find((s) => s.id === id) ?? null;
  }
  return null;
}

/** Segmento de ruta copiado de ejemplos (ID, [id], TU_ID) — no es un id de Firebase. */
export function isPlaceholderHistoriasId(segment: string): boolean {
  const u = segment.trim();
  if (!u) return false;
  const lower = u.toLowerCase();
  return lower === 'id' || lower === '[id]' || lower === 'tu_id';
}
