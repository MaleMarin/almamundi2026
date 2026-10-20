import type { Metadata } from 'next';

export const CONTAR_FORMATS = ['video', 'audio', 'foto', 'texto'] as const;
export type ContarFormat = (typeof CONTAR_FORMATS)[number];

const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'AlmaMundi — historias de vida en video, audio, escrito y foto',
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

export function contarHref(format: ContarFormat): string {
  return `/contar/${format}`;
}

export function modeFromContarFormat(format: ContarFormat): ContarFormat {
  return format;
}

export function contarMetadata(kind: ContarFormat | 'index'): Metadata {
  const { title, description } = CONTAR_META[kind];
  return {
    title,
    description,
    openGraph: {
      title: `${title} · AlmaMundi`,
      description,
      type: 'website',
      locale: 'es_CL',
      siteName: 'AlmaMundi',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · AlmaMundi`,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
