/**
 * Exposiciones: tipos y mock data.
 * Luego se conecta a Firebase.
 */

export type Pieza = {
  id: string;
  titulo: string;
  descripcion?: string;
  /** Orden en la sala (para next/prev). */
  orden: number;
  /** Opcional: imagen o thumbnail por pieza. */
  imagenUrl?: string;
};

export type Exposicion = {
  id: string;
  slug: string;
  titulo: string;
  descripcion?: string;
  piezas: Pieza[];
  /** Fecha o texto de vigencia (opcional). */
  vigencia?: string;
};

const MOCK_PIEZAS_MEMORIA: Pieza[] = [
  { id: 'p1', titulo: 'Primera luz', descripcion: 'Fragmentos de memoria que iluminan el relato.', orden: 1 },
  { id: 'p2', titulo: 'Voces del sur', descripcion: 'Historias en primera persona desde el territorio.', orden: 2 },
  { id: 'p3', titulo: 'Lo que queda', descripcion: 'Objetos y lugares que guardan huella.', orden: 3 },
  { id: 'p4', titulo: 'Cartas al futuro', descripcion: 'Mensajes escritos para quienes vendrán.', orden: 4 },
];

const MOCK_PIEZAS_SONIDO: Pieza[] = [
  { id: 's1', titulo: 'Paisaje sonoro', descripcion: 'El mundo en capas de audio.', orden: 1 },
  { id: 's2', titulo: 'Silencios', descripcion: 'Lo que no se dice.', orden: 2 },
  { id: 's3', titulo: 'Ritmos', descripcion: 'Tiempo y memoria en loop.', orden: 3 },
];

const MOCK_PIEZAS_MAPA: Pieza[] = [
  { id: 'm1', titulo: 'Puntos en el globo', descripcion: 'Cada historia tiene un lugar.', orden: 1 },
  { id: 'm2', titulo: 'Conexiones', descripcion: 'Hilos entre relatos y territorios.', orden: 2 },
];

/** Lista de exposiciones (mock). */
export const EXPOSICIONES_MOCK: Exposicion[] = [
  {
    id: 'expo-1',
    slug: 'memoria-colectiva',
    titulo: 'Memoria colectiva',
    descripcion: 'Una colección de relatos que tejen la memoria de muchas voces.',
    piezas: MOCK_PIEZAS_MEMORIA,
    vigencia: 'Permanente',
  },
  {
    id: 'expo-2',
    slug: 'sonidos-del-mundo',
    titulo: 'Sonidos del mundo',
    descripcion: 'Piezas sonoras que exploran el territorio y la escucha.',
    piezas: MOCK_PIEZAS_SONIDO,
    vigencia: '2025',
  },
  {
    id: 'expo-3',
    slug: 'el-mapa-vivo',
    titulo: 'El mapa vivo',
    descripcion: 'Historias geolocalizadas que despiertan el globo.',
    piezas: MOCK_PIEZAS_MAPA,
    vigencia: 'En curso',
  },
];

/** Obtener una exposición por slug. */
export function getExposicionBySlug(slug: string): Exposicion | undefined {
  return EXPOSICIONES_MOCK.find((e) => e.slug === slug);
}

/** Obtener todas las exposiciones (para listado). */
export function getExposiciones(): Exposicion[] {
  return [...EXPOSICIONES_MOCK];
}
