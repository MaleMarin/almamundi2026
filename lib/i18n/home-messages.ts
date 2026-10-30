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
  heroHand: string;
  heroGreetMorning: string;
  heroGreetAfternoon: string;
  heroGreetNight: string;
  heroGreetMorningPlace: string;
  heroGreetAfternoonPlace: string;
  heroGreetNightPlace: string;
  /** Saludo único, sin hora ni región. */
  heroShareToday: string;
  /** La frase en Caveat, en minúscula. */
  heroHandScript: string;
  /** Título de la hero, en dos líneas. La segunda va en negrita. */
  heroScrollBefore: string;
  heroScrollBold: string;
  /** Etiqueta sobre las tarjetas de formato. */
  formatChoose: string;
  heroSubBefore: string;
  heroSubBold: string;
  /** Encima de las cuatro cards (#historias): primera frase + segunda frase. */
  historiasLead1: string;
  historiasLead2: string;
  /** Segunda línea de la frase naranja (misma familia y color que `historiasLead2`). */
  historiasLead2b: string;
  /** Segunda línea bajo «Hay muchas formas de contar». */
  historiasLeadHow: string;
  /** Título grande sobre la sección del mapa (home #mapa y cabecera /mapa). */
  mapSectionTitle: string;
  /** Nota bajo el reloj del globo: sonido en el vacío y sonificación. */
  mapSpaceSoundNote: string;
  cardVideoTitle: string;
  cardVideoSubtitle: string;
  cardVideoBody: string;
  cardVideoCta: string;
  cardVideoLine: string;
  cardAudioTitle: string;
  cardAudioSubtitle: string;
  cardAudioBody: string;
  cardAudioCta: string;
  cardAudioLine: string;
  cardWriteTitle: string;
  cardWriteSubtitle: string;
  cardWriteBody: string;
  cardWriteCta: string;
  cardWriteLine: string;
  cardPhotoTitle: string;
  cardPhotoSubtitle: string;
  cardPhotoBody: string;
  cardPhotoCta: string;
  cardPhotoLine: string;
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
  heroHand: 'Como la tuya',
  heroGreetMorning: 'Buenos días. ¿Qué historia traes hoy?',
  heroGreetAfternoon: 'Buenas tardes. ¿Qué historia traes hoy?',
  heroGreetNight: 'Buenas noches. ¿Qué historia traes hoy?',
  heroGreetMorningPlace: 'Buenos días desde {lugar}. ¿Qué historia traes hoy?',
  heroGreetAfternoonPlace: 'Buenas tardes desde {lugar}. ¿Qué historia traes hoy?',
  heroGreetNightPlace: 'Buenas noches desde {lugar}. ¿Qué historia traes hoy?',
  heroShareToday: 'Hola, ¿qué historia vas a compartir hoy?',
  heroHandScript: 'como la tuya',
  heroScrollBefore: 'Aquí tus historias no se pierden en el scroll,',
  heroScrollBold: 'despiertan otras',
  formatChoose: 'Elige cómo contarla',
  heroSubBefore: 'Aquí, cada historia',
  heroSubBold: 'merece ser conocida',
  historiasLead1: 'Hay historias que solo tú puedes contar.',
  historiasLead2: 'Hay muchas formas de contar',
  historiasLead2b: 'Elige la tuya',
  historiasLeadHow: 'Elige cómo',
  mapSectionTitle: 'El Alma del Mundo',
  mapSpaceSoundNote:
    'En el espacio no hay sonido porque no hay aire que lo transmita. Para estudiar eventos como explosiones, los científicos convierten datos de telescopios en frecuencias audibles, un proceso llamado sonificación.',
  cardVideoTitle: 'Tu historia,',
  cardVideoSubtitle: 'en primer plano',
  cardVideoBody:
    'Un gesto, una pausa, una mirada. Todo cabe en una cámara.',
  cardVideoCta: 'Graba un video',
  cardVideoLine: 'Un gesto, una pausa, una mirada.',
  cardAudioTitle: 'Dale voz',
  cardAudioSubtitle: 'a lo que recuerdas',
  cardAudioBody:
    'Hay historias que no necesitan verse, solo ser escuchadas.',
  cardAudioCta: 'Graba un audio',
  cardAudioLine: 'Para historias que se escuchan.',
  cardWriteTitle: 'Ponle palabras',
  cardWriteSubtitle: 'a tu memoria',
  cardWriteBody:
    'Hay historias que no necesitan sonido ni imagen, solo palabras.',
  cardWriteCta: 'Escribe una historia',
  cardWriteLine: 'Cuando bastan las palabras.',
  cardPhotoTitle: 'Una imagen,',
  cardPhotoSubtitle: 'una vida',
  cardPhotoBody: 'Una foto guarda más de lo que se ve a simple vista.',
  cardPhotoCta: 'Sube una foto',
  cardPhotoLine: 'Una imagen guarda más de lo que se ve.',
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
  heroHand: 'como a sua',
  heroGreetMorning: 'Bom dia. Que história você traz hoje?',
  heroGreetAfternoon: 'Boa tarde. Que história você traz hoje?',
  heroGreetNight: 'Boa noite. Que história você traz hoje?',
  heroGreetMorningPlace: 'Bom dia em {lugar}. Que história você traz hoje?',
  heroGreetAfternoonPlace: 'Boa tarde em {lugar}. Que história você traz hoje?',
  heroGreetNightPlace: 'Boa noite em {lugar}. Que história você traz hoje?',
  heroShareToday: 'Olá, que história você vai compartilhar hoje?',
  heroHandScript: 'como a sua',
  heroScrollBefore: 'Aqui suas histórias não se perdem no scroll,',
  heroScrollBold: 'despertam outras',
  formatChoose: 'Escolha como contar',
  heroSubBefore: 'Aqui, cada história',
  heroSubBold: 'merece ser conhecida',
  historiasLead1: 'Há histórias que só você pode contar.',
  historiasLead2: 'Há muitas formas de contar',
  historiasLead2b: 'Escolha a sua',
  historiasLeadHow: 'Escolha como',
  mapSectionTitle: 'A Alma do Mundo',
  mapSpaceSoundNote:
    'No espaço não há som porque não há ar para transmiti-lo. Para estudar eventos como explosões, os cientistas convertem dados de telescópios em frequências audíveis, um processo chamado sonificação.',
  cardVideoTitle: 'Sua história,',
  cardVideoSubtitle: 'em primeiro plano',
  cardVideoBody:
    'Um gesto, uma pausa, um olhar. Tudo cabe em uma câmera.',
  cardVideoCta: 'Grave um vídeo',
  cardVideoLine: 'Um gesto, uma pausa, um olhar.',
  cardAudioTitle: 'Dê voz',
  cardAudioSubtitle: 'ao que você lembra',
  cardAudioBody:
    'Há histórias que não precisam ser vistas, só ouvidas.',
  cardAudioCta: 'Grave um áudio',
  cardAudioLine: 'Para histórias que se escutam.',
  cardWriteTitle: 'Dê palavras',
  cardWriteSubtitle: 'à sua memória',
  cardWriteBody:
    'Há histórias que não precisam de som nem imagem, só de palavras.',
  cardWriteCta: 'Escreva uma história',
  cardWriteLine: 'Quando as palavras bastam.',
  cardPhotoTitle: 'Uma imagem,',
  cardPhotoSubtitle: 'uma vida',
  cardPhotoBody: 'Uma foto guarda mais do que se vê à primeira vista.',
  cardPhotoCta: 'Envie uma foto',
  cardPhotoLine: 'Uma imagem guarda mais do que se vê.',
};

const en: HomeMessages = {
  navPurpose: 'Purpose',
  navHow: 'How does it work?',
  navStories: 'Stories',
  navHistoriasColeccion: 'My collection',
  navHistoriasVideos: 'Videos',
  navHistoriasAudios: 'Audio',
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
  heroHand: 'like yours',
  heroGreetMorning: 'Good morning. What story are you bringing today?',
  heroGreetAfternoon: 'Good afternoon. What story are you bringing today?',
  heroGreetNight: 'Good evening. What story are you bringing today?',
  heroGreetMorningPlace: 'Good morning in {place}. What story are you bringing today?',
  heroGreetAfternoonPlace: 'Good afternoon in {place}. What story are you bringing today?',
  heroGreetNightPlace: 'Good evening in {place}. What story are you bringing today?',
  heroShareToday: 'Hi, what story will you share today?',
  heroHandScript: 'like yours',
  heroScrollBefore: "Here your stories don't get lost in the scroll,",
  heroScrollBold: 'they awaken others',
  formatChoose: 'Choose how to tell it',
  heroSubBefore: 'Here, every story',
  heroSubBold: 'deserves to be known',
  historiasLead1: 'There are stories only you can tell.',
  historiasLead2: 'There are many ways to tell it',
  historiasLead2b: 'Choose yours',
  historiasLeadHow: 'Choose how',
  mapSectionTitle: 'The Soul of the World',
  mapSpaceSoundNote:
    'In space there is no sound because there is no air to carry it. To study events such as explosions, scientists turn telescope data into audible frequencies, a process called sonification.',
  cardVideoTitle: 'Your story,',
  cardVideoSubtitle: 'center stage',
  cardVideoBody:
    'A gesture, a pause, a look. It all fits in a camera.',
  cardVideoCta: 'Record a video',
  cardVideoLine: 'A gesture, a pause, a glance.',
  cardAudioTitle: 'Give voice',
  cardAudioSubtitle: 'to what you remember',
  cardAudioBody:
    "Some stories don't need to be seen, only heard.",
  cardAudioCta: 'Record audio',
  cardAudioLine: 'For stories meant to be heard.',
  cardWriteTitle: 'Put words',
  cardWriteSubtitle: 'to your memory',
  cardWriteBody:
    'Some stories need no sound or image, only words.',
  cardWriteCta: 'Write a story',
  cardWriteLine: 'When words are enough.',
  cardPhotoTitle: 'One image,',
  cardPhotoSubtitle: 'one life',
  cardPhotoBody: 'A photo holds more than meets the eye.',
  cardPhotoCta: 'Upload a photo',
  cardPhotoLine: 'A picture holds more than meets the eye.',
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
    p: 'Você precisa de JavaScript para ver o site.',
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
