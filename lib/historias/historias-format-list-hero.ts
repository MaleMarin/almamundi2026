/**
 * Titular y subtítulo del hero en /historias/videos, /audios, /escrito, /fotos.
 * Misma composición y copy que la página de video en todos los formatos; solo cambia la línea naranja (etiqueta) en cada page.tsx.
 */
const heroLikeVideo = {
  title: 'El mundo tiene millones de historias que nadie conoce.',
  subtitle: 'Estas son algunas.',
} as const;

export const historiasFormatListHero = {
  video: heroLikeVideo,
  audio: heroLikeVideo,
  texto: heroLikeVideo,
  foto: heroLikeVideo,
} as const;
