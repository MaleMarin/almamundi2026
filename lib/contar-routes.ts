import type { Metadata } from 'next';
import { isQuestionId, isQuestionMode, type QuestionId, type QuestionMode } from '@/lib/pregunta-semana';

export const CONTAR_FORMATS = ['video', 'audio', 'foto', 'texto'] as const;
export type ContarFormat = (typeof CONTAR_FORMATS)[number];

const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'AlmaMundi — historias de vida en video, audio, escrito y foto',
} as const;

/** Tarjeta que arman Facebook y LinkedIn al recibir solo el enlace de /contar. */
const CONTAR_SHARE_CARD = {
  title: 'Cuenta tu historia en AlmaMundi',
  description: 'Tu historia, con tu voz, en el mapa del mundo.',
} as const;

const CONTAR_META: Record<
  ContarFormat | 'index',
  { title: string; description: string }
> = {
  index: {
    title: 'Cuenta tu historia',
    description:
      'Hay muchas formas de contar una historia. Elige la tuya: video, audio, foto o texto.',
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
  const id = params.get('pregunta');
  const mode = params.get('modo');
  if (!isQuestionId(id) || !isQuestionMode(mode)) return null;
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

export function contarMetadata(kind: ContarFormat | 'index'): Metadata {
  const { title, description } = CONTAR_META[kind];
  const socialTitle = kind === 'index' ? CONTAR_SHARE_CARD.title : `${title} · AlmaMundi`;
  const socialDescription = kind === 'index' ? CONTAR_SHARE_CARD.description : description;
  return {
    title,
    description,
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      type: 'website',
      locale: 'es_CL',
      siteName: 'AlmaMundi',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: socialDescription,
      images: [OG_IMAGE.url],
    },
  };
}
