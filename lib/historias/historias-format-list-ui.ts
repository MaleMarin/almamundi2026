/**
 * Textos compartidos de /historias/videos | audios | escrito | fotos
 * (misma composición visual; kicker naranja y etiqueta de carrusel por formato).
 */
import { historiasFormatListHero } from '@/lib/historias/historias-format-list-hero';

export const HISTORIAS_LIST_HERO_TITLE = historiasFormatListHero.video.title;
export const HISTORIAS_LIST_HERO_SUBTITLE = historiasFormatListHero.video.subtitle;

/** Placeholder vacío: la etiqueta «Palabras clave» ya orienta al usuario. */
export const HISTORIAS_FILTER_KEYWORD_PLACEHOLDER = '';

/** Misma etiqueta accesible del bloque carrusel en los cuatro formatos (como referencia única). */
export const HISTORIAS_CAROUSEL_ARIA_LABEL = 'Carrusel de historias';

export const HISTORIAS_FILTER_BLOCK_TITLE = 'Buscar por país, año o palabras clave';

/** Tooltips (title) de los dos botones junto a «Limpiar filtros» en listados de historias. Orden: compartir, carta al autor. */
export const HISTORIAS_SHARE_ICONS_LEGEND = [
  {
    label: 'Compartir',
    text: 'Compartir la historia con respeto: crédito a quien la cuenta, enlace y tarjeta descargable.',
  },
  {
    label: 'Carta a quien cuenta',
    text:
      'Escribir una carta breve de resonancia para quien narra este relato. AlmaMundi recibe tu mensaje, lo revisa con cuidado (incluye un filtro automático de respeto) y, cuando corresponda, puede acercárselo a quien lo contó. Es un proceso con pausa: no hay envío directo sin este resguardo.',
  },
] as const;

export type HistoriasListFormatKey = 'video' | 'audio' | 'texto' | 'foto';

/** Línea naranja bajo el hero: una frase por formato de listado. */
export const historiasListFormatOrangeKicker: Record<HistoriasListFormatKey, string> = {
  video: 'Historias en video',
  audio: 'Historias en audio',
  texto: 'Historias en texto',
  foto: 'Historias en fotografía',
};

/** Título de exposición del carrusel (misma composición; texto según pestaña de formato). */
export const historiasListFormatExpoLabel: Record<HistoriasListFormatKey, string> = {
  video: 'alma.mundi / historias en video',
  audio: 'alma.mundi / historias en audio',
  texto: 'alma.mundi / historias en texto',
  foto: 'alma.mundi / historias en fotografía',
};
