import type { AlmaLocale } from '@/lib/i18n/locale';
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origin';

type Formatos = { video: string; audio: string; texto: string; foto: string };

type HilosCopy = {
  ceja: string;
  titulo: string;
  bajada: string;
  tirar: string;
  verTemas: string;
  cuentaEn: string;
  otro: string;
  mandar: string;
  otros: string;
  semana: string;
  cuentala: string;
  nav: string;
  leyenda: string;
  elige: string;
  entrada: string;
  /** Píldora bajo las tarjetas de la home, y título de /preguntas. */
  pill: string;
  bloqueTitulo: string;
  descubre: string;
  toca: string;
  invita: string;
  azar: string;
  responde: string;
  respondes: string;
  anterior: string;
  siguiente: string;
  formatos: Formatos;
  compartir: string;
  asunto: string;
};

export const HILOS_UI: Record<AlmaLocale, HilosCopy> = {
  es: {
    ceja: 'Preguntas que despiertan historias',
    titulo: 'Tira de una cinta',
    bajada: 'Cada cinta guarda preguntas sobre un momento de la vida.',
    tirar: 'Tira de una cinta',
    verTemas: 'Ver todos los temas',
    cuentaEn: 'Cuéntala en',
    otro: 'Otra cinta',
    mandar: 'Mándasela a alguien',
    otros: 'Así la contaron otros',
    semana: 'Preguntas que despiertan historias',
    cuentala: 'Cuéntala',
    nav: 'Preguntas',
    leyenda: 'Respuestas',
    elige: 'Elige una cinta',
    entrada: '¿Y si empiezas por una pregunta? Tira de una cinta',
    pill: '¿Y si empiezas por una pregunta? Tira de una cinta',
    bloqueTitulo: 'Tira de una cinta',
    descubre: 'y descubre la pregunta que guarda para ti.',
    toca: 'Toca una cinta',
    invita: 'Elige una pregunta y respóndela como quieras.',
    azar: 'o deja que el azar elija',
    responde: 'Responde aquí',
    respondes: 'Respondes a:',
    anterior: 'Cintas anteriores',
    siguiente: 'Cintas siguientes',
    formatos: { video: 'Video', audio: 'Audio', texto: 'Texto', foto: 'Foto' },
    compartir:
      'Te mando una pregunta de AlmaMundi: {pregunta} Me encantaría que me la contaras: {enlace}',
    asunto: 'Una pregunta para ti',
  },
  pt: {
    ceja: 'Perguntas que despertam histórias',
    titulo: 'Puxe uma fita',
    bajada: 'Cada fita guarda perguntas sobre um momento da vida.',
    tirar: 'Puxe uma fita',
    verTemas: 'Ver todos os temas',
    cuentaEn: 'Conte em',
    otro: 'Outra fita',
    mandar: 'Mande para alguém',
    otros: 'Assim outras pessoas contaram',
    semana: 'Perguntas que despertam histórias',
    cuentala: 'Conte',
    nav: 'Perguntas',
    leyenda: 'Respostas',
    elige: 'Escolha uma fita',
    entrada: 'E se você começar por uma pergunta? Puxe uma fita',
    pill: 'E se você começar por uma pergunta? Puxe uma fita',
    bloqueTitulo: 'Puxe uma fita',
    descubre: 'e descubra a pergunta que ela guarda para você.',
    toca: 'Toque em uma fita',
    invita: 'Escolha uma pergunta e responda do seu jeito.',
    azar: 'ou deixe o acaso escolher',
    responde: 'Responda aqui',
    respondes: 'Você está respondendo:',
    anterior: 'Fitas anteriores',
    seguinte: 'Fitas seguintes',
    formatos: { video: 'Vídeo', audio: 'Áudio', texto: 'Texto', foto: 'Foto' },
    compartir:
      'Te mando uma pergunta do AlmaMundi: {pregunta} Eu adoraria que você me contasse: {enlace}',
    asunto: 'Uma pergunta para você',
  },
  en: {
    ceja: 'Questions that awaken stories',
    titulo: 'Pull a ribbon',
    bajada: 'Each ribbon holds questions about a moment in life.',
    tirar: 'Pull a ribbon',
    verTemas: 'See all themes',
    cuentaEn: 'Tell it in',
    otro: 'Another ribbon',
    mandar: 'Send it to someone',
    otros: 'How others told it',
    semana: 'Questions that awaken stories',
    cuentala: 'Tell it',
    nav: 'Questions',
    leyenda: 'Answers',
    elige: 'Pick a ribbon',
    entrada: 'What if you start with a question? Pull a ribbon',
    pill: 'What if you start with a question? Pull a ribbon',
    bloqueTitulo: 'Pull a ribbon',
    descubre: 'and discover the question it holds for you.',
    toca: 'Tap a ribbon',
    invita: 'Pick a question and answer it your way.',
    azar: 'or let chance choose',
    responde: 'Answer here',
    respondes: "You're answering:",
    anterior: 'Previous ribbons',
    siguiente: 'Next ribbons',
    formatos: { video: 'Video', audio: 'Audio', texto: 'Text', foto: 'Photo' },
    compartir:
      "Here's a question from AlmaMundi: {pregunta} I'd love for you to tell me: {enlace}",
    asunto: 'A question for you',
  },
};

export function enlacePregunta(id: string): string {
  return `${PUBLIC_SITE_ORIGIN}/preguntas?p=${encodeURIComponent(id)}`;
}

export function textoCompartirHilo(locale: AlmaLocale, pregunta: string, enlace: string): string {
  return HILOS_UI[locale].compartir.replace('{pregunta}', pregunta).replace('{enlace}', enlace);
}

/** La frase final del título va en negrita. En portugués e inglés son tres palabras. */
export function tituloHiloPartes(titulo: string): { antes: string; cierre: string } {
  const corte = titulo.lastIndexOf('? ');
  if (corte >= 0) {
    return {
      antes: titulo.slice(0, corte + 1),
      cierre: titulo.slice(corte + 2),
    };
  }
  const palabras = titulo.trim().split(/\s+/);
  return {
    antes: palabras.slice(0, -3).join(' '),
    cierre: palabras.slice(-3).join(' '),
  };
}
