import type { AlmaLocale } from '@/lib/i18n/locale';

export type FormatListTab = 'videos' | 'audios' | 'escrito' | 'fotos';
export type FormatContentMode = 'video' | 'audio' | 'texto' | 'foto';

export type FormatPagesCopy = {
  heroTitle: string;
  heroSubtitle: string;
  filterAria: string;
  filterTitle: string;
  country: string;
  year: string;
  allYears: string;
  keywords: string;
  keywordPlaceholder: string;
  clear: string;
  noMatch: string;
  showing: string;
  carouselAria: string;
  kicker: Record<FormatListTab, string>;
  expo: Record<FormatListTab, string>;
  shareLabel: string;
  shareText: string;
  countryAll: string;
  countrySearch: string;
  countrySearchAria: string;
  countryEmpty: string;
  narrator: string;
  open: Record<FormatContentMode, string>;
  unavailable: string;
  prevStory: string;
  nextStory: string;
  play: Record<FormatContentMode, string>;
  back: string;
  backStories: string;
  seeMoreStories: string;
  share: string;
  shareThisStory: string;
  moreStories: string;
  related: string;
  listen: string;
  photoPrev: string;
  photoNext: string;
  close: string;
  pause: string;
  playControl: string;
  back10: string;
  forward10: string;
  soundOn: string;
  mute: string;
  transcript: string;
  listenAgain: string;
  watchAgain: string;
  videoPlayer: string;
  captionEs: string;
  fullscreen: string;
  exitFullscreen: string;
  formatAudio: string;
  formatVideo: string;
  formatText: string;
  formatPhoto: string;
  formatStory: string;
  anonymous: string;
  photoCount: (n: number) => string;
  photoOf: (title: string) => string;
  albumPhoto: (title: string) => string;
  portrait: (name: string) => string;
  goToPhoto: (n: number) => string;
  playAudioTitle: (title: string) => string;
  playVideoTitle: (title: string) => string;
  readingMinutes: (n: string | number) => string;
  storyAria: (title: string) => string;
};

const es: FormatPagesCopy = {
  heroTitle: 'El mundo tiene millones de historias que nadie conoce.',
  heroSubtitle: 'Estas son algunas.',
  filterAria: 'Filtros de historias',
  filterTitle: 'Buscar por país, año o palabras clave',
  country: 'País',
  year: 'Año',
  allYears: 'Todos los años',
  keywords: 'Palabras clave',
  keywordPlaceholder: 'Buscar por título, ciudad o tema',
  clear: 'Limpiar filtros',
  noMatch:
    'Ninguna historia coincide con los filtros. El carrusel muestra las {count} historias disponibles. Ajusta los filtros o pulsa «Limpiar filtros».',
  showing: 'Mostrando {shown} de {total} historias.',
  carouselAria: 'Carrusel de historias',
  kicker: {
    videos: 'Historias en video',
    audios: 'Historias en audio',
    escrito: 'Historias en texto',
    fotos: 'Historias en foto',
  },
  expo: {
    videos: 'alma.mundi / historias en video',
    audios: 'alma.mundi / historias en audio',
    escrito: 'alma.mundi / historias en texto',
    fotos: 'alma.mundi / historias en foto',
  },
  shareLabel: 'Compartir',
  shareText: 'Compartir la historia con respeto: crédito a quien la cuenta, enlace y tarjeta descargable.',
  countryAll: 'Todos los países',
  countrySearch: 'Buscar país',
  countrySearchAria: 'Buscar en la lista de países',
  countryEmpty: 'Sin coincidencias',
  narrator: 'Narrador',
  open: {
    video: 'Ver historia',
    audio: 'Escuchar historia',
    texto: 'Leer historia',
    foto: 'Ver fotografías',
  },
  unavailable: 'Contenido no disponible en este formato',
  prevStory: 'Historia anterior',
  nextStory: 'Próxima historia',
  play: {
    video: 'Ver video',
    audio: 'Escuchar audio',
    texto: 'Leer historia',
    foto: 'Ver álbum de fotos',
  },
  back: '← Volver',
  backStories: '← Volver a las historias',
  seeMoreStories: '← Ver más historias',
  share: 'Compartir',
  shareThisStory: 'Compartir esta historia',
  moreStories: 'Más historias',
  related: 'Otras historias con un tono cercano',
  listen: 'Escuchar',
  photoPrev: 'Foto anterior',
  photoNext: 'Foto siguiente',
  close: 'Cerrar',
  pause: 'Pausar',
  playControl: 'Reproducir',
  back10: 'Atrás 10 s',
  forward10: 'Adelante 10 s',
  soundOn: 'Activar sonido',
  mute: 'Silenciar',
  transcript: 'Transcripción del audio',
  listenAgain: 'Escuchar de nuevo',
  watchAgain: 'Ver de nuevo',
  videoPlayer: 'Reproductor de video',
  captionEs: 'Español',
  fullscreen: 'Pantalla completa',
  exitFullscreen: 'Salir de pantalla completa',
  formatAudio: 'Audio',
  formatVideo: 'Video',
  formatText: 'Texto',
  formatPhoto: 'Foto',
  formatStory: 'Historia',
  anonymous: 'Anónimo',
  photoCount: (n) => (n === 1 ? '1 fotografía' : `${n} fotografías`),
  photoOf: (title) => `Fotografía de ${title}`,
  albumPhoto: (title) => `Foto del álbum: ${title}`,
  portrait: (name) => `Retrato de ${name}`,
  goToPhoto: (n) => `Ir a foto ${n}`,
  playAudioTitle: (title) => `Reproducir audio: ${title}`,
  playVideoTitle: (title) => `Reproducir video: ${title}`,
  readingMinutes: (n) => `${n} min de lectura`,
  storyAria: (title) => `Historia: ${title}`,
};

const pt: FormatPagesCopy = {
  heroTitle: 'O mundo tem milhões de histórias que ninguém conhece.',
  heroSubtitle: 'Estas são algumas.',
  filterAria: 'Filtros de histórias',
  filterTitle: 'Procurar por país, ano ou palavras-chave',
  country: 'País',
  year: 'Ano',
  allYears: 'Todos os anos',
  keywords: 'Palavras-chave',
  keywordPlaceholder: 'Buscar por título, cidade ou tema',
  clear: 'Limpar filtros',
  noMatch:
    'Nenhuma história coincide com os filtros. O carrossel mostra as {count} histórias disponíveis. Ajuste os filtros ou toque em «Limpar filtros».',
  showing: 'Mostrando {shown} de {total} histórias.',
  carouselAria: 'Carrossel de histórias',
  kicker: {
    videos: 'Histórias em vídeo',
    audios: 'Histórias em áudio',
    escrito: 'Histórias em texto',
    fotos: 'Histórias em foto',
  },
  expo: {
    videos: 'alma.mundi / histórias em vídeo',
    audios: 'alma.mundi / histórias em áudio',
    escrito: 'alma.mundi / histórias em texto',
    fotos: 'alma.mundi / histórias em foto',
  },
  shareLabel: 'Compartilhar',
  shareText: 'Compartilhar a história com respeito: crédito a quem conta, link e cartão para baixar.',
  countryAll: 'Todos os países',
  countrySearch: 'Buscar país',
  countrySearchAria: 'Buscar na lista de países',
  countryEmpty: 'Sem coincidências',
  narrator: 'Narrador',
  open: {
    video: 'Ver história',
    audio: 'Ouvir história',
    texto: 'Ler história',
    foto: 'Ver fotografias',
  },
  unavailable: 'Conteúdo indisponível neste formato',
  prevStory: 'História anterior',
  nextStory: 'Próxima história',
  play: {
    video: 'Ver vídeo',
    audio: 'Ouvir áudio',
    texto: 'Ler história',
    foto: 'Ver álbum de fotos',
  },
  back: '← Voltar',
  backStories: '← Voltar às histórias',
  seeMoreStories: '← Ver mais histórias',
  share: 'Compartilhar',
  shareThisStory: 'Compartilhar esta história',
  moreStories: 'Mais histórias',
  related: 'Outras histórias com um tom parecido',
  listen: 'Ouvir',
  photoPrev: 'Foto anterior',
  photoNext: 'Próxima foto',
  close: 'Fechar',
  pause: 'Pausar',
  playControl: 'Reproduzir',
  back10: 'Voltar 10 s',
  forward10: 'Avançar 10 s',
  soundOn: 'Ativar som',
  mute: 'Silenciar',
  transcript: 'Transcrição do áudio',
  listenAgain: 'Ouvir de novo',
  watchAgain: 'Ver de novo',
  videoPlayer: 'Reprodutor de vídeo',
  captionEs: 'Espanhol',
  fullscreen: 'Tela cheia',
  exitFullscreen: 'Sair da tela cheia',
  formatAudio: 'Áudio',
  formatVideo: 'Vídeo',
  formatText: 'Texto',
  formatPhoto: 'Foto',
  formatStory: 'História',
  anonymous: 'Anônimo',
  photoCount: (n) => (n === 1 ? '1 fotografia' : `${n} fotografias`),
  photoOf: (title) => `Fotografia de ${title}`,
  albumPhoto: (title) => `Foto do álbum: ${title}`,
  portrait: (name) => `Retrato de ${name}`,
  goToPhoto: (n) => `Ir para a foto ${n}`,
  playAudioTitle: (title) => `Reproduzir áudio: ${title}`,
  playVideoTitle: (title) => `Reproduzir vídeo: ${title}`,
  readingMinutes: (n) => `${n} min de leitura`,
  storyAria: (title) => `História: ${title}`,
};

const en: FormatPagesCopy = {
  heroTitle: 'The world holds millions of stories no one knows.',
  heroSubtitle: 'These are a few of them.',
  filterAria: 'Story filters',
  filterTitle: 'Search by country, year, or keywords',
  country: 'Country',
  year: 'Year',
  allYears: 'All years',
  keywords: 'Keywords',
  keywordPlaceholder: 'Search by title, city, or theme',
  clear: 'Clear filters',
  noMatch:
    'No stories match the filters. The carousel shows the {count} stories available. Adjust the filters or tap “Clear filters”.',
  showing: 'Showing {shown} of {total} stories.',
  carouselAria: 'Stories carousel',
  kicker: {
    videos: 'Stories in video',
    audios: 'Stories in audio',
    escrito: 'Stories in writing',
    fotos: 'Stories in photos',
  },
  expo: {
    videos: 'alma.mundi / stories in video',
    audios: 'alma.mundi / stories in audio',
    escrito: 'alma.mundi / stories in writing',
    fotos: 'alma.mundi / stories in photos',
  },
  shareLabel: 'Share',
  shareText: 'Share the story with care: credit the teller, a link, and a downloadable card.',
  countryAll: 'All countries',
  countrySearch: 'Search country',
  countrySearchAria: 'Search the country list',
  countryEmpty: 'No matches',
  narrator: 'Narrator',
  open: {
    video: 'See the story',
    audio: 'Listen to the story',
    texto: 'Read the story',
    foto: 'See the photos',
  },
  unavailable: "Content isn't available in this format",
  prevStory: 'Previous story',
  nextStory: 'Next story',
  play: {
    video: 'Watch the video',
    audio: 'Listen to the audio',
    texto: 'Read the story',
    foto: 'See the photo album',
  },
  back: '← Back',
  backStories: '← Back to the stories',
  seeMoreStories: '← See more stories',
  share: 'Share',
  shareThisStory: 'Share this story',
  moreStories: 'More stories',
  related: 'Other stories with a similar tone',
  listen: 'Listen',
  photoPrev: 'Previous photo',
  photoNext: 'Next photo',
  close: 'Close',
  pause: 'Pause',
  playControl: 'Play',
  back10: 'Back 10 s',
  forward10: 'Forward 10 s',
  soundOn: 'Turn sound on',
  mute: 'Mute',
  transcript: 'Audio transcript',
  listenAgain: 'Listen again',
  watchAgain: 'Watch again',
  videoPlayer: 'Video player',
  captionEs: 'Spanish',
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
  formatAudio: 'Audio',
  formatVideo: 'Video',
  formatText: 'Text',
  formatPhoto: 'Photo',
  formatStory: 'Story',
  anonymous: 'Anonymous',
  photoCount: (n) => (n === 1 ? '1 photo' : `${n} photos`),
  photoOf: (title) => `Photo of ${title}`,
  albumPhoto: (title) => `Album photo: ${title}`,
  portrait: (name) => `Portrait of ${name}`,
  goToPhoto: (n) => `Go to photo ${n}`,
  playAudioTitle: (title) => `Play audio: ${title}`,
  playVideoTitle: (title) => `Play video: ${title}`,
  readingMinutes: (n) => `${n} min read`,
  storyAria: (title) => `Story: ${title}`,
};

const COPY: Record<AlmaLocale, FormatPagesCopy> = { es, pt, en };

export function formatPagesCopy(locale: AlmaLocale): FormatPagesCopy {
  return COPY[locale];
}
