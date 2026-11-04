/**
 * Datos inventados SOLO para ver la constelación en la vista previa (?demo=constelacion).
 * No se guardan en la base de datos y nunca se muestran en el sitio oficial (producción).
 */
import type { MePreguntaPublica } from '@/lib/me-pregunto/shared';
import type { RespuestaPublica } from '@/lib/respuestas/public';

export function demoConstelacionActiva(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') return false;
  return new URLSearchParams(window.location.search).get('demo') === 'constelacion';
}

const P1 = 'mp-demoCancion01';
const P2 = 'mp-demoViaje0002';
const P3 = 'mp-demoAbuela003';

export const DEMO_PREGUNTAS: MePreguntaPublica[] = [
  { id: P1, texto: '¿Qué canción te devuelve a tu infancia?', alias: 'Camila', city: 'Santiago', country: 'Chile', lat: -33.45, lng: -70.66 },
  { id: P2, texto: '¿Cuál fue el primer viaje que hiciste por tu cuenta?', alias: 'Diego', city: 'Guadalajara', country: 'México', lat: 20.67, lng: -103.35 },
  { id: P3, texto: '¿Qué olor te recuerda a tu abuela?', alias: 'Lucía', city: 'Bogotá', country: 'Colombia', lat: 4.71, lng: -74.07 },
];

type Fila = [string, string, string, string, number, number, string];

function respuestas(id: string, pregunta: MePreguntaPublica, filas: Fila[]): RespuestaPublica[] {
  return filas.map(([sufijo, alias, city, country, lat, lng, contenido]) => ({
    id: `demo-${id}-${sufijo}`,
    questionId: id,
    mode: 'tu',
    kind: 'texto',
    contenido,
    alias,
    city,
    country,
    previewUrl: null,
    lat,
    lng,
    questionText: pregunta.texto,
    askerAlias: pregunta.alias,
    askerCity: pregunta.city,
    askerCountry: pregunta.country,
  }));
}

export const DEMO_RESPUESTAS: RespuestaPublica[] = [
  ...respuestas(P1, DEMO_PREGUNTAS[0]!, [
    ['a', 'Mariana', 'Ciudad de México', 'México', 19.43, -99.13, 'Una de Cri-Cri que mi mamá cantaba mientras planchaba.'],
    ['b', 'Joaquín', 'Lima', 'Perú', -12.05, -77.04, 'Un vals criollo que sonaba los domingos en la casa de mi tía.'],
    ['c', 'Ana Sofía', 'Lima', 'Perú', -12.1, -77.03, 'La canción del noticiero que mi papá ponía al desayuno.'],
    ['d', 'Tomás', 'Buenos Aires', 'Argentina', -34.6, -58.38, 'Una cumbia que bailábamos en los cumpleaños del barrio.'],
    ['e', 'Valeria', 'Bogotá', 'Colombia', 4.71, -74.07, 'Un vallenato del bus del colegio.'],
    ['f', 'Pedro', 'Madrid', 'España', 40.42, -3.7, 'La sintonía de los dibujos animados de la tarde.'],
    ['g', 'Beatriz', 'São Paulo', 'Brasil', -23.55, -46.63, 'Uma música da Xuxa, sem dúvida.'],
    ['h', 'Rocío', 'Valparaíso', 'Chile', -33.05, -71.62, 'Un bolero que mi abuelo silbaba arreglando la radio.'],
    ['i', 'Martín', 'Montevideo', 'Uruguay', -34.9, -56.16, 'Una murga de carnaval que escuchábamos desde la ventana.'],
    ['j', 'Elena', 'Quito', 'Ecuador', -0.18, -78.47, 'Un pasillo que sonaba en las fiestas de la familia.'],
  ]),
  ...respuestas(P2, DEMO_PREGUNTAS[1]!, [
    ['a', 'Andrés', 'Quito', 'Ecuador', -0.18, -78.47, 'A la costa, con una mochila y muy poca plata.'],
    ['b', 'Fernanda', 'Oaxaca', 'México', 17.07, -96.72, 'A la sierra, a conocer el pueblo de mi bisabuela.'],
    ['c', 'Ignacio', 'La Paz', 'Bolivia', -16.5, -68.15, 'Al lago Titicaca, en un bus que paraba en todas partes.'],
    ['d', 'Clara', 'Barcelona', 'España', 41.39, 2.17, 'A Lisboa, con un libro y sin plan.'],
  ]),
  ...respuestas(P3, DEMO_PREGUNTAS[2]!, [
    ['a', 'Daniela', 'Cali', 'Colombia', 3.45, -76.53, 'A arepa recién hecha y a café colado.'],
    ['b', 'Ricardo', 'Ciudad de Panamá', 'Panamá', 8.98, -79.52, 'A colonia de lavanda y a ropa tendida al sol.'],
    ['c', 'Inés', 'Lisboa', 'Portugal', 38.72, -9.14, 'A canela e a bolo no forno.'],
  ]),
];
