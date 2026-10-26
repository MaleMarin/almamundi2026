import type { AlmaLocale } from '@/lib/i18n/locale';

export type NotFoundMessages = {
  title: string;
  body: string;
  exploreMap: string;
  tellStory: string;
};

const es: NotFoundMessages = {
  title: 'Esta página se perdió en el camino',
  body: 'Puede que el enlace esté incompleto o que la historia todavía esté en revisión. Mientras tanto, hay muchas otras esperando en el mapa.',
  exploreMap: 'Explorar el mapa',
  tellStory: 'Contar mi historia',
};

const pt: NotFoundMessages = {
  title: 'Esta página se perdeu no caminho',
  body: 'O link pode estar incompleto ou a história ainda pode estar em revisão. Enquanto isso, há muitas outras esperando no mapa.',
  exploreMap: 'Explorar o mapa',
  tellStory: 'Contar minha história',
};

const en: NotFoundMessages = {
  title: 'This page got lost along the way',
  body: 'The link may be incomplete, or the story may still be in review. Meanwhile, many others are waiting on the map.',
  exploreMap: 'Explore the map',
  tellStory: 'Tell my story',
};

export const NOT_FOUND_MESSAGES: Record<AlmaLocale, NotFoundMessages> = { es, pt, en };
