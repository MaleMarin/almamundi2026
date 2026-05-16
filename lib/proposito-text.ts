/**
 * Manifiesto AlmaMundi — contenido del modal «Propósito» (/#proposito).
 */

export const MANIFIESTO_TITLE = 'Manifiesto';

export type ManifiestoBlock =
  | { type: 'lead'; lines: string[] }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'stories'; items: string[] }
  | { type: 'beliefs'; items: string[] }
  | { type: 'emphasis'; text: string }
  | { type: 'closing'; lines: string[] };

export type ManifiestoSection = {
  id: string;
  title: string;
  blocks: ManifiestoBlock[];
};

export const MANIFIESTO_SECTIONS: ManifiestoSection[] = [
  {
    id: 'por-que',
    title: 'Por qué existimos',
    blocks: [
      {
        type: 'lead',
        lines: [
          'El mundo tiene demasiadas historias que se olvidan.',
          'Necesita la tuya.',
        ],
      },
      {
        type: 'p',
        text: 'No estamos construyendo una red social. Estamos construyendo el lugar donde la humanidad se cuenta a sí misma. Una historia real a la vez.',
      },
      {
        type: 'p',
        text: 'Durante los últimos veinte años, internet nos enseñó a editar antes de mostrar. A filtrar. A cortar lo feo. A publicar solo cuando la luz era buena, cuando el ángulo era el correcto, cuando la vida se veía como debía verse. Las plataformas nos entrenaron para producir una versión de nosotros mismos que performa bien en un feed.',
      },
      {
        type: 'quote',
        text: 'Vivimos en la era más documentada de la historia. Y estamos perdiendo más historias reales que ninguna generación anterior.',
      },
      {
        type: 'p',
        text: 'Porque nadie archiva lo que importa. Solo lo que performa. Millones de fotos de atardeceres idénticos. Miles de videos de lo mismo editado de maneras distintas. Y muy pocas personas contando lo que de verdad pasó.',
      },
      {
        type: 'stories',
        items: [
          'La historia de la mujer que crió sola a tres hijos mientras estudiaba.',
          'El hombre que reconstruyó su casa con sus propias manos después del terremoto.',
          'La abuela que aprendió a usar el celular solo para poder ver la cara de su nieta.',
          'El joven que llegó a una ciudad sin conocer a nadie y encontró su lugar en el mundo.',
        ],
      },
      {
        type: 'p',
        text: 'Esas historias no tienen filtro. No tienen música de fondo. No tienen la luz perfecta.',
      },
      {
        type: 'p',
        text: 'Y son las más importantes del mundo.',
      },
    ],
  },
  {
    id: 'creemos',
    title: 'Lo que creemos',
    blocks: [
      {
        type: 'beliefs',
        items: [
          'Cada persona que ha vivido algo lo ha vivido de una manera que nadie más va a vivir exactamente igual. Eso, por definición, es una historia única.',
          'Una historia real puede cambiar la vida de alguien que aún no conoces. Eso es lo que hacen las historias desde que los humanos se sientan alrededor del fuego.',
          'No hace falta saber escribir. No hace falta tener cámara profesional. No hace falta ser famoso ni interesante ni tener seguidores. Solo hace falta haber vivido algo.',
          'El formato no importa. Un video grabado en el baño de tu casa puede contener más verdad que una producción de millones. Un audio de dos minutos grabado caminando puede ser la historia más importante de tu día.',
          'Las historias que despiertan otras historias son siempre las más honestas. No las más perfectas. Las más honestas.',
        ],
      },
      {
        type: 'quote',
        text: 'Tu historia no necesita likes para existir. Solo necesita ser contada.',
      },
    ],
  },
  {
    id: 'diferente',
    title: 'Lo que hacemos diferente',
    blocks: [
      {
        type: 'p',
        text: 'AlmaMundi no tiene algoritmo que decida cuánto vale lo que viviste. No hay feed que empuje una historia hacia arriba y entierre otra. No hay métricas de vanidad que conviertan tu experiencia en un número. Aquí, una historia publicada hace tres años puede despertar a alguien hoy. Y una historia publicada hoy puede llegar a alguien en tres años.',
      },
      {
        type: 'emphasis',
        text: 'Eso no lo hace ninguna red social del mundo.',
      },
      {
        type: 'p',
        text: 'Porque las redes sociales fueron diseñadas para la atención inmediata. AlmaMundi fue diseñado para la resonancia larga. Para el momento en que alguien encuentra una historia que le dice exactamente lo que necesitaba escuchar, exactamente cuando lo necesitaba.',
      },
    ],
  },
  {
    id: 'cierre',
    title: 'Cuéntalo',
    blocks: [
      {
        type: 'closing',
        lines: [
          'Cuéntalo como puedas.',
          'Cuéntalo como quieras.',
          'En video desde tu celular. En audio caminando. En texto escrito de noche. En una foto con dos líneas al pie.',
          'El formato es tuyo. La historia también.',
          'AlmaMundi solo es el lugar donde va a existir.',
        ],
      },
    ],
  },
];

/** @deprecated Usar MANIFIESTO_* */
export const PROPOSITO_TITLE = MANIFIESTO_TITLE;
export const PROPOSITO_SUBTITLE = '';
export const PROPOSITO_PARAGRAPHS: string[] = [];
export const PROPOSITO_CIERRE = '';
