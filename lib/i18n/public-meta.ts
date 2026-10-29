import type { AlmaLocale } from '@/lib/i18n/locale';

export const PUBLIC_OG_LOCALE: Record<AlmaLocale, string> = {
  es: 'es_CL',
  pt: 'pt_BR',
  en: 'en_US',
};

export function publicSiteMeta(locale: AlmaLocale): { title: string; description: string; ogAlt: string } {
  if (locale === 'pt') {
    return {
      title: 'AlmaMundi, Entre e conte sua história',
      description:
        'Descubra histórias de vida reais em vídeo, áudio ou texto, e entre para contar a sua. Cada história desperta outra.',
      ogAlt: 'AlmaMundi, histórias de vida em vídeo, áudio, texto e foto',
    };
  }
  if (locale === 'en') {
    return {
      title: 'AlmaMundi, Come in and tell your story',
      description:
        'Discover real life stories in video, audio, or text, and come in to tell yours. Each story awakens another.',
      ogAlt: 'AlmaMundi, life stories in video, audio, text, and photo',
    };
  }
  return {
    title: 'AlmaMundi, Entra y cuenta tu historia',
    description:
      'Descubre historias de vida reales en video, audio o texto, y entra a contar la tuya. Cada historia despierta otra.',
    ogAlt: 'AlmaMundi, historias de vida en video, audio, texto y foto',
  };
}

export function preguntaPageMeta(locale: AlmaLocale): { title: string; description: string } {
  if (locale === 'pt') {
    return {
      title: 'A pergunta · AlmaMundi',
      description:
        'Além de contar sua história, aqui você pode responder. Toda semana lançamos uma pergunta ao mundo, e cada resposta acende um ponto no mapa.',
    };
  }
  if (locale === 'en') {
    return {
      title: 'The question · AlmaMundi',
      description:
        'Besides telling your story, here you can answer. Every week we ask the world a question, and every answer lights up a point on the map.',
    };
  }
  return {
    title: 'La pregunta · AlmaMundi',
    description:
      'Además de contar tu historia, aquí puedes responder. Cada semana lanzamos una pregunta al mundo, y cada respuesta enciende un punto en el mapa.',
  };
}

export function notFoundTitle(locale: AlmaLocale): string {
  if (locale === 'pt') return 'Esta página não está no mapa';
  if (locale === 'en') return "This page isn't on the map";
  return 'Esta página no está en el mapa';
}
