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
  respondes: string;
  formatos: Formatos;
  compartir: string;
  asunto: string;
};

export const HILOS_UI: Record<AlmaLocale, HilosCopy> = {
  es: {
    ceja: 'Preguntas que despiertan historias',
    titulo: '¿No sabes por dónde empezar? Tira de un hilo.',
    bajada:
      'Cada hilo guarda preguntas sobre un pedazo de la vida. Elige uno, o deja que el azar elija por ti.',
    tirar: 'Tira de un hilo',
    verTemas: 'Ver todos los temas',
    cuentaEn: 'Cuéntala en',
    otro: 'Otro hilo',
    mandar: 'Mándasela a alguien',
    otros: 'Así la contaron otros',
    semana: 'Preguntas que despiertan historias',
    cuentala: 'Cuéntala',
    nav: 'Preguntas',
    leyenda: 'Historias que nacieron de un hilo',
    elige: 'Elige un hilo',
    entrada: '¿No sabes por dónde empezar? Tira de un hilo',
    respondes: 'Respondes a:',
    formatos: { video: 'Video', audio: 'Audio', texto: 'Texto', foto: 'Foto' },
    compartir:
      'Te mando una pregunta de AlmaMundi: {pregunta} Me encantaría que me la contaras: {enlace}',
    asunto: 'Una pregunta para ti',
  },
  pt: {
    ceja: 'Perguntas que despertam histórias',
    titulo: 'Não sabe por onde começar? Puxe um fio.',
    bajada:
      'Cada fio guarda perguntas sobre um pedaço da vida. Escolha um, ou deixe o acaso escolher por você.',
    tirar: 'Puxe um fio',
    verTemas: 'Ver todos os temas',
    cuentaEn: 'Conte em',
    otro: 'Outro fio',
    mandar: 'Mande para alguém',
    otros: 'Assim outras pessoas contaram',
    semana: 'Perguntas que despertam histórias',
    cuentala: 'Conte',
    nav: 'Perguntas',
    leyenda: 'Histórias que nasceram de um fio',
    elige: 'Escolha um fio',
    entrada: 'Não sabe por onde começar? Puxe um fio',
    respondes: 'Você está respondendo:',
    formatos: { video: 'Vídeo', audio: 'Áudio', texto: 'Texto', foto: 'Foto' },
    compartir:
      'Te mando uma pergunta do AlmaMundi: {pregunta} Eu adoraria que você me contasse: {enlace}',
    asunto: 'Uma pergunta para você',
  },
  en: {
    ceja: 'Questions that awaken stories',
    titulo: 'Not sure where to start? Pull a thread.',
    bajada:
      'Each thread holds questions about a piece of life. Pick one, or let chance pick for you.',
    tirar: 'Pull a thread',
    verTemas: 'See all themes',
    cuentaEn: 'Tell it in',
    otro: 'Another thread',
    mandar: 'Send it to someone',
    otros: 'How others told it',
    semana: 'Questions that awaken stories',
    cuentala: 'Tell it',
    nav: 'Questions',
    leyenda: 'Stories born from a thread',
    elige: 'Pick a thread',
    entrada: 'Not sure where to start? Pull a thread',
    respondes: "You're answering:",
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
