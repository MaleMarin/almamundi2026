/**
 * Iconos en `/public/icons` (SVG relieve deboss) para compartir y carta al autor (buzón).
 */
export const HISTORIAS_SHARE_ICON_SRC = '/icons/compartir.svg';

export const HISTORIAS_MAILBOX_ICON_SRC = '/icons/correo.svg';

/**
 * Contenedor inset sobre fondo #E0E5EC (barra de filtros / botones claros):
 * da relieve y contraste a los PNG neumórficos claros.
 */
export const HISTORIAS_FILTER_ICON_WELL_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-700/14 bg-[linear-gradient(152deg,#f6f8fc_0%,#dce2ec_100%)] shadow-[inset_1px_1px_2px_rgba(255,255,255,1),inset_-1px_-3px_5px_rgba(90,100,125,0.26),0_1px_2px_rgba(255,255,255,0.6)]';

/** Imagen dentro del well (SVG con deboss propio; sin filtro extra). */
export const HISTORIAS_FILTER_ICON_IMG_CLASS = 'h-[1.35rem] w-[1.35rem] object-contain';
