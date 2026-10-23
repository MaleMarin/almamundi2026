/**
 * Ocho paletas de 5 colores, tomadas de la paleta madre.
 * Sirven cuando la historia no tiene un color propio.
 */
import type { NivelPaleta, TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import { rngDeId } from '@/lib/cintas-v2/seed';

export type ColorArmonico = { tono: TonoMadre; nivel: NivelPaleta; rol: 'prota' | 'sec' | 'acento' };

export type PaletaArmonica = {
  id: string;
  valencia: number;
  activacion: number;
  colores: [ColorArmonico, ColorArmonico, ColorArmonico, ColorArmonico, ColorArmonico];
};

export const PALETAS_ARMONICAS: readonly PaletaArmonica[] = [
  {
    id: 'calida-luminosa-a',
    valencia: 0.86,
    activacion: 0.78,
    colores: [
      { tono: 'rojo', nivel: 2, rol: 'prota' },
      { tono: 'naranja', nivel: 2, rol: 'sec' },
      { tono: 'rosa', nivel: 2, rol: 'sec' },
      { tono: 'amarillo', nivel: 4, rol: 'acento' },
      { tono: 'magenta', nivel: 4, rol: 'acento' },
    ],
  },
  {
    id: 'calida-luminosa-b',
    valencia: 0.74,
    activacion: 0.48,
    colores: [
      { tono: 'rojo', nivel: 3, rol: 'prota' },
      { tono: 'naranja', nivel: 3, rol: 'sec' },
      { tono: 'lima', nivel: 3, rol: 'sec' },
      { tono: 'amarillo', nivel: 4, rol: 'acento' },
      { tono: 'rosa', nivel: 4, rol: 'acento' },
    ],
  },
  {
    id: 'calida-profunda-a',
    valencia: 0.22,
    activacion: 0.82,
    colores: [
      { tono: 'rojo', nivel: 1, rol: 'prota' },
      { tono: 'naranja', nivel: 1, rol: 'sec' },
      { tono: 'magenta', nivel: 1, rol: 'sec' },
      { tono: 'rosa', nivel: 1, rol: 'acento' },
      { tono: 'amarillo', nivel: 1, rol: 'acento' },
    ],
  },
  {
    id: 'calida-profunda-b',
    valencia: 0.34,
    activacion: 0.4,
    colores: [
      { tono: 'rojo', nivel: 2, rol: 'prota' },
      { tono: 'naranja', nivel: 1, rol: 'sec' },
      { tono: 'magenta', nivel: 2, rol: 'sec' },
      { tono: 'rosa', nivel: 2, rol: 'acento' },
      { tono: 'amarillo', nivel: 1, rol: 'acento' },
    ],
  },
  {
    id: 'fria-luminosa-a',
    valencia: 0.82,
    activacion: 0.32,
    colores: [
      { tono: 'calipso', nivel: 3, rol: 'prota' },
      { tono: 'verde azulado', nivel: 3, rol: 'sec' },
      { tono: 'morado', nivel: 3, rol: 'sec' },
      { tono: 'azul violeta', nivel: 4, rol: 'acento' },
      { tono: 'verde', nivel: 4, rol: 'acento' },
    ],
  },
  {
    id: 'fria-luminosa-b',
    valencia: 0.7,
    activacion: 0.62,
    colores: [
      { tono: 'verde', nivel: 3, rol: 'prota' },
      { tono: 'calipso', nivel: 3, rol: 'sec' },
      { tono: 'azul violeta', nivel: 3, rol: 'sec' },
      { tono: 'verde azulado', nivel: 4, rol: 'acento' },
      { tono: 'azul', nivel: 4, rol: 'acento' },
    ],
  },
  {
    id: 'fria-profunda-a',
    valencia: 0.18,
    activacion: 0.28,
    colores: [
      { tono: 'azul violeta', nivel: 1, rol: 'prota' },
      { tono: 'calipso', nivel: 1, rol: 'sec' },
      { tono: 'verde', nivel: 1, rol: 'sec' },
      { tono: 'azul', nivel: 1, rol: 'acento' },
      { tono: 'morado', nivel: 1, rol: 'acento' },
    ],
  },
  {
    id: 'fria-profunda-b',
    valencia: 0.3,
    activacion: 0.7,
    colores: [
      { tono: 'azul violeta', nivel: 2, rol: 'prota' },
      { tono: 'verde azulado', nivel: 2, rol: 'sec' },
      { tono: 'verde', nivel: 2, rol: 'sec' },
      { tono: 'morado', nivel: 2, rol: 'acento' },
      { tono: 'calipso', nivel: 1, rol: 'acento' },
    ],
  },
];

export function paletaAfin(valencia: number, activacion: number, id: string): PaletaArmonica {
  const orden = PALETAS_ARMONICAS.map((paleta) => ({
    paleta,
    distancia: Math.abs(paleta.valencia - valencia) + Math.abs(paleta.activacion - activacion),
  })).sort((a, b) => a.distancia - b.distancia);
  const mejor = orden[0]!.distancia;
  const empate = orden.filter((item) => item.distancia - mejor < 0.06);
  if (empate.length === 1) return empate[0]!.paleta;
  const rng = rngDeId(`${id}:paleta9`);
  return empate[Math.floor(rng() * empate.length)]!.paleta;
}
