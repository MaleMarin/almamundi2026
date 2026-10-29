import type { AlmaLocale } from '@/lib/i18n/locale';

export type MapChrome = {
  dockAria: string;
  stories: string;
  storiesOn: string;
  storiesOff: string;
  surprise: string;
  surpriseTitle: string;
  bits: string;
  bitsOn: string;
  bitsOff: string;
  sounds: string;
  soundsTitle: string;
  search: string;
  searchTitle: string;
  searchHint: string;
  searchUseTab: string;
  searchEmpty: string;
  results: string;
  storiesEmpty: string;
  tell: string;
  latest: string;
  soundsIntro: string;
  soundOff: string;
  soundOn: string;
  volumeHelp: string;
  volumeOf: string;
  volumeDown: string;
  volumeUp: string;
  volumePercent: string;
  universo: string;
  mar: string;
  radio: string;
  lluvia: string;
  mercado: string;
};

const es: MapChrome = {
  dockAria: 'Capas y herramientas del mapa',
  stories: 'Historias',
  storiesOn: 'Historias visibles. Clic para ver la lista o apagar la capa.',
  storiesOff: 'Mostrar historias en el globo',
  surprise: 'Sorpréndeme',
  surpriseTitle: 'Abrir una historia publicada al azar',
  bits: 'También cuenta',
  bitsOn: 'También cuenta está visible. Clic para ver la ficha o apagar la capa.',
  bitsOff: 'Mostrar También cuenta en el globo',
  sounds: 'Sonidos',
  soundsTitle: 'Abrir sonidos del mapa',
  search: 'Buscar',
  searchTitle: 'Buscar por título, ciudad o tema',
  searchHint: 'Escribe palabras clave para buscar entre las historias del mapa (lugar, tema o texto).',
  searchUseTab: 'Para ver el listado completo, usa la pestaña Historias.',
  searchEmpty: 'No hay historias que coincidan con tu búsqueda.',
  results: 'Resultados',
  storiesEmpty: 'Este mapa se construye con historias como la tuya.',
  tell: 'Cuenta tu historia',
  latest: 'Últimas historias',
  soundsIntro: 'Estos sonidos pueden traerte recuerdos de otros lugares. Elige el que quieras mientras exploras el mapa.',
  soundOff: 'Desactivar sonido ambiente',
  soundOn: 'Activar sonido ambiente',
  volumeHelp: 'Cada ambiente tiene su volumen guardado en este dispositivo. Ajusta con la barra o con − / +.',
  volumeOf: 'Volumen de',
  volumeDown: 'Bajar volumen de',
  volumeUp: 'Subir volumen de',
  volumePercent: 'por ciento',
  universo: 'Universo',
  mar: 'Mar',
  radio: 'Radio',
  lluvia: 'Lluvia',
  mercado: 'Mercado',
};

const pt: MapChrome = {
  dockAria: 'Camadas e ferramentas do mapa',
  stories: 'Histórias',
  storiesOn: 'Histórias visíveis. Clique para ver a lista ou desligar a camada.',
  storiesOff: 'Mostrar histórias no globo',
  surprise: 'Surpreenda-me',
  surpriseTitle: 'Abrir uma história publicada ao acaso',
  bits: 'Também conta',
  bitsOn: 'Também conta está visível. Clique para ver a ficha ou desligar a camada.',
  bitsOff: 'Mostrar Também conta no globo',
  sounds: 'Sons',
  soundsTitle: 'Abrir sons do mapa',
  search: 'Buscar',
  searchTitle: 'Buscar por título, cidade ou tema',
  searchHint: 'Escreva palavras-chave para buscar entre as histórias do mapa (lugar, tema ou texto).',
  searchUseTab: 'Para ver a lista completa, use a aba Histórias.',
  searchEmpty: 'Não há histórias que coincidam com sua busca.',
  results: 'Resultados',
  storiesEmpty: 'Este mapa se constrói com histórias como a sua.',
  tell: 'Conte sua história',
  latest: 'Últimas histórias',
  soundsIntro: 'Estes sons podem trazer lembranças de outros lugares. Escolha o que quiser enquanto explora o mapa.',
  soundOff: 'Desativar som ambiente',
  soundOn: 'Ativar som ambiente',
  volumeHelp: 'Cada ambiente tem seu volume salvo neste dispositivo. Ajuste com a barra ou com − / +.',
  volumeOf: 'Volume de',
  volumeDown: 'Diminuir volume de',
  volumeUp: 'Aumentar volume de',
  volumePercent: 'por cento',
  universo: 'Universo',
  mar: 'Mar',
  radio: 'Rádio',
  lluvia: 'Chuva',
  mercado: 'Mercado',
};

const en: MapChrome = {
  dockAria: 'Map layers and tools',
  stories: 'Stories',
  storiesOn: 'Stories are visible. Click to see the list or turn the layer off.',
  storiesOff: 'Show stories on the globe',
  surprise: 'Surprise me',
  surpriseTitle: 'Open a published story at random',
  bits: 'Also counts',
  bitsOn: 'Also counts is visible. Click to see the card or turn the layer off.',
  bitsOff: 'Show Also counts on the globe',
  sounds: 'Sounds',
  soundsTitle: 'Open map sounds',
  search: 'Search',
  searchTitle: 'Search by title, city, or theme',
  searchHint: 'Type keywords to search the stories on the map (place, theme, or text).',
  searchUseTab: 'To see the full list, use the Stories tab.',
  searchEmpty: 'No stories match your search.',
  results: 'Results',
  storiesEmpty: 'This map is built with stories like yours.',
  tell: 'Tell your story',
  latest: 'Latest stories',
  soundsIntro: 'These sounds can bring back memories of other places. Choose one while you explore the map.',
  soundOff: 'Turn ambient sound off',
  soundOn: 'Turn ambient sound on',
  volumeHelp: 'Each ambience keeps its volume on this device. Adjust it with the bar or with − / +.',
  volumeOf: 'Volume of',
  volumeDown: 'Lower volume of',
  volumeUp: 'Raise volume of',
  volumePercent: 'percent',
  universo: 'Universe',
  mar: 'Sea',
  radio: 'Radio',
  lluvia: 'Rain',
  mercado: 'Market',
};

const COPY: Record<AlmaLocale, MapChrome> = { es, pt, en };

export function mapChrome(locale: AlmaLocale): MapChrome {
  return COPY[locale];
}
