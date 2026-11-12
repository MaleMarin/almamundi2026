import type { AlmaLocale } from '@/lib/i18n/locale';

/**
 * Página institucional /proposito (es), /pt/proposito y /en/proposito.
 * Aquí van el título, los metadatos y los enlaces. Los bloques están en lib/i18n/proposito-guia.ts.
 */

export type PropositoPaginaCopy = {
  metaTitulo: string;
  metaDescripcion: string;
  marca: string;
  titulo: string;
  enlacesTitulo: string;
  enlaces: { precisar: string; terminos: string; privacidad: string; contacto: string };
  idiomasAria: string;
};

export const PROPOSITO_PAGINA: Record<AlmaLocale, PropositoPaginaCopy> = {
  es: {
    metaTitulo: 'Cómo funciona AlmaMundi: cuenta tu historia y conoce otras',
    metaDescripcion:
      'AlmaMundi es una iniciativa sin fines de lucro de Fundación Democracia Abierta, desarrollada por Precisar, para compartir historias personales en texto, audio, video o fotografía y conocer las de otras personas.',
    marca: 'AlmaMundi',
    titulo: 'Cómo funciona AlmaMundi',
    enlacesTitulo: 'Documentos y contacto',
    enlaces: { precisar: 'Precisar', terminos: 'Términos de uso', privacidad: 'Aviso de privacidad', contacto: 'Contacto' },
    idiomasAria: 'Idioma de esta página',
  },
  pt: {
    metaTitulo: 'Como funciona o AlmaMundi: conte sua história e conheça outras',
    metaDescripcion:
      'O AlmaMundi é uma iniciativa sem fins lucrativos da Fundación Democracia Abierta, desenvolvida pela Precisar, para compartilhar histórias pessoais em texto, áudio, vídeo ou fotografia e conhecer as de outras pessoas.',
    marca: 'AlmaMundi',
    titulo: 'Como funciona o AlmaMundi',
    enlacesTitulo: 'Documentos e contato',
    enlaces: { precisar: 'Precisar', terminos: 'Termos de uso', privacidad: 'Aviso de privacidade', contacto: 'Contato' },
    idiomasAria: 'Idioma desta página',
  },
  en: {
    metaTitulo: 'How AlmaMundi works: tell your story and discover others',
    metaDescripcion:
      'AlmaMundi is a nonprofit initiative of Fundación Democracia Abierta, developed by Precisar, where people share personal stories in text, audio, video, or photography and discover the stories of others.',
    marca: 'AlmaMundi',
    titulo: 'How AlmaMundi works',
    enlacesTitulo: 'Documents and contact',
    enlaces: { precisar: 'Precisar', terminos: 'Terms of use', privacidad: 'Privacy notice', contacto: 'Contact' },
    idiomasAria: 'Language of this page',
  },
};

/** Ruta de la página institucional en cada idioma. */
export const PROPOSITO_RUTAS: Record<AlmaLocale, string> = {
  es: '/proposito',
  pt: '/pt/proposito',
  en: '/en/proposito',
};

export function propositoHref(locale: AlmaLocale): string {
  return PROPOSITO_RUTAS[locale];
}

/** true si la ruta es una de las tres versiones de la página institucional. */
export function esRutaProposito(pathname: string | null | undefined): boolean {
  const p = (pathname ?? '').replace(/\/$/, '');
  return p === '/proposito' || p === '/pt/proposito' || p === '/en/proposito';
}

/** Texto del enlace del modal hacia la página. */
export const PROPOSITO_LEER_MAS: Record<AlmaLocale, string> = {
  es: 'Leer más',
  pt: 'Ler mais',
  en: 'Read more',
};
