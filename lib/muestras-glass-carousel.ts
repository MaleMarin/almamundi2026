import { getMuestras } from '@/lib/muestras';

export type GlassCarouselSlide = {
  slug: string;
  /** Texto del tema en el eyebrow (MIGRACIÓN, MEMORIA, IDENTIDAD). */
  temaLabel: string;
  index1Based: number;
  title: string;
  description: string;
  storyTitles: readonly string[];
};

const M1_STORY_LABELS = [
  'La Maleta',
  'El Mar al Otro Lado',
  'Primer Día en la Nueva Ciudad',
  'Retrato en la Ventana',
] as const;

/** Tres muestras fijas para el vidrio: migración (copy fija) + datos 2 y 3 de `getMuestras()`. */
export function getGlassCarouselSlides(): readonly GlassCarouselSlide[] {
  const all = getMuestras();
  const m0 = all[0];
  const m1 = all[1];
  const m2 = all[2];
  if (!m0 || !m1 || !m2) {
    return [];
  }

  return [
    {
      slug: m0.slug,
      temaLabel: 'MIGRACIÓN',
      index1Based: 1,
      title: 'Voces del desplazamiento',
      description: [m0.intro, m0.description].filter(Boolean).join('\n\n'),
      storyTitles: M1_STORY_LABELS,
    },
    {
      slug: m1.slug,
      temaLabel: 'MEMORIA',
      index1Based: 2,
      title: m1.title,
      description: [m1.intro, m1.description].filter(Boolean).join('\n\n'),
      storyTitles: m1.items.map((it) => it.title),
    },
    {
      slug: m2.slug,
      temaLabel: 'IDENTIDAD',
      index1Based: 3,
      title: m2.title,
      description: [m2.intro, m2.description].filter(Boolean).join('\n\n'),
      storyTitles: m2.items.map((it) => it.title),
    },
  ];
}

export const GLASS_CAROUSEL_COUNT = 3;
