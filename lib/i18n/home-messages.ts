import type { AlmaLocale } from '@/lib/i18n/locale';

export type HomeMessages = {
  navPurpose: string;
  navHow: string;
  navStories: string;
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
  /** Enlace bajo el hero: abre el texto editorial del propósito. */
  heroPurposeCta: string;
  cardVideoTitle: string;
  cardVideoSubtitle: string;
  cardVideoBefore: string;
  cardVideoStrong: string;
  cardVideoAfter: string;
  cardVideoCta: string;
  cardAudioTitle: string;
  cardAudioSubtitle: string;
  cardAudioBefore: string;
  cardAudioStrong: string;
  cardAudioAfter: string;
  cardAudioCta: string;
  cardWriteTitle: string;
  cardWriteSubtitle: string;
  cardWriteBefore: string;
  cardWriteStrong: string;
  cardWriteAfter: string;
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
  heroPurposeCta: 'Leer nuestro propósito',
  cardVideoTitle: 'Tu historia,',
  cardVideoSubtitle: 'en primer plano',
  cardVideoBefore: 'A veces, una mirada lo dice todo. Anímate a ',
  cardVideoStrong: 'grabar ese momento que te marcó',
  cardVideoAfter: ', una experiencia que viviste o que alguien más te contó.',
  cardVideoCta: 'GRABA TU VIDEO',
  cardAudioTitle: 'Dale voz',
  cardAudioSubtitle: 'a tu recuerdo',
  cardAudioBefore: 'Hay historias que se sienten mejor cuando solo se escuchan. ',
  cardAudioStrong: 'Graba tu relato en audio',
  cardAudioAfter: ' y deja que tu voz haga el resto.',
  cardAudioCta: 'GRABA TU AUDIO',
  cardWriteTitle: 'Ponle palabras',
  cardWriteSubtitle: 'a tu historia',
  cardWriteBefore: 'Si lo tuyo es escribir, este es tu lugar. Tómate un respiro y ',
  cardWriteStrong: 'cuenta tu historia a tu ritmo',
  cardWriteAfter: ', palabra por palabra.',
  cardWriteCta: 'ESCRIBE TU HISTORIA',
  cardPhotoTitle: 'Educación mediática,',
  cardPhotoSubtitle: 'leer el mundo con criterio',
  cardPhotoBody:
    'Recursos y marcos para analizar la información, cuidar la ciudadanía digital y fortalecer el pensamiento crítico con respeto a los derechos humanos —en el aula y en la comunidad.',
  cardPhotoCta: 'IR A EDUCACIÓN MEDIÁTICA',
};

const pt: HomeMessages = {
  navPurpose: 'Propósito',
  navHow: 'Como funciona?',
  navStories: 'Histórias',
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
  heroPurposeCta: 'Ler o nosso propósito',
  cardVideoTitle: 'A sua história,',
  cardVideoSubtitle: 'em primeiro plano',
  cardVideoBefore: 'Às vezes, um olhar diz tudo. Anime-se a ',
  cardVideoStrong: 'gravar esse momento que marcou',
  cardVideoAfter: ', uma experiência que viveu ou que alguém lhe contou.',
  cardVideoCta: 'GRAVE O SEU VÍDEO',
  cardAudioTitle: 'Dê voz',
  cardAudioSubtitle: 'à sua memória',
  cardAudioBefore: 'Há histórias que ficam melhor quando só se ouvem. ',
  cardAudioStrong: 'Grave o seu relato em áudio',
  cardAudioAfter: ' e deixe a sua voz fazer o resto.',
  cardAudioCta: 'GRAVE O SEU ÁUDIO',
  cardWriteTitle: 'Dê palavras',
  cardWriteSubtitle: 'à sua história',
  cardWriteBefore: 'Se o seu jeito é escrever, este é o seu lugar. Respire fundo e ',
  cardWriteStrong: 'conte a sua história ao seu ritmo',
  cardWriteAfter: ', palavra por palavra.',
  cardWriteCta: 'ESCREVA A SUA HISTÓRIA',
  cardPhotoTitle: 'Educação mediática,',
  cardPhotoSubtitle: 'ler o mundo com critério',
  cardPhotoBody:
    'Recursos e referenciais para analisar informação, cuidar da cidadania digital e fortalecer o pensamento crítico no respeito pelos direitos humanos — na sala de aula e na comunidade.',
  cardPhotoCta: 'IR À EDUCAÇÃO MEDIÁTICA',
};

const en: HomeMessages = {
  navPurpose: 'Purpose',
  navHow: 'How it works',
  navStories: 'Stories',
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
  heroPurposeCta: 'Read our purpose',
  cardVideoTitle: 'Your story,',
  cardVideoSubtitle: 'center stage',
  cardVideoBefore: 'Sometimes a look says it all. Go ahead and ',
  cardVideoStrong: 'record that moment that stayed with you',
  cardVideoAfter: '—something you lived through or someone shared with you.',
  cardVideoCta: 'RECORD YOUR VIDEO',
  cardAudioTitle: 'Give voice',
  cardAudioSubtitle: 'to your memory',
  cardAudioBefore: 'Some stories feel better when you only hear them. ',
  cardAudioStrong: 'Record your story in audio',
  cardAudioAfter: ' and let your voice do the rest.',
  cardAudioCta: 'RECORD YOUR AUDIO',
  cardWriteTitle: 'Put it into words',
  cardWriteSubtitle: 'for your story',
  cardWriteBefore: 'If writing is your thing, this is your place. Take a breath and ',
  cardWriteStrong: 'tell your story at your own pace',
  cardWriteAfter: ', word by word.',
  cardWriteCta: 'WRITE YOUR STORY',
  cardPhotoTitle: 'Media literacy,',
  cardPhotoSubtitle: 'read the world with judgment',
  cardPhotoBody:
    'Resources and frameworks to analyze information, nurture digital citizenship, and strengthen critical thinking in line with human rights—in classrooms and communities.',
  cardPhotoCta: 'GO TO MEDIA LITERACY',
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
