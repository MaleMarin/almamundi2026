import type { AlmaLocale } from '@/lib/i18n/locale';

export type NotFoundMessages = {
  lead: string;
  mapTitle: string;
  mapBody: string;
  storiesTitle: string;
  storiesBody: string;
};

const es: NotFoundMessages = {
  lead: 'Esta página no está en el mapa. Volvamos a donde están las historias.',
  mapTitle: 'Volver al mapa',
  mapBody: 'Sigue explorando el mundo',
  storiesTitle: 'Ver historias',
  storiesBody: 'Relatos en video, audio, foto y texto',
};

const pt: NotFoundMessages = {
  lead: 'Esta página não está no mapa. Vamos voltar para onde estão as histórias.',
  mapTitle: 'Voltar ao mapa',
  mapBody: 'Continue explorando o mundo',
  storiesTitle: 'Ver histórias',
  storiesBody: 'Relatos em vídeo, áudio, foto e texto',
};

const en: NotFoundMessages = {
  lead: "This page isn't on the map. Let's go back to where the stories are.",
  mapTitle: 'Back to the map',
  mapBody: 'Keep exploring the world',
  storiesTitle: 'See stories',
  storiesBody: 'Stories in video, audio, photos, and text',
};

export const NOT_FOUND_MESSAGES: Record<AlmaLocale, NotFoundMessages> = { es, pt, en };
