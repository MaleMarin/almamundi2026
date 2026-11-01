import type { AlmaLocale } from '@/lib/i18n/locale';

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

export type PropositoCopy = {
  brand: string;
  title: string;
  close: string;
  closeAria: string;
  cta: string;
  credit: string;
  sections: ManifiestoSection[];
};

export const PROPOSITO: Record<AlmaLocale, PropositoCopy> = {
  es: {
    brand: 'AlmaMundi',
    title: 'Propósito',
    close: 'Cerrar',
    closeAria: 'Cerrar propósito',
    cta: 'Cuenta tu historia',
    credit: 'AlmaMundi es un proyecto sin fines de lucro de Precisar.',
    sections: [
      {
        id: 'por-que',
        title: 'Por qué existimos',
        blocks: [
          { type: 'p', text: 'Creemos que cada vida guarda una historia que vale la pena conocer.' },
          {
            type: 'p',
            text: 'Por eso estamos construyendo la colección de historias humanas más grande jamás reunida, contadas en primera persona, desde cualquier lugar del mundo.',
          },
          {
            type: 'p',
            text: 'Vivimos rodeados de contenido, pero muchas de las historias que de verdad importan nunca se cuentan. AlmaMundi existe para que encuentren su lugar.',
          },
          { type: 'p', text: 'Cada historia marca la diferencia.' },
        ],
      },
      {
        id: 'creemos',
        title: 'Lo que creemos',
        blocks: [
          {
            type: 'beliefs',
            items: [
              'Una historia despierta otra. Al escuchar a alguien, recordamos algo propio.',
              'No hace falta una vida extraordinaria. Basta con haberla vivido.',
              'Cada quien elige cómo contar. Video, audio, texto o foto.',
              'Escuchar es una forma de cuidar. Por eso cada historia se recibe con respeto.',
            ],
          },
        ],
      },
      {
        id: 'diferente',
        title: 'Lo que hacemos distinto',
        blocks: [
          {
            type: 'beliefs',
            items: [
              'Sin likes ni contadores públicos. Las historias no compiten entre sí.',
              'Tú eliges por dónde explorar. El mapa, los temas o las preguntas. No hay un sistema que decida qué ves para retenerte.',
              'Las historias no caducan. Una historia de hace años puede encontrar hoy a quien la necesita.',
              'Personas, no máquinas, revisan cada envío antes de publicarlo.',
            ],
          },
        ],
      },
      {
        id: 'cierre',
        title: 'Cuéntala',
        blocks: [{ type: 'closing', lines: ['El formato es tuyo. La historia también.'] }],
      },
    ],
  },
  pt: {
    brand: 'AlmaMundi',
    title: 'Propósito',
    close: 'Fechar',
    closeAria: 'Fechar propósito',
    cta: 'Conte sua história',
    credit: 'O AlmaMundi é um projeto sem fins lucrativos da Precisar.',
    sections: [
      {
        id: 'por-que',
        title: 'Por que existimos',
        blocks: [
          { type: 'p', text: 'Acreditamos que cada vida guarda uma história que vale a pena conhecer.' },
          {
            type: 'p',
            text: 'Por isso estamos construindo a maior coleção de histórias humanas já reunida, contadas em primeira pessoa, de qualquer lugar do mundo.',
          },
          {
            type: 'p',
            text: 'Vivemos cercados de conteúdo, mas muitas das histórias que realmente importam nunca são contadas. O AlmaMundi existe para que elas encontrem o seu lugar.',
          },
          { type: 'p', text: 'Cada história faz a diferença.' },
        ],
      },
      {
        id: 'creemos',
        title: 'No que acreditamos',
        blocks: [
          {
            type: 'beliefs',
            items: [
              'Uma história desperta outra. Ao ouvir alguém, lembramos de algo nosso.',
              'Não é preciso uma vida extraordinária. Basta tê-la vivido.',
              'Cada pessoa escolhe como contar. Vídeo, áudio, texto ou foto.',
              'Escutar é uma forma de cuidar. Por isso cada história é recebida com respeito.',
            ],
          },
        ],
      },
      {
        id: 'diferente',
        title: 'O que fazemos de diferente',
        blocks: [
          {
            type: 'beliefs',
            items: [
              'Sem curtidas nem contadores públicos. As histórias não competem entre si.',
              'Você escolhe por onde explorar. O mapa, os temas ou as perguntas. Não há um sistema decidindo o que você vê para te prender.',
              'As histórias não têm prazo de validade. Uma história de anos atrás pode encontrar hoje quem precisa dela.',
              'Pessoas, e não máquinas, revisam cada envio antes de publicar.',
            ],
          },
        ],
      },
      {
        id: 'cierre',
        title: 'Conte a sua',
        blocks: [{ type: 'closing', lines: ['O formato é seu. A história também.'] }],
      },
    ],
  },
  en: {
    brand: 'AlmaMundi',
    title: 'Purpose',
    close: 'Close',
    closeAria: 'Close purpose',
    cta: 'Tell your story',
    credit: 'AlmaMundi is a nonprofit project by Precisar.',
    sections: [
      {
        id: 'por-que',
        title: 'Why we exist',
        blocks: [
          { type: 'p', text: 'We believe every life holds a story worth knowing.' },
          {
            type: 'p',
            text: "That's why we're building the largest collection of human stories ever gathered, told in the first person, from anywhere in the world.",
          },
          {
            type: 'p',
            text: 'We live surrounded by content, yet many of the stories that truly matter are never told. AlmaMundi exists so they can find their place.',
          },
          { type: 'p', text: 'Every story makes a difference.' },
        ],
      },
      {
        id: 'creemos',
        title: 'What we believe',
        blocks: [
          {
            type: 'beliefs',
            items: [
              'One story awakens another. When we listen to someone, we remember something of our own.',
              "You don't need an extraordinary life. Having lived it is enough.",
              'Everyone chooses how to tell it. Video, audio, text or photo.',
              "Listening is a way of caring. That's why every story is received with respect.",
            ],
          },
        ],
      },
      {
        id: 'diferente',
        title: 'What we do differently',
        blocks: [
          {
            type: 'beliefs',
            items: [
              "No likes or public counters. Stories don't compete with each other.",
              'You choose where to explore. The map, the themes or the questions. No system decides what you see to keep you hooked.',
              "Stories don't expire. A story from years ago can find the person who needs it today.",
              "People, not machines, review every submission before it's published.",
            ],
          },
        ],
      },
      {
        id: 'cierre',
        title: 'Tell yours',
        blocks: [{ type: 'closing', lines: ['The format is yours. So is the story.'] }],
      },
    ],
  },
};

export function propositoFor(locale: AlmaLocale): PropositoCopy {
  return PROPOSITO[locale];
}

export function manifiestoFor(locale: AlmaLocale): { title: string; sections: ManifiestoSection[] } {
  const copy = PROPOSITO[locale];
  return { title: copy.title, sections: copy.sections };
}
