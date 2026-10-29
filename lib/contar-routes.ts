import type { Metadata } from 'next';
import { parseAlmaLocale, type AlmaLocale } from '@/lib/i18n/locale';
import { isQuestionMode, resolveQuestionId, type QuestionId, type QuestionMode } from '@/lib/pregunta-semana';

export const CONTAR_FORMATS = ['video', 'audio', 'foto', 'texto'] as const;
export type ContarFormat = (typeof CONTAR_FORMATS)[number];

const OG_ALT: Record<AlmaLocale, string> = {
  es: 'AlmaMundi, historias de vida en video, audio, texto y foto',
  pt: 'AlmaMundi, histórias de vida em vídeo, áudio, texto e foto',
  en: 'AlmaMundi, life stories in video, audio, text, and photo',
};

const OG_LOCALE: Record<AlmaLocale, string> = {
  es: 'es_CL',
  pt: 'pt_BR',
  en: 'en_US',
};

const CONTAR_SHARE_CARD: Record<AlmaLocale, { title: string; description: string }> = {
  es: {
    title: 'Cuenta tu historia en AlmaMundi',
    description: 'Tu historia, con tu voz, en el mapa del mundo.',
  },
  pt: {
    title: 'Conte sua história no AlmaMundi',
    description: 'Sua história, com sua voz, no mapa do mundo.',
  },
  en: {
    title: 'Tell your story on AlmaMundi',
    description: 'Your story, in your voice, on the map of the world.',
  },
};

const CONTAR_META: Record<
  AlmaLocale,
  Record<ContarFormat | 'index', { title: string; description: string }>
> = {
  es: {
    index: {
      title: 'Cuenta tu historia',
      description: 'Hay muchas formas de contar. Elige la tuya: video, audio, foto o texto.',
    },
    video: {
      title: 'Graba el momento que todavía vive en ti',
      description: 'Tu historia merece verse. Hasta 5 minutos de video.',
    },
    audio: {
      title: 'Hay historias que se cuentan mejor en voz alta',
      description: 'Tu voz guarda lo que las palabras escritas no siempre pueden. Hasta 5 minutos de audio.',
    },
    foto: {
      title: 'Una imagen puede guardar lo que las palabras no alcanzan',
      description: 'Hasta 10 MB por foto.',
    },
    texto: {
      title: 'Escribe lo que no le contaste a nadie',
      description: 'Aquí no se pierde en el scroll. Queda. Hasta 5000 caracteres.',
    },
  },
  pt: {
    index: {
      title: 'Conte sua história',
      description: 'Há muitas formas de contar. Escolha a sua: vídeo, áudio, foto ou texto.',
    },
    video: {
      title: 'Grave o momento que ainda vive em você',
      description: 'Sua história merece ser vista. Até 5 minutos de vídeo.',
    },
    audio: {
      title: 'Há histórias que se contam melhor em voz alta',
      description: 'Sua voz guarda o que as palavras escritas nem sempre podem. Até 5 minutos de áudio.',
    },
    foto: {
      title: 'Uma imagem pode guardar o que as palavras não alcançam',
      description: 'Até 10 MB por foto.',
    },
    texto: {
      title: 'Escreva o que você não contou a ninguém',
      description: 'Aqui não se perde no scroll. Fica. Até 5000 caracteres.',
    },
  },
  en: {
    index: {
      title: 'Tell your story',
      description: 'There are many ways to tell it. Choose yours: video, audio, photo, or text.',
    },
    video: {
      title: 'Record the moment that still lives in you',
      description: 'Your story deserves to be seen. Up to 5 minutes of video.',
    },
    audio: {
      title: 'Some stories are best told out loud',
      description: 'Your voice holds what written words cannot always carry. Up to 5 minutes of audio.',
    },
    foto: {
      title: 'An image can hold what words cannot reach',
      description: 'Up to 10 MB per photo.',
    },
    texto: {
      title: 'Write what you never told anyone',
      description: "Here, it doesn't get lost in the scroll. It stays. Up to 5,000 characters.",
    },
  },
};

export function isContarFormat(value: string | undefined | null): value is ContarFormat {
  return CONTAR_FORMATS.includes(value as ContarFormat);
}

export function parseContarFormat(pathname: string): ContarFormat | null {
  const match = pathname.match(/^\/contar\/([^/]+)\/?$/);
  if (!match) return null;
  return isContarFormat(match[1]) ? match[1] : null;
}

export type ContarPregunta = { id: QuestionId; mode: QuestionMode };

export function preguntaFromSearch(params: { get(name: string): string | null }): ContarPregunta | null {
  const id = resolveQuestionId(params.get('pregunta'));
  const mode = params.get('modo');
  if (!id || !isQuestionMode(mode)) return null;
  return { id, mode };
}

function withPregunta(path: string, pregunta?: ContarPregunta | null): string {
  if (!pregunta) return path;
  const q = new URLSearchParams({ pregunta: pregunta.id, modo: pregunta.mode });
  return `${path}?${q.toString()}`;
}

export function contarIndexHref(pregunta?: ContarPregunta | null): string {
  return withPregunta('/contar', pregunta);
}

export function contarHref(format: ContarFormat, pregunta?: ContarPregunta | null): string {
  return withPregunta(`/contar/${format}`, pregunta);
}

export function modeFromContarFormat(format: ContarFormat): ContarFormat {
  return format;
}

export function contarMetadata(kind: ContarFormat | 'index', rawLocale?: string | null): Metadata {
  const locale = parseAlmaLocale(rawLocale);
  const { title, description } = CONTAR_META[locale][kind];
  const card = CONTAR_SHARE_CARD[locale];
  const socialTitle = kind === 'index' ? card.title : `${title} · AlmaMundi`;
  const socialDescription = kind === 'index' ? card.description : description;
  const image = {
    url: '/og-image.png',
    width: 1200,
    height: 630,
    alt: OG_ALT[locale],
  };
  return {
    title,
    description,
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url: './',
      type: 'website',
      locale: OG_LOCALE[locale],
      siteName: 'AlmaMundi',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: socialDescription,
      images: [image.url],
    },
  };
}
