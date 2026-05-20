/**
 * Manifiesto AlmaMundi — contenido del modal «Propósito» (/#proposito).
 */

export const MANIFIESTO_TITLE = 'Propósito';

export type ManifiestoBlock =
  | { type: 'lead'; lines: string[] }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
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
          'El mundo está lleno de historias que merecen ser contadas.',
          'AlmaMundi es el lugar donde eso ocurre.',
        ],
      },
      {
        type: 'p',
        text: 'Estamos construyendo el lugar donde la humanidad se cuenta a sí misma. Una historia real a la vez.',
      },
      {
        type: 'p',
        text: 'Cada persona que vive algo lo vive de una manera que nadie más va a vivir exactamente igual. Ese momento, esa experiencia, ese fragmento de vida — tiene un valor que solo existe si alguien lo cuenta.',
      },
      {
        type: 'quote',
        text: 'Vivimos en la era más documentada de la historia. Y hay millones de historias reales esperando el lugar correcto para existir.',
      },
      {
        type: 'p',
        text: 'La mujer que crió sola a tres hijos mientras estudiaba. El hombre que reconstruyó su casa con sus propias manos después del terremoto. La abuela que aprendió a usar el celular solo para ver la cara de su nieta. El joven que llegó a una ciudad sin conocer a nadie y encontró su lugar.',
      },
      {
        type: 'emphasis',
        text: 'Esas son las historias que AlmaMundi existe para guardar.',
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
          '01 — Cada persona que ha vivido algo lo ha vivido de una manera que nadie más va a vivir exactamente igual. Eso, por definición, es una historia única.',
          '02 — Una historia real puede cambiar la vida de alguien que aún no conoces. Eso es lo que hacen las historias desde que los humanos se sientan alrededor del fuego.',
          '03 — El único requisito es haber vivido algo. Todo lo demás — el formato, la extensión, la forma — es completamente tuyo.',
          '04 — El formato no importa. Un video grabado en el baño de tu casa puede contener más verdad que una producción de millones. Un audio de dos minutos grabado caminando puede ser la historia más importante de tu día.',
          '05 — Las historias que despiertan otras historias son siempre las más honestas. No las más elaboradas. Las más honestas.',
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
        text: 'AlmaMundi fue diseñado para la resonancia larga.',
      },
      {
        type: 'p',
        text: 'En AlmaMundi, cada historia tiene su propio tiempo. Una historia publicada hoy puede encontrar a quien la necesita mañana. O en tres años. El encuentro entre una historia y la persona que la necesita no tiene prisa.',
      },
      {
        type: 'p',
        text: 'Aquí las historias existen porque existen. No hay sistema que decida cuánto valen ni cuándo aparecen. Una historia publicada hace tres años puede despertar a alguien hoy con la misma fuerza que el día en que se publicó.',
      },
      {
        type: 'p',
        text: 'Construimos AlmaMundi para que cada historia que se lee despierte una que aún no se ha contado.',
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
          'Cuéntalo como puedas. Cuéntalo como quieras.',
          'En video desde tu celular. En audio caminando. En texto escrito de noche. En una foto con dos líneas al pie.',
          'El formato es tuyo. La historia también. AlmaMundi es el lugar donde lo que viviste no desaparece.',
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
