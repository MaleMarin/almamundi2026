/**
 * Iconos neumórficos en `/public` para compartir y carta al autor (buzón).
 * Espacios codificados para URL estable en navegador y Next.
 */
export const HISTORIAS_SHARE_ICON_SRC = '/compartir%20icono.png';

export const HISTORIAS_MAILBOX_ICON_SRC = '/correo%20icono.png';

/**
 * Contenedor inset sobre fondo #E0E5EC (barra de filtros / botones claros):
 * da relieve y contraste a los PNG neumórficos claros.
 */
export const HISTORIAS_FILTER_ICON_WELL_CLASS =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-600/12 bg-[linear-gradient(148deg,#f4f6fa_0%,#d8dee8_100%)] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.95),inset_-1px_-2px_4px_rgba(100,110,130,0.22)]';

/** PNG dentro del well: sombra y ligero refuerzo de contraste. */
export const HISTORIAS_FILTER_ICON_IMG_CLASS =
  'h-[1.15rem] w-[1.15rem] object-contain [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.28))] contrast-[1.12]';
