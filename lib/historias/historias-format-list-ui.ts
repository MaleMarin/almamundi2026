/**
 * Textos compartidos de /historias/videos | audios | escrito | fotos
 * (misma composición visual y mismos copy que la página de referencia: video).
 */
import { historiasFormatListHero } from '@/lib/historias/historias-format-list-hero';

export const HISTORIAS_LIST_HERO_TITLE = historiasFormatListHero.video.title;
export const HISTORIAS_LIST_HERO_SUBTITLE = historiasFormatListHero.video.subtitle;

/** Título de exposición del carrusel: mismo texto que en /historias/videos en las cuatro rutas. */
export const HISTORIAS_LIST_EXPO_LABEL = 'alma.mundi / historias en video';

/** Placeholder vacío: la etiqueta «Palabras clave» ya orienta al usuario. */
export const HISTORIAS_FILTER_KEYWORD_PLACEHOLDER = '';

/** Misma etiqueta accesible del bloque carrusel en los cuatro formatos (como referencia única). */
export const HISTORIAS_CAROUSEL_ARIA_LABEL = 'Carrusel de historias';

export const HISTORIAS_FILTER_BLOCK_TITLE = 'Buscar por país, año o palabras clave';

export type HistoriasListFormatKey = 'video' | 'audio' | 'texto' | 'foto';

/**
 * Línea naranja bajo el hero: misma frase que en video en todas las rutas
 * (audios / escrito / fotos usan el mismo kicker vía sus claves).
 */
const HISTORIAS_LIST_ORANGE_KICKER_VIDEO = 'Historias en video';

export const historiasListFormatOrangeKicker: Record<HistoriasListFormatKey, string> = {
  video: HISTORIAS_LIST_ORANGE_KICKER_VIDEO,
  audio: HISTORIAS_LIST_ORANGE_KICKER_VIDEO,
  texto: HISTORIAS_LIST_ORANGE_KICKER_VIDEO,
  foto: HISTORIAS_LIST_ORANGE_KICKER_VIDEO,
};
