/**
 * 36 paletas de respaldo, tomadas de la paleta madre.
 * Una historia sin color propio elige la de su casilla. La semilla parte el empate.
 */
import type { NivelPaleta, TonoMadre } from '@/lib/cintas-v2/paleta-madre';
import { hashString } from '@/lib/cintas-v2/seed';

export type LuzRespaldo = 'luminosa' | 'media' | 'profunda';
export type IntensidadRespaldo = 'calma' | 'media' | 'intensa';
export type RolRespaldo = 'prota' | 'sec' | 'acento';

export type ColorRespaldo = {
  tono: TonoMadre;
  nivel: NivelPaleta;
  rol: RolRespaldo;
};

export type PaletaRespaldo = {
  id: string;
  nombre: string;
  luz: LuzRespaldo;
  intensidad: IntensidadRespaldo;
  colores: ColorRespaldo[];
};

const LUCES: LuzRespaldo[] = ['profunda', 'media', 'luminosa'];
const INTENSIDADES: IntensidadRespaldo[] = ['calma', 'media', 'intensa'];

function c(
  tono: TonoMadre,
  nivel: NivelPaleta,
  rol: RolRespaldo,
): ColorRespaldo {
  return { tono, nivel, rol };
}

export const PALETAS_RESPALDO: readonly PaletaRespaldo[] = [
  {
    id: 'manana-de-cartagena',
    nombre: 'Mañana de Cartagena',
    luz: 'luminosa',
    intensidad: 'calma',
    colores: [c('azul', 3, 'prota'), c('naranja', 3, 'sec'), c('verde', 3, 'sec'), c('rosa', 3, 'acento'), c('verde azulado', 4, 'acento')],
  },
  {
    id: 'patio-de-limones',
    nombre: 'Patio de limones',
    luz: 'luminosa',
    intensidad: 'calma',
    colores: [c('verde', 3, 'prota'), c('amarillo', 3, 'sec'), c('azul violeta', 3, 'sec'), c('rosa', 3, 'acento'), c('calipso', 5, 'acento')],
  },
  {
    id: 'calle-de-las-flores',
    nombre: 'Calle de las flores',
    luz: 'luminosa',
    intensidad: 'calma',
    colores: [c('rosa', 3, 'prota'), c('calipso', 3, 'sec'), c('amarillo', 3, 'sec'), c('verde azulado', 3, 'acento'), c('lima', 5, 'acento')],
  },
  {
    id: 'tarde-en-el-cerro',
    nombre: 'Tarde en el cerro',
    luz: 'luminosa',
    intensidad: 'calma',
    colores: [c('amarillo', 3, 'prota'), c('calipso', 3, 'sec'), c('magenta', 3, 'sec'), c('verde', 3, 'acento'), c('naranja', 4, 'acento')],
  },
  {
    id: 'malecon-de-tarde',
    nombre: 'Malecón de tarde',
    luz: 'luminosa',
    intensidad: 'media',
    colores: [c('calipso', 3, 'prota'), c('naranja', 4, 'sec'), c('morado', 3, 'sec'), c('lima', 4, 'sec'), c('amarillo', 5, 'acento'), c('verde', 2, 'acento')],
  },
  {
    id: 'feria-de-domingo',
    nombre: 'Feria de domingo',
    luz: 'luminosa',
    intensidad: 'media',
    colores: [c('lima', 3, 'prota'), c('magenta', 4, 'sec'), c('azul', 3, 'sec'), c('rosa', 4, 'sec'), c('amarillo', 5, 'acento'), c('verde azulado', 2, 'acento')],
  },
  {
    id: 'mercado-de-oaxaca',
    nombre: 'Mercado de Oaxaca',
    luz: 'luminosa',
    intensidad: 'media',
    colores: [c('magenta', 3, 'prota'), c('calipso', 4, 'sec'), c('naranja', 4, 'sec'), c('amarillo', 3, 'acento'), c('azul violeta', 2, 'acento'), c('rosa', 5, 'acento')],
  },
  {
    id: 'enero-en-el-valle',
    nombre: 'Enero en el valle',
    luz: 'luminosa',
    intensidad: 'media',
    colores: [c('naranja', 3, 'prota'), c('azul', 3, 'sec'), c('rosa', 3, 'sec'), c('verde', 4, 'acento'), c('morado', 2, 'acento'), c('lima', 5, 'acento')],
  },
  {
    id: 'fiesta-en-la-cordillera',
    nombre: 'Fiesta en la cordillera',
    luz: 'luminosa',
    intensidad: 'intensa',
    colores: [c('rojo', 3, 'prota'), c('calipso', 4, 'sec'), c('amarillo', 4, 'sec'), c('morado', 1, 'acento'), c('verde', 5, 'acento'), c('azul violeta', 3, 'acento')],
  },
  {
    id: 'despues-de-la-lluvia',
    nombre: 'Después de la lluvia',
    luz: 'luminosa',
    intensidad: 'intensa',
    colores: [c('morado', 3, 'prota'), c('naranja', 3, 'sec'), c('verde azulado', 3, 'sec'), c('azul', 1, 'sec'), c('lima', 5, 'acento'), c('rosa', 4, 'acento')],
  },
  {
    id: 'rio-de-la-selva',
    nombre: 'Río de la selva',
    luz: 'luminosa',
    intensidad: 'intensa',
    colores: [c('verde azulado', 3, 'prota'), c('rosa', 4, 'sec'), c('amarillo', 5, 'sec'), c('rojo', 1, 'acento'), c('azul', 4, 'acento'), c('lima', 3, 'acento')],
  },
  {
    id: 'flor-de-noviembre',
    nombre: 'Flor de noviembre',
    luz: 'luminosa',
    intensidad: 'intensa',
    colores: [c('azul violeta', 3, 'prota'), c('naranja', 3, 'sec'), c('calipso', 1, 'sec'), c('magenta', 5, 'acento'), c('verde', 3, 'acento'), c('amarillo', 4, 'acento')],
  },
  {
    id: 'cenote-al-mediodia',
    nombre: 'Cenote al mediodía',
    luz: 'media',
    intensidad: 'calma',
    colores: [c('verde azulado', 3, 'prota'), c('rosa', 3, 'sec'), c('lima', 3, 'sec'), c('azul', 4, 'acento'), c('naranja', 3, 'acento')],
  },
  {
    id: 'siesta-de-patio',
    nombre: 'Siesta de patio',
    luz: 'media',
    intensidad: 'calma',
    colores: [c('rosa', 3, 'prota'), c('verde', 3, 'sec'), c('calipso', 3, 'sec'), c('morado', 3, 'acento'), c('verde azulado', 4, 'acento')],
  },
  {
    id: 'tarde-en-la-vereda',
    nombre: 'Tarde en la vereda',
    luz: 'media',
    intensidad: 'calma',
    colores: [c('azul violeta', 3, 'prota'), c('naranja', 3, 'sec'), c('verde azulado', 3, 'sec'), c('rosa', 3, 'acento'), c('lima', 4, 'acento')],
  },
  {
    id: 'huerta-en-calma',
    nombre: 'Huerta en calma',
    luz: 'media',
    intensidad: 'calma',
    colores: [c('lima', 3, 'prota'), c('azul', 3, 'sec'), c('magenta', 3, 'sec'), c('calipso', 3, 'acento'), c('rosa', 5, 'acento')],
  },
  {
    id: 'plaza-de-naranjos',
    nombre: 'Plaza de naranjos',
    luz: 'media',
    intensidad: 'media',
    colores: [c('naranja', 3, 'prota'), c('azul', 4, 'sec'), c('verde', 2, 'sec'), c('magenta', 4, 'sec'), c('rosa', 5, 'acento'), c('morado', 3, 'acento')],
  },
  {
    id: 'cielo-de-cusco',
    nombre: 'Cielo de Cusco',
    luz: 'media',
    intensidad: 'media',
    colores: [c('azul', 3, 'prota'), c('magenta', 4, 'sec'), c('rosa', 2, 'sec'), c('calipso', 5, 'acento'), c('naranja', 3, 'acento'), c('lima', 4, 'acento')],
  },
  {
    id: 'vinedo-de-altura',
    nombre: 'Viñedo de altura',
    luz: 'media',
    intensidad: 'media',
    colores: [c('morado', 3, 'prota'), c('verde azulado', 2, 'sec'), c('naranja', 4, 'sec'), c('amarillo', 5, 'acento'), c('azul violeta', 3, 'acento'), c('rosa', 4, 'acento')],
  },
  {
    id: 'cocina-de-campo',
    nombre: 'Cocina de campo',
    luz: 'media',
    intensidad: 'media',
    colores: [c('verde', 3, 'prota'), c('magenta', 4, 'sec'), c('azul', 2, 'sec'), c('amarillo', 5, 'acento'), c('calipso', 4, 'acento'), c('rojo', 3, 'acento')],
  },
  {
    id: 'carnaval-de-barranquilla',
    nombre: 'Carnaval de Barranquilla',
    luz: 'media',
    intensidad: 'intensa',
    colores: [c('magenta', 3, 'prota'), c('azul', 1, 'sec'), c('amarillo', 5, 'sec'), c('verde', 4, 'acento'), c('naranja', 2, 'acento'), c('calipso', 3, 'acento')],
  },
  {
    id: 'sol-de-la-quebrada',
    nombre: 'Sol de la quebrada',
    luz: 'media',
    intensidad: 'intensa',
    colores: [c('amarillo', 3, 'prota'), c('morado', 1, 'sec'), c('calipso', 3, 'sec'), c('rojo', 5, 'acento'), c('verde azulado', 2, 'acento'), c('rosa', 3, 'acento')],
  },
  {
    id: 'tormenta-corta',
    nombre: 'Tormenta corta',
    luz: 'media',
    intensidad: 'intensa',
    colores: [c('calipso', 3, 'prota'), c('rojo', 1, 'sec'), c('amarillo', 5, 'sec'), c('magenta', 4, 'acento'), c('verde', 2, 'acento'), c('naranja', 3, 'acento')],
  },
  {
    id: 'volcan-al-amanecer',
    nombre: 'Volcán al amanecer',
    luz: 'media',
    intensidad: 'intensa',
    colores: [c('rojo', 3, 'prota'), c('azul violeta', 1, 'sec'), c('lima', 5, 'sec'), c('calipso', 3, 'acento'), c('naranja', 2, 'acento'), c('morado', 4, 'acento')],
  },
  {
    id: 'noche-en-el-valle',
    nombre: 'Noche en el valle',
    luz: 'profunda',
    intensidad: 'calma',
    colores: [c('morado', 1, 'prota'), c('verde', 2, 'sec'), c('rosa', 1, 'sec'), c('azul', 2, 'acento'), c('naranja', 3, 'acento')],
  },
  {
    id: 'selva-cerrada',
    nombre: 'Selva cerrada',
    luz: 'profunda',
    intensidad: 'calma',
    colores: [c('verde', 1, 'prota'), c('azul', 2, 'sec'), c('magenta', 1, 'sec'), c('naranja', 2, 'acento'), c('calipso', 3, 'acento')],
  },
  {
    id: 'taller-al-anochecer',
    nombre: 'Taller al anochecer',
    luz: 'profunda',
    intensidad: 'calma',
    colores: [c('azul', 1, 'prota'), c('rosa', 2, 'sec'), c('verde azulado', 1, 'sec'), c('amarillo', 2, 'acento'), c('morado', 3, 'acento')],
  },
  {
    id: 'sombra-del-jardin',
    nombre: 'Sombra del jardín',
    luz: 'profunda',
    intensidad: 'calma',
    colores: [c('rosa', 2, 'prota'), c('azul violeta', 1, 'sec'), c('verde', 2, 'sec'), c('naranja', 1, 'acento'), c('calipso', 3, 'acento')],
  },
  {
    id: 'madrugada-en-el-pueblo',
    nombre: 'Madrugada en el pueblo',
    luz: 'profunda',
    intensidad: 'media',
    colores: [c('azul violeta', 1, 'prota'), c('naranja', 2, 'sec'), c('verde', 1, 'sec'), c('magenta', 3, 'acento'), c('calipso', 3, 'acento'), c('rosa', 2, 'acento')],
  },
  {
    id: 'fogon-de-barro',
    nombre: 'Fogón de barro',
    luz: 'profunda',
    intensidad: 'media',
    colores: [c('naranja', 1, 'prota'), c('azul', 2, 'sec'), c('morado', 1, 'sec'), c('amarillo', 3, 'acento'), c('verde azulado', 3, 'acento'), c('rojo', 2, 'acento')],
  },
  {
    id: 'noche-junto-al-rio',
    nombre: 'Noche junto al río',
    luz: 'profunda',
    intensidad: 'media',
    colores: [c('verde azulado', 1, 'prota'), c('rosa', 2, 'sec'), c('azul violeta', 2, 'sec'), c('lima', 3, 'acento'), c('magenta', 3, 'acento'), c('naranja', 1, 'acento')],
  },
  {
    id: 'casa-en-penumbra',
    nombre: 'Casa en penumbra',
    luz: 'profunda',
    intensidad: 'media',
    colores: [c('magenta', 2, 'prota'), c('azul', 1, 'sec'), c('verde', 2, 'sec'), c('amarillo', 3, 'acento'), c('calipso', 3, 'acento'), c('rojo', 1, 'acento')],
  },
  {
    id: 'tormenta-en-el-limonar',
    nombre: 'Tormenta en el limonar',
    luz: 'profunda',
    intensidad: 'intensa',
    colores: [c('lima', 1, 'prota'), c('morado', 2, 'sec'), c('rojo', 1, 'sec'), c('amarillo', 3, 'acento'), c('calipso', 5, 'acento'), c('azul', 2, 'acento')],
  },
  {
    id: 'relampago-en-el-cerro',
    nombre: 'Relámpago en el cerro',
    luz: 'profunda',
    intensidad: 'intensa',
    colores: [c('rojo', 1, 'prota'), c('calipso', 2, 'sec'), c('morado', 1, 'sec'), c('amarillo', 5, 'acento'), c('verde', 3, 'acento'), c('naranja', 2, 'acento')],
  },
  {
    id: 'la-mina-al-anochecer',
    nombre: 'La mina al anochecer',
    luz: 'profunda',
    intensidad: 'intensa',
    colores: [c('amarillo', 1, 'prota'), c('azul', 2, 'sec'), c('magenta', 1, 'sec'), c('calipso', 3, 'acento'), c('rosa', 5, 'acento'), c('verde azulado', 2, 'acento')],
  },
  {
    id: 'farol-en-el-puerto',
    nombre: 'Farol en el puerto',
    luz: 'profunda',
    intensidad: 'intensa',
    colores: [c('calipso', 1, 'prota'), c('naranja', 2, 'sec'), c('morado', 1, 'sec'), c('lima', 5, 'acento'), c('rojo', 3, 'acento'), c('azul violeta', 2, 'acento')],
  },
];

export function casillaDe(valencia: number, activacion: number): { luz: LuzRespaldo; intensidad: IntensidadRespaldo } {
  const tercio = (valor: number) => (valor < 1 / 3 ? 0 : valor < 2 / 3 ? 1 : 2);
  return {
    luz: LUCES[tercio(Math.min(1, Math.max(0, valencia)))]!,
    intensidad: INTENSIDADES[tercio(Math.min(1, Math.max(0, activacion)))]!,
  };
}

/** Las cuatro paletas de la casilla empatan. La semilla elige una. */
export function elegirPaletaRespaldo(valencia: number, activacion: number, id: string): PaletaRespaldo {
  const casilla = casillaDe(valencia, activacion);
  const grupo = PALETAS_RESPALDO.filter((paleta) => paleta.luz === casilla.luz && paleta.intensidad === casilla.intensidad);
  return grupo[hashString(`${id}:respaldo`) % grupo.length]!;
}
