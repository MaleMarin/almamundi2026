/**
 * Manifiesto AlmaMundi — contenido del modal «Propósito» (/#proposito).
 */

import type { AlmaLocale } from '@/lib/i18n/locale';

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
        text: 'Cada persona que vive algo lo vive de una manera que nadie más va a vivir exactamente igual. Ese momento, esa experiencia, ese fragmento de vida, tiene un valor que solo existe si alguien lo cuenta.',
      },
      {
        type: 'quote',
        text: 'Vivimos en la era más documentada de la historia. Y hay millones de historias reales esperando el lugar correcto para existir.',
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
          'Una historia real puede cambiar la vida de alguien que aún no conoces. Eso es lo que hacen las historias desde que los humanos se sientan alrededor del fuego.',
          'El único requisito es querer compartirlo.',
          'Video, audio, texto, foto. Cuatro maneras de contar. Cuatro maneras de conocer.',
          'Las historias que despiertan otras historias vienen de la experiencia vivida.',
        ],
      },
    ],
  },
  {
    id: 'diferente',
    title: 'Lo que hacemos diferente',
    blocks: [
      {
        type: 'p',
        text: 'AlmaMundi fue diseñado para que las historias duren.',
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

const PT_SECTIONS: ManifiestoSection[] = [
  {
    id: 'por-que',
    title: 'Por que existimos',
    blocks: [
      {
        type: 'lead',
        lines: [
          'O mundo está cheio de histórias que merecem ser contadas.',
          'O AlmaMundi é o lugar onde isso acontece.',
        ],
      },
      {
        type: 'p',
        text: 'Estamos construindo o lugar onde a humanidade conta a própria história. Uma história real de cada vez.',
      },
      {
        type: 'p',
        text: 'Cada pessoa que vive algo vive de um jeito que ninguém mais vai viver exatamente igual. Esse momento, essa experiência, esse fragmento de vida, tem um valor que só existe se alguém contar.',
      },
      {
        type: 'quote',
        text: 'Vivemos na era mais documentada da história. E há milhões de histórias reais esperando o lugar certo para existir.',
      },
    ],
  },
  {
    id: 'creemos',
    title: 'O que acreditamos',
    blocks: [
      {
        type: 'beliefs',
        items: [
          'Uma história real pode mudar a vida de alguém que você ainda não conhece. É o que as histórias fazem desde que os humanos se sentam ao redor do fogo.',
          'O único requisito é querer compartilhar.',
          'Vídeo, áudio, texto, foto. Quatro maneiras de contar. Quatro maneiras de conhecer.',
          'As histórias que despertam outras histórias vêm da experiência vivida.',
        ],
      },
    ],
  },
  {
    id: 'diferente',
    title: 'O que fazemos diferente',
    blocks: [
      { type: 'p', text: 'O AlmaMundi foi pensado para que as histórias durem.' },
      {
        type: 'p',
        text: 'No AlmaMundi, cada história tem seu próprio tempo. Uma história publicada hoje pode encontrar quem precisa dela amanhã. Ou em três anos. O encontro entre uma história e a pessoa que precisa dela não tem pressa.',
      },
      {
        type: 'p',
        text: 'Aqui as histórias existem porque existem. Não há um sistema que decida quanto valem nem quando aparecem. Uma história publicada há três anos pode despertar alguém hoje com a mesma força do dia em que foi publicada.',
      },
      {
        type: 'p',
        text: 'Construímos o AlmaMundi para que cada história lida desperte uma que ainda não foi contada.',
      },
    ],
  },
  {
    id: 'cierre',
    title: 'Conte a sua',
    blocks: [
      {
        type: 'closing',
        lines: [
          'O formato é seu. A história também. O AlmaMundi é o lugar onde o que você viveu não desaparece.',
        ],
      },
    ],
  },
];

const EN_SECTIONS: ManifiestoSection[] = [
  {
    id: 'por-que',
    title: 'Why we exist',
    blocks: [
      {
        type: 'lead',
        lines: [
          'The world is full of stories that deserve to be told.',
          'AlmaMundi is the place where that happens.',
        ],
      },
      {
        type: 'p',
        text: 'We are building the place where humanity tells its own story. One real story at a time.',
      },
      {
        type: 'p',
        text: 'Each person who lives something lives it in a way no one else will live exactly the same. That moment, that experience, that fragment of a life, has a value that exists only if someone tells it.',
      },
      {
        type: 'quote',
        text: 'We live in the most documented era in history. And there are millions of real stories waiting for the right place to exist.',
      },
    ],
  },
  {
    id: 'creemos',
    title: 'What we believe',
    blocks: [
      {
        type: 'beliefs',
        items: [
          "A real story can change the life of someone you don't know yet. That's what stories have done since humans sat around a fire.",
          'The only requirement is wanting to share it.',
          'Video, audio, text, photo. Four ways to tell. Four ways to know.',
          'The stories that awaken other stories come from lived experience.',
        ],
      },
    ],
  },
  {
    id: 'diferente',
    title: 'What we do differently',
    blocks: [
      { type: 'p', text: 'AlmaMundi was designed so that stories last.' },
      {
        type: 'p',
        text: 'On AlmaMundi, each story has its own time. A story published today can find the person who needs it tomorrow. Or in three years. The meeting between a story and the person who needs it is never in a hurry.',
      },
      {
        type: 'p',
        text: 'Here stories exist because they exist. There is no system that decides how much they are worth or when they appear. A story published three years ago can awaken someone today with the same force as the day it was published.',
      },
      {
        type: 'p',
        text: "We built AlmaMundi so that every story someone reads awakens one that hasn't been told yet.",
      },
    ],
  },
  {
    id: 'cierre',
    title: 'Tell it',
    blocks: [
      {
        type: 'closing',
        lines: [
          "The format is yours. The story is too. AlmaMundi is the place where what you lived doesn't disappear.",
        ],
      },
    ],
  },
];

export function manifiestoFor(locale: AlmaLocale): { title: string; sections: ManifiestoSection[] } {
  if (locale === 'pt') return { title: 'Propósito', sections: PT_SECTIONS };
  if (locale === 'en') return { title: 'Purpose', sections: EN_SECTIONS };
  return { title: MANIFIESTO_TITLE, sections: MANIFIESTO_SECTIONS };
}
