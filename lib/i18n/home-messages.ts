import type { AlmaLocale } from '@/lib/i18n/locale';

export type HomeMessages = {
  navPurpose: string;
  navHow: string;
  navStories: string;
  /** Enlaces planos a formatos de historias (cabecera home). */
  navHistoriasVideos: string;
  navHistoriasAudios: string;
  navHistoriasEscrito: string;
  navHistoriasFotos: string;
  navMap: string;
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
  navHistoriasVideos: 'Videos',
  navHistoriasAudios: 'Audios',
  navHistoriasEscrito: 'Escritos',
  navHistoriasFotos: 'Fotografías',
  navMap: 'Mapa',
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
  heroBold: 'despiertan otras historias.',
  heroSubBefore: 'Aquí, cada relato importa.',
  heroSubBold: 'Cada historia es extraordinaria.',
  historiasLead1: 'Hay historias que solo tú puedes contar.',
  historiasLead2: 'Elige tu forma y cuéntala.',
  mapSectionTitle: 'El Alma del Mundo',
  cardVideoTitle: 'Tu historia,',
  cardVideoSubtitle: 'en primer plano',
  cardVideoBody:
    'Una cámara puede guardar un gesto, una pausa, una voz, una mirada.',
  cardVideoCta: 'Graba un video',
  cardAudioTitle: 'Dale voz',
  cardAudioSubtitle: 'a lo que recuerdas',
  cardAudioBody:
    'Hay historias que no necesitan verse. Solo necesitan ser escuchadas.',
  cardAudioCta: 'Graba un audio',
  cardWriteTitle: 'Ponle palabras',
  cardWriteSubtitle: 'a tu memoria',
  cardWriteBody:
    'Escribe una escena, una carta, una despedida o algo que todavía vuelve.',
  cardWriteCta: 'Escribe una historia',
  cardPhotoTitle: 'Una imagen,',
  cardPhotoSubtitle: 'una vida',
  cardPhotoBody: 'Sube una foto y cuenta la historia que guarda.',
  cardPhotoCta: 'Sube una foto',
};

const pt: HomeMessages = {
  navPurpose: 'Propósito',
  navHow: 'Como funciona?',
  navStories: 'Histórias',
  navHistoriasVideos: 'Vídeos',
  navHistoriasAudios: 'Áudios',
  navHistoriasEscrito: 'Escritos',
  navHistoriasFotos: 'Fotografias',
  navMap: 'Mapa',
  ariaOpenMenu: 'Abrir menu',
  ariaCloseMenu: 'Fechar menu',
  ariaCloseMenuBackdrop: 'Fechar menu',
  ariaMainNav: 'Navegação principal',
  ariaLanguage: 'Idioma do site',
  langShortEs: 'ES',
  langShortPt: 'PT',
  langShortEn: 'EN',
  heroBeforeBold:
    'AlmaMundi é o lugar onde as suas histórias não se perdem no scroll, mas sim',
  heroBold: 'despertam outras histórias.',
  heroSubBefore: 'Aqui, cada relato importa.',
  heroSubBold: 'Cada história é extraordinária.',
  historiasLead1: 'Há histórias que só você pode contar.',
  historiasLead2: 'Escolha a sua forma e conte.',
  mapSectionTitle: 'A Alma do Mundo',
  cardVideoTitle: 'A sua história,',
  cardVideoSubtitle: 'em primeiro plano',
  cardVideoBody:
    'Uma câmara pode guardar um gesto, uma pausa, uma voz, um olhar.',
  cardVideoCta: 'Grava um vídeo',
  cardAudioTitle: 'Dê voz',
  cardAudioSubtitle: 'ao que recorda',
  cardAudioBody:
    'Há histórias que não precisam de ser vistas. Só precisam de ser ouvidas.',
  cardAudioCta: 'Grava um áudio',
  cardWriteTitle: 'Dê palavras',
  cardWriteSubtitle: 'à sua memória',
  cardWriteBody:
    'Escreva uma cena, uma carta, um adeus ou algo que ainda volta.',
  cardWriteCta: 'Escreve uma história',
  cardPhotoTitle: 'Uma imagem,',
  cardPhotoSubtitle: 'uma vida',
  cardPhotoBody: 'Carregue uma foto e conte a história que ela guarda.',
  cardPhotoCta: 'Envia uma foto',
};

const en: HomeMessages = {
  navPurpose: 'Purpose',
  navHow: 'How it works',
  navStories: 'Stories',
  navHistoriasVideos: 'Videos',
  navHistoriasAudios: 'Audio',
  navHistoriasEscrito: 'Written',
  navHistoriasFotos: 'Photos',
  navMap: 'Map',
  ariaOpenMenu: 'Open menu',
  ariaCloseMenu: 'Close menu',
  ariaCloseMenuBackdrop: 'Close menu',
  ariaMainNav: 'Main navigation',
  ariaLanguage: 'Site language',
  langShortEs: 'ES',
  langShortPt: 'PT',
  langShortEn: 'EN',
  heroBeforeBold:
    'AlmaMundi is the place where your stories don’t get lost in the scroll—instead,',
  heroBold: 'they awaken other stories.',
  heroSubBefore: 'Here, every story matters.',
  heroSubBold: 'Every story is extraordinary.',
  historiasLead1: 'There are stories only you can tell.',
  historiasLead2: 'Choose how, and tell yours.',
  mapSectionTitle: 'The Soul of the World',
  cardVideoTitle: 'Your story,',
  cardVideoSubtitle: 'center stage',
  cardVideoBody:
    'A camera can hold a gesture, a pause, a voice, a look.',
  cardVideoCta: 'Record a video',
  cardAudioTitle: 'Give voice',
  cardAudioSubtitle: 'to what you remember',
  cardAudioBody:
    'Some stories don’t need to be seen. They only need to be heard.',
  cardAudioCta: 'Record audio',
  cardWriteTitle: 'Put words',
  cardWriteSubtitle: 'to your memory',
  cardWriteBody:
    'Write a scene, a letter, a farewell—or something that still comes back.',
  cardWriteCta: 'Write a story',
  cardPhotoTitle: 'One image,',
  cardPhotoSubtitle: 'one life',
  cardPhotoBody: 'Upload a photo and tell the story it holds.',
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
