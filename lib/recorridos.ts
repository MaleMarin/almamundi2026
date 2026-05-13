/**
 * Recorridos: tipos y mock data local.
 * Sin Firebase por ahora.
 */

export type RecorridoItemType = 'texto' | 'audio' | 'video' | 'foto';

export type RecorridoItem = {
  id: string;
  title: string;
  type: RecorridoItemType;
};

export type Recorrido = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  cover: string;
  items: RecorridoItem[];
};

const RECORRIDOS_MOCK: Recorrido[] = [
  {
    slug: 'voces-del-desplazamiento',
    title: 'Voces del desplazamiento',
    description: 'Cuando dejar un lugar es también empezar otro.',
    intro: 'Un trayecto por historias que cruzan fronteras físicas y emocionales.',
    cover: '/recorrido1.jpg',
    items: [
      { id: '1', title: 'La maleta', type: 'texto' },
      { id: '2', title: 'El mar al otro lado', type: 'audio' },
      { id: '3', title: 'Primer día en la nueva ciudad', type: 'texto' },
      { id: '4', title: 'Llamada a casa', type: 'audio' },
    ],
  },
  {
    slug: 'huellas-en-el-territorio',
    title: 'Relatos en el territorio',
    description: 'Relatos de quienes caminan y nombran el paisaje.',
    intro: 'Un recorrido por voces que dibujan mapas íntimos del lugar.',
    cover: '/recorrido2.jpg',
    items: [
      { id: '1', title: 'El camino de la costa', type: 'texto' },
      { id: '2', title: 'Viento y piedras', type: 'audio' },
      { id: '3', title: 'Nombres que no están en el mapa', type: 'texto' },
    ],
  },
];

export function getRecorridos(): Recorrido[] {
  return RECORRIDOS_MOCK;
}

export function getRecorridoBySlug(slug: string): Recorrido | undefined {
  return RECORRIDOS_MOCK.find((r) => r.slug === slug);
}
