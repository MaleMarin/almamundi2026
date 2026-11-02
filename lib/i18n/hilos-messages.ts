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
  volver: string;
  pista: string;
  indice: string;
  escribir: string;
  contarVoz: string;
  conFoto: string;
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
    titulo: 'Elige un tema',
    bajada: 'y descubre las preguntas que guarda para ti.',
    tirar: 'Preguntas para ti',
    verTemas: 'Ver todos los temas',
    cuentaEn: 'Cuéntala en',
    otro: 'Otra cinta',
    mandar: 'Mándasela a alguien',
    otros: 'Así la contaron otros',
    semana: 'Preguntas que despiertan historias',
    cuentala: 'Cuéntala',
    nav: 'Preguntas para ti',
    leyenda: 'Así respondieron',
    elige: 'Elige una cinta',
    entrada: 'Empieza por una pregunta: toca una cinta',
    pill: 'Empieza por una pregunta: toca una cinta',
    bloqueTitulo: 'Elige un tema',
    descubre: 'y descubre las preguntas que guarda para ti.',
    toca: 'Toca una cinta',
    invita: 'Elige una pregunta y respóndela como quieras.',
    azar: 'o deja que el azar elija',
    volver: '← Volver a los temas',
    pista: 'Pasa el mouse por la cortina y toca una cinta, o elige un tema aquí:',
    indice: 'Toca una pregunta y elige cómo responderla.',
    escribir: 'Escríbela',
    contarVoz: 'Cuéntala con tu voz',
    conFoto: 'Con una foto',
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
    titulo: 'Escolha um tema',
    bajada: 'e descubra as perguntas que ele guarda para você.',
    tirar: 'Perguntas para você',
    verTemas: 'Ver todos os temas',
    cuentaEn: 'Conte em',
    otro: 'Outra fita',
    mandar: 'Mande para alguém',
    otros: 'Assim outras pessoas contaram',
    semana: 'Perguntas que despertam histórias',
    cuentala: 'Conte',
    nav: 'Perguntas para você',
    leyenda: 'Assim responderam',
    elige: 'Escolha uma fita',
    entrada: 'Comece por uma pergunta: toque uma fita',
    pill: 'Comece por uma pergunta: toque uma fita',
    bloqueTitulo: 'Escolha um tema',
    descubre: 'e descubra as perguntas que ele guarda para você.',
    toca: 'Toque em uma fita',
    invita: 'Escolha uma pergunta e responda do seu jeito.',
    azar: 'ou deixe o acaso escolher',
    volver: '← Voltar aos temas',
    pista: 'Passe o mouse pela cortina e toque em uma fita, ou escolha um tema aqui:',
    indice: 'Toque em uma pergunta e escolha como responder.',
    escribir: 'Escreva',
    contarVoz: 'Conte com a sua voz',
    conFoto: 'Com uma foto',
    responde: 'Responda aqui',
    respondes: 'Você está respondendo:',
    anterior: 'Fitas anteriores',
    siguiente: 'Fitas seguintes',
    formatos: { video: 'Vídeo', audio: 'Áudio', texto: 'Texto', foto: 'Foto' },
    compartir:
      'Te mando uma pergunta do AlmaMundi: {pregunta} Eu adoraria que você me contasse: {enlace}',
    asunto: 'Uma pergunta para você',
  },
  en: {
    ceja: 'Questions that awaken stories',
    titulo: 'Choose a theme',
    bajada: 'and discover the questions it holds for you.',
    tirar: 'Questions for you',
    verTemas: 'See all themes',
    cuentaEn: 'Tell it in',
    otro: 'Another ribbon',
    mandar: 'Send it to someone',
    otros: 'How others told it',
    semana: 'Questions that awaken stories',
    cuentala: 'Tell it',
    nav: 'Questions for you',
    leyenda: 'How they answered',
    elige: 'Pick a ribbon',
    entrada: 'Start with a question: tap a ribbon',
    pill: 'Start with a question: tap a ribbon',
    bloqueTitulo: 'Choose a theme',
    descubre: 'and discover the questions it holds for you.',
    toca: 'Tap a ribbon',
    invita: 'Pick a question and answer it your way.',
    azar: 'or let chance choose',
    volver: '← Back to the themes',
    pista: 'Hover over the curtain and tap a ribbon, or choose a theme here:',
    indice: 'Tap a question and choose how to answer.',
    escribir: 'Write it',
    contarVoz: 'Tell it with your voice',
    conFoto: 'With a photo',
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
