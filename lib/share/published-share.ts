import type { AlmaLocale } from '@/lib/i18n/locale';

const ORIGIN = 'https://www.almamundi.org';

export type PublishedStoryFormat = 'video' | 'audio' | 'text' | 'photo';

export function publishedStoryShareUrl(id: string): string {
  return `${ORIGIN}/historias/${id}`;
}

export function publishedQuestionShareUrl(id: string): string {
  return `${ORIGIN}/pregunta/${id}`;
}

/** Ciudad sola: «Santiago, Chile» o un lugar compuesto queda en «Santiago». */
export function publishedStoryCity(value: string | null | undefined): string {
  const raw = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!raw || raw === '—') return '';
  const city = raw.split(',')[0]?.trim() ?? '';
  return city === '—' ? '' : city;
}

export function publishedStoryFormat(raw: string | null | undefined): PublishedStoryFormat {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'video') return 'video';
  if (value === 'audio') return 'audio';
  if (value === 'foto' || value === 'photo' || value === 'photos' || value === 'image') return 'photo';
  return 'text';
}

function titled(locale: AlmaLocale, title: string): string {
  const name = title.replace(/\s+/g, ' ').trim();
  return locale === 'es' ? `«${name}»` : `“${name}”`;
}

export function publishedStoryShareText(
  locale: AlmaLocale,
  format: PublishedStoryFormat,
  title: string,
  city: string,
  link: string
): string {
  const name = titled(locale, title);
  const place = publishedStoryCity(city);
  const lead =
    locale === 'pt'
      ? 'Há histórias que ficam com você.'
      : locale === 'en'
        ? 'Some stories stay with you.'
        : 'Hay historias que se quedan contigo.';

  if (locale === 'pt') {
    const from = place ? ` de ${place}` : '';
    const inCity = place ? ` em ${place}` : '';
    if (format === 'video') return `${lead} Assista ${name}, um vídeo${from}, no AlmaMundi: ${link}`;
    if (format === 'audio') return `${lead} Ouça ${name}, um áudio${from}, no AlmaMundi: ${link}`;
    if (format === 'photo') return `${lead} Veja ${name}, uma história em fotos${from}, no AlmaMundi: ${link}`;
    return `${lead} Leia ${name}, uma história escrita${inCity}, no AlmaMundi: ${link}`;
  }
  if (locale === 'en') {
    const from = place ? ` from ${place}` : '';
    if (format === 'video') return `${lead} Watch ${name}, a video${from}, on AlmaMundi: ${link}`;
    if (format === 'audio') return `${lead} Listen to ${name}, an audio story${from}, on AlmaMundi: ${link}`;
    if (format === 'photo') return `${lead} See ${name}, a story in photos${from}, on AlmaMundi: ${link}`;
    return `${lead} Read ${name}, a written story${from}, on AlmaMundi: ${link}`;
  }
  const from = place ? ` desde ${place}` : '';
  if (format === 'video') return `${lead} Mira ${name}, un video${from}, en AlmaMundi: ${link}`;
  if (format === 'audio') return `${lead} Escucha ${name}, un audio${from}, en AlmaMundi: ${link}`;
  if (format === 'photo') return `${lead} Mira ${name}, una historia en fotos${from}, en AlmaMundi: ${link}`;
  return `${lead} Lee ${name}, una historia escrita${from}, en AlmaMundi: ${link}`;
}

/** Instagram y TikTok, solo para una historia ya publicada. */
export function publishedStorySocialText(
  locale: AlmaLocale,
  title: string,
  city: string,
  link: string
): string {
  const name = titled(locale, title);
  const place = publishedStoryCity(city);
  if (locale === 'pt') {
    const where = place ? `, de ${place}` : '';
    return `Conheci o almamundi.org, um mapa do mundo feito de histórias reais, e encontrei esta que acho que você vai gostar: ${name}${where}. ${link}`;
  }
  if (locale === 'en') {
    const where = place ? `, from ${place}` : '';
    return `I found almamundi.org, a world map made of real stories, and came across this one I think you'll love: ${name}${where}. ${link}`;
  }
  const where = place ? `, desde ${place}` : '';
  return `Conocí almamundi.org, un mapa del mundo hecho de historias reales, y encontré esta que creo que te va a gustar: ${name}${where}. ${link}`;
}

/** Primera persona, para que quien publicó la comparta desde el correo. */
export function publishedAuthorShareText(
  locale: AlmaLocale,
  title: string,
  city: string,
  link: string
): string {
  const name = titled(locale, title);
  const place = publishedStoryCity(city);
  if (locale === 'pt') {
    const told = place ? ` e eu a contei de ${place}` : '';
    return `Minha história já está no mapa do AlmaMundi. Ela se chama ${name}${told}: ${link}`;
  }
  if (locale === 'en') {
    const told = place ? ` and I told it from ${place}` : '';
    return `My story is now on the AlmaMundi map. It's called ${name}${told}: ${link}`;
  }
  const told = place ? ` y la conté desde ${place}` : '';
  return `Mi historia ya está en el mapa de AlmaMundi. Se llama ${name}${told}: ${link}`;
}

/** Línea corta de la vista previa: formato y lugar público, sin el texto de la historia. */
export function publishedStoryPreviewDescription(
  locale: AlmaLocale,
  format: PublishedStoryFormat,
  place: string
): string {
  const where = place.replace(/\s+/g, ' ').trim();
  if (locale === 'pt') {
    if (format === 'video') return where ? `Um vídeo de ${where}` : 'Um vídeo';
    if (format === 'audio') return where ? `Um áudio de ${where}` : 'Um áudio';
    if (format === 'photo') return where ? `Uma história em fotos de ${where}` : 'Uma história em fotos';
    return where ? `Uma história escrita em ${where}` : 'Uma história escrita';
  }
  if (locale === 'en') {
    if (format === 'video') return where ? `A video from ${where}` : 'A video';
    if (format === 'audio') return where ? `An audio story from ${where}` : 'An audio story';
    if (format === 'photo') return where ? `A story in photos from ${where}` : 'A story in photos';
    return where ? `A written story from ${where}` : 'A written story';
  }
  if (format === 'video') return where ? `Un video desde ${where}` : 'Un video';
  if (format === 'audio') return where ? `Un audio desde ${where}` : 'Un audio';
  if (format === 'photo') return where ? `Una historia en fotos desde ${where}` : 'Una historia en fotos';
  return where ? `Una historia escrita desde ${where}` : 'Una historia escrita';
}

export function publishedStoryEmailSubject(locale: AlmaLocale): string {
  if (locale === 'pt') return 'Uma história no AlmaMundi';
  if (locale === 'en') return 'A story on AlmaMundi';
  return 'Una historia en AlmaMundi';
}
