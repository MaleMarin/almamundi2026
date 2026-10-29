import type { AlmaLocale } from '@/lib/i18n/locale';

export type HomeMessages = {
  navPurpose: string;
  navHow: string;
  navStories: string;
  /** Enlaces planos a formatos de historias (cabecera home). */
  navHistoriasColeccion: string;
  navHistoriasVideos: string;
  navHistoriasAudios: string;
  navHistoriasEscrito: string;
  navHistoriasFotos: string;
  navMap: string;
  /** Acción principal: enviar una historia. */
  navTellStory: string;
  ariaOpenMenu: string;
  ariaCloseMenu: string;
  ariaCloseMenuBackdrop: string;
  ariaMainNav: string;
  ariaLanguage: string;
  langShortEs: string;
  langShortPt: string;
  langShortEn: string;
  heroBeforeBold: string;
  heroBold: string;
  heroSubBefore: string;
  heroSubBold: string;
  /** Encima de las cuatro cards (#historias): primera frase + segunda frase. */
  historiasLead1: string;
  historiasLead2: string;
  /** Segunda línea de la frase naranja (misma familia y color que `historiasLead2`). */
  historiasLead2b: string;
  /** Título grande sobre la sección del mapa (home #mapa y cabecera /mapa). */
  mapSectionTitle: string;
  cardVideoTitle: string;
  cardVideoSubtitle: string;
  cardVideoBody: string;
  cardVideoCta: string;
  cardAudioTitle: string;
  cardAudioSubtitle: string;
  cardAudioBody: string;
  cardAudioCta: string;
  cardWriteTitle: string;
  cardWriteSubtitle: string;
  cardWriteBody: string;
  cardWriteCta: string;
  cardPhotoTitle: string;
  cardPhotoSubtitle: string;
  cardPhotoBody: string;
  cardPhotoCta: string;
};

const es: HomeMessages = {
  navPurpose: 'Propósito',
  navHow: '¿Cómo funciona?',
  navStories: 'Historias',
  navHistoriasColeccion: 'Mi colección',
  navHistoriasVideos: 'Videos',
  navHistoriasAudios: 'Audios',
  navHistoriasEscrito: 'Textos',
  navHistoriasFotos: 'Fotos',
  navMap: 'Mapa',
  navTellStory: 'Cuenta tu historia',
  ariaOpenMenu: 'Abrir menú',
  ariaCloseMenu: 'Cerrar menú',
  ariaCloseMenuBackdrop: 'Cerrar menú',
  ariaMainNav: 'Navegación principal',
  ariaLanguage: 'Idioma del sitio',
  langShortEs: 'ES',
  langShortPt: 'PT',
  langShortEn: 'EN',
  heroBeforeBold:
    'AlmaMundi es el lugar donde tus historias no se pierden en el scroll, sino que',
  heroBold: 'despiertan otras historias',
  heroSubBefore: 'Aquí, cada relato importa.',
  heroSubBold: 'Cada historia es extraordinaria.',
  historiasLead1: 'Hay historias que solo tú puedes contar.',
  historiasLead2: 'Hay muchas formas de contar',
  historiasLead2b: 'Elige la tuya',
  mapSectionTitle: 'El Alma del Mundo',
  cardVideoTitle: 'Tu historia,',
  cardVideoSubtitle: 'en primer plano',
  cardVideoBody:
    'Un gesto, una pausa, una mirada. Todo cabe en una cámara. Hasta 5 minutos.',
  cardVideoCta: 'Graba un video',
  cardAudioTitle: 'Dale voz',
  cardAudioSubtitle: 'a lo que recuerdas',
  cardAudioBody:
    'Hay historias que no necesitan verse, solo ser escuchadas. Hasta 5 minutos.',
  cardAudioCta: 'Graba un audio',
  cardWriteTitle: 'Ponle palabras',
  cardWriteSubtitle: 'a tu memoria',
  cardWriteBody:
    'Hay historias que no necesitan sonido ni imagen, solo palabras. Hasta 5000 caracteres.',
  cardWriteCta: 'Escribe una historia',
  cardPhotoTitle: 'Una imagen,',
  cardPhotoSubtitle: 'una vida',
  cardPhotoBody: 'Una foto guarda más de lo que se ve a simple vista. Hasta 8 fotos.',
  cardPhotoCta: 'Sube una foto',
};

const pt: HomeMessages = {
  navPurpose: 'Propósito',
  navHow: 'Como funciona?',
  navStories: 'Histórias',
  navHistoriasColeccion: 'Minha coleção',
  navHistoriasVideos: 'Vídeos',
  navHistoriasAudios: 'Áudios',
  navHistoriasEscrito: 'Textos',
  navHistoriasFotos: 'Fotos',
  navMap: 'Mapa',
  navTellStory: 'Conte sua história',
  ariaOpenMenu: 'Abrir menu',
  ariaCloseMenu: 'Fechar menu',
  ariaCloseMenuBackdrop: 'Fechar menu',
  ariaMainNav: 'Navegação principal',
  ariaLanguage: 'Idioma do site',
  langShortEs: 'ES',
  langShortPt: 'PT',
  langShortEn: 'EN',
  heroBeforeBold:
    'AlmaMundi é o lugar onde suas histórias não se perdem no scroll, e sim',
  heroBold: 'despertam outras histórias',
  heroSubBefore: 'Aqui, cada relato importa.',
  heroSubBold: 'Cada história é extraordinária.',
  historiasLead1: 'Há histórias que só você pode contar.',
  historiasLead2: 'Há muitas formas de contar',
  historiasLead2b: 'Escolha a sua',
  mapSectionTitle: 'A Alma do Mundo',
  cardVideoTitle: 'Sua história,',
  cardVideoSubtitle: 'em primeiro plano',
  cardVideoBody:
    'Um gesto, uma pausa, um olhar. Tudo cabe em uma câmera. Até 5 minutos.',
  cardVideoCta: 'Grave um vídeo',
  cardAudioTitle: 'Dê voz',
  cardAudioSubtitle: 'ao que você lembra',
  cardAudioBody:
    'Há histórias que não precisam ser vistas, só ouvidas. Até 5 minutos.',
  cardAudioCta: 'Grave um áudio',
  cardWriteTitle: 'Dê palavras',
  cardWriteSubtitle: 'à sua memória',
  cardWriteBody:
    'Há histórias que não precisam de som nem imagem, só de palavras. Até 5000 caracteres.',
  cardWriteCta: 'Escreva uma história',
  cardPhotoTitle: 'Uma imagem,',
  cardPhotoSubtitle: 'uma vida',
  cardPhotoBody: 'Uma foto guarda mais do que se vê à primeira vista. Até 8 fotos.',
  cardPhotoCta: 'Envie uma foto',
};

const en: HomeMessages = {
  navPurpose: 'Purpose',
  navHow: 'How does it work?',
  navStories: 'Stories',
  navHistoriasColeccion: 'My collection',
  navHistoriasVideos: 'Videos',
  navHistoriasAudios: 'Audios',
  navHistoriasEscrito: 'Texts',
  navHistoriasFotos: 'Photos',
  navMap: 'Map',
  navTellStory: 'Tell your story',
  ariaOpenMenu: 'Open menu',
  ariaCloseMenu: 'Close menu',
  ariaCloseMenuBackdrop: 'Close menu',
  ariaMainNav: 'Main navigation',
  ariaLanguage: 'Site language',
  langShortEs: 'ES',
  langShortPt: 'PT',
  langShortEn: 'EN',
  heroBeforeBold:
    "AlmaMundi is where your stories don't get lost in the scroll, they",
  heroBold: 'awaken other stories',
  heroSubBefore: 'Here, every story matters.',
  heroSubBold: 'Every story is extraordinary.',
  historiasLead1: 'There are stories only you can tell.',
  historiasLead2: 'There are many ways to tell it',
  historiasLead2b: 'Choose yours',
  mapSectionTitle: 'The Soul of the World',
  cardVideoTitle: 'Your story,',
  cardVideoSubtitle: 'center stage',
  cardVideoBody:
    'A gesture, a pause, a look. It all fits in a camera. Up to 5 minutes.',
  cardVideoCta: 'Record a video',
  cardAudioTitle: 'Give voice',
  cardAudioSubtitle: 'to what you remember',
  cardAudioBody:
    "Some stories don't need to be seen, only heard. Up to 5 minutes.",
  cardAudioCta: 'Record an audio',
  cardWriteTitle: 'Put words',
  cardWriteSubtitle: 'to your memory',
  cardWriteBody:
    'Some stories need no sound or image, only words. Up to 5,000 characters.',
  cardWriteCta: 'Write a story',
  cardPhotoTitle: 'One image,',
  cardPhotoSubtitle: 'one life',
  cardPhotoBody: 'A photo holds more than meets the eye. Up to 8 photos.',
  cardPhotoCta: 'Upload a photo',
};

export const HOME_MESSAGES: Record<AlmaLocale, HomeMessages> = { es, pt, en };

export type NoscriptCopy = { title: string; p: string; link: string };

export const NOSCRIPT_BY_LOCALE: Record<AlmaLocale, NoscriptCopy> = {
  es: {
    title: 'AlmaMundi',
    p: 'Necesitas JavaScript para ver el sitio.',
    link: 'Ir al inicio',
  },
  pt: {
    title: 'AlmaMundi',
    p: 'Precisa de JavaScript para ver o site.',
    link: 'Ir ao início',
  },
  en: {
    title: 'AlmaMundi',
    p: 'You need JavaScript to view this site.',
    link: 'Go to home',
  },
};

export function storiesLinkLabel(t: HomeMessages, href: string): string {
  switch (href) {
    case '/historias/mi-coleccion':
      return t.navHistoriasColeccion;
    case '/historias/videos':
      return t.navHistoriasVideos;
    case '/historias/audios':
      return t.navHistoriasAudios;
    case '/historias/escrito':
      return t.navHistoriasEscrito;
    case '/historias/fotos':
      return t.navHistoriasFotos;
    default:
      return href;
  }
}
