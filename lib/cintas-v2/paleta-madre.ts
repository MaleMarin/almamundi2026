/**
 * Paleta madre de las cintas, congelada.
 * 12 tonos por 5 niveles.
 * En cada fila se iguala la intensidad. La luz queda la natural de cada tono:
 * el amarillo y la lima son más luminosos que el azul y el morado.
 */

export const TONOS_MADRE = [
  'rojo',
  'naranja',
  'amarillo',
  'lima',
  'verde',
  'verde azulado',
  'calipso',
  'azul',
  'azul violeta',
  'morado',
  'magenta',
  'rosa',
] as const;

export type TonoMadre = (typeof TONOS_MADRE)[number];
export type NivelPaleta = 1 | 2 | 3 | 4 | 5;

export type ColorMadre = {
  tono: TonoMadre;
  nivel: NivelPaleta;
  nombre: string;
  hex: string;
};

export const PALETA_MADRE: readonly ColorMadre[] = [
  { tono: 'rojo', nivel: 1, nombre: 'granate', hex: '#B00018' },
  { tono: 'naranja', nivel: 1, nombre: 'naranja quemada', hex: '#DC4C00' },
  { tono: 'amarillo', nivel: 1, nombre: 'ámbar', hex: '#F5A300' },
  { tono: 'lima', nivel: 1, nombre: 'caña', hex: '#489D2B' },
  { tono: 'verde', nivel: 1, nombre: 'selva', hex: '#008622' },
  { tono: 'verde azulado', nivel: 1, nombre: 'jade', hex: '#009869' },
  { tono: 'calipso', nivel: 1, nombre: 'fosa marina', hex: '#0278B6' },
  { tono: 'azul', nivel: 1, nombre: 'añil', hex: '#2141A8' },
  { tono: 'azul violeta', nivel: 1, nombre: 'lila de noche', hex: '#4E32A2' },
  { tono: 'morado', nivel: 1, nombre: 'mora', hex: '#7D2E94' },
  { tono: 'magenta', nivel: 1, nombre: 'jamaica', hex: '#B00070' },
  { tono: 'rosa', nivel: 1, nombre: 'tuna roja', hex: '#D4145A' },

  { tono: 'rojo', nivel: 2, nombre: 'chile rojo', hex: '#E10600' },
  { tono: 'naranja', nivel: 2, nombre: 'mandarina', hex: '#FF7A00' },
  { tono: 'amarillo', nivel: 2, nombre: 'maíz', hex: '#FFE200' },
  { tono: 'lima', nivel: 2, nombre: 'limón verde', hex: '#6BCC4C' },
  { tono: 'verde', nivel: 2, nombre: 'nopal', hex: '#29B94D' },
  { tono: 'verde azulado', nivel: 2, nombre: 'cenote', hex: '#0BC18D' },
  { tono: 'calipso', nivel: 2, nombre: 'mar Caribe', hex: '#05A3E9' },
  { tono: 'azul', nivel: 2, nombre: 'cielo andino', hex: '#3D62DB' },
  { tono: 'azul violeta', nivel: 2, nombre: 'jacarandá', hex: '#7151D3' },
  { tono: 'morado', nivel: 2, nombre: 'uva', hex: '#AA4FC5' },
  { tono: 'magenta', nivel: 2, nombre: 'clavel', hex: '#F50087' },
  { tono: 'rosa', nivel: 2, nombre: 'buganvilia', hex: '#FF2D92' },

  { tono: 'rojo', nivel: 3, nombre: 'copihue', hex: '#FF4D40' },
  { tono: 'naranja', nivel: 3, nombre: 'mango maduro', hex: '#FD9D49' },
  { tono: 'amarillo', nivel: 3, nombre: 'sol altiplánico', hex: '#FFE14A' },
  { tono: 'lima', nivel: 3, nombre: 'hoja tierna', hex: '#8EDC72' },
  { tono: 'verde', nivel: 3, nombre: 'yerba mate', hex: '#54CA71' },
  { tono: 'verde azulado', nivel: 3, nombre: 'río claro', hex: '#0FCB9C' },
  { tono: 'calipso', nivel: 3, nombre: 'mar de Valparaíso', hex: '#01B3EE' },
  { tono: 'azul', nivel: 3, nombre: 'lapislázuli', hex: '#6584EC' },
  { tono: 'azul violeta', nivel: 3, nombre: 'flor morada', hex: '#9176E3' },
  { tono: 'morado', nivel: 3, nombre: 'violeta', hex: '#C26ADC' },
  { tono: 'magenta', nivel: 3, nombre: 'fucsia de patio', hex: '#FF3EC8' },
  { tono: 'rosa', nivel: 3, nombre: 'rosa mosqueta', hex: '#FF4D7A' },

  { tono: 'rojo', nivel: 4, nombre: 'coral caribeño', hex: '#F68675' },
  { tono: 'naranja', nivel: 4, nombre: 'durazno', hex: '#FFA659' },
  { tono: 'amarillo', nivel: 4, nombre: 'retama', hex: '#F9E771' },
  { tono: 'lima', nivel: 4, nombre: 'citronela', hex: '#A2E78B' },
  { tono: 'verde', nivel: 4, nombre: 'palma', hex: '#75DB8E' },
  { tono: 'verde azulado', nivel: 4, nombre: 'aguamarina', hex: '#42DEB7' },
  { tono: 'calipso', nivel: 4, nombre: 'Llanquihue', hex: '#33CCFF' },
  { tono: 'azul', nivel: 4, nombre: 'manta andina', hex: '#8BA6FD' },
  { tono: 'azul violeta', nivel: 4, nombre: 'lavanda', hex: '#B098FA' },
  { tono: 'morado', nivel: 4, nombre: 'orquídea', hex: '#D390E7' },
  { tono: 'magenta', nivel: 4, nombre: 'malva', hex: '#FF6EC7' },
  { tono: 'rosa', nivel: 4, nombre: 'flamenco', hex: '#FF6B9A' },

  { tono: 'rojo', nivel: 5, nombre: 'pitahaya', hex: '#FE9C8C' },
  { tono: 'naranja', nivel: 5, nombre: 'damasco', hex: '#FEBA7E' },
  { tono: 'amarillo', nivel: 5, nombre: 'maíz tierno', hex: '#FCEE91' },
  { tono: 'lima', nivel: 5, nombre: 'lima dulce', hex: '#B0EB9C' },
  { tono: 'verde', nivel: 5, nombre: 'albahaca', hex: '#8AE2A0' },
  { tono: 'verde azulado', nivel: 5, nombre: 'vertiente', hex: '#69E4C5' },
  { tono: 'calipso', nivel: 5, nombre: 'laguna', hex: '#5DD5FD' },
  { tono: 'azul', nivel: 5, nombre: 'horizonte', hex: '#98B0FE' },
  { tono: 'azul violeta', nivel: 5, nombre: 'agapanto', hex: '#B39EF2' },
  { tono: 'morado', nivel: 5, nombre: 'glicina', hex: '#DEA5F0' },
  { tono: 'magenta', nivel: 5, nombre: 'dalia', hex: '#FF8AD8' },
  { tono: 'rosa', nivel: 5, nombre: 'concha rosada', hex: '#FF96C8' },
];
