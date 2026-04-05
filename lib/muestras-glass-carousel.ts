export type GlassCarouselSlide = {
  slug: string;
  /** Línea secundaria del eyebrow (p. ej. INFANCIA, ESPERA). */
  temaLabel: string;
  index1Based: number;
  title: string;
  description: string;
  storyTitles: readonly string[];
};

/** Tema curatorial «TIEMPO»: tres muestras fijas en el vidrio (arquitectura del carrusel sin cambios). */
export function getGlassCarouselSlides(): readonly GlassCarouselSlide[] {
  return [
    {
      slug: 'el-verano-que-duro-para-siempre',
      temaLabel: 'INFANCIA',
      index1Based: 1,
      title: 'El verano que duró para siempre',
      description:
        'Algunos veranos se quedan grabados como si fueran eternos. Historias de un tiempo que el cuerpo recuerda aunque la mente lo haya olvidado.',
      storyTitles: [
        'LA CASA DE LA ABUELA',
        'EL ÚLTIMO DÍA DE CLASES',
        'CUANDO NO HABÍA HORA',
        'EL RITUAL DEL DESAYUNO',
      ],
    },
    {
      slug: 'lo-que-pasa-mientras-se-espera',
      temaLabel: 'ESPERA',
      index1Based: 2,
      title: 'Lo que pasa mientras se espera',
      description:
        'Salas de hospital, aeropuertos, filas interminables. El tiempo suspendido que a veces es el más honesto.',
      storyTitles: [
        'SALA DE URGENCIAS, 3 AM',
        'EL VUELO CANCELADO',
        'ESPERANDO EL DIAGNÓSTICO',
        'LA FILA DEL PAN',
      ],
    },
    {
      slug: 'cuando-el-tiempo-se-vuelve-visible',
      temaLabel: 'VEJEZ',
      index1Based: 3,
      title: 'Cuando el tiempo se vuelve visible',
      description:
        'Las manos arrugadas, los pasos más lentos, la memoria que elige qué guardar. Historias de quienes han vivido mucho tiempo.',
      storyTitles: [
        'MIS MANOS NO SON MÁS MÍAS',
        'EL MISMO CAMINO, DIFERENTE',
        'LO QUE YA NO RECUERDO',
        'LA ÚLTIMA FOTOGRAFÍA',
      ],
    },
  ] as const;
}

export const GLASS_CAROUSEL_COUNT = 3;
