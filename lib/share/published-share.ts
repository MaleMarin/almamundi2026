import type { AlmaLocale } from '@/lib/i18n/locale';

const ORIGIN = 'https://www.almamundi.org';

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

export function publishedStoryShareText(
  locale: AlmaLocale,
  title: string,
  city: string,
  link: string
): string {
  const place = publishedStoryCity(city);
  if (locale === 'pt') {
    const where = place ? `“${title}”, de ${place}` : `“${title}”`;
    return `Há histórias que ficam com você. ${where}, no AlmaMundi: ${link}`;
  }
  if (locale === 'en') {
    const where = place ? `“${title}”, from ${place}` : `“${title}”`;
    return `Some stories stay with you. ${where}, on AlmaMundi: ${link}`;
  }
  const where = place ? `«${title}», desde ${place}` : `«${title}»`;
  return `Hay historias que se quedan contigo. ${where}, en AlmaMundi: ${link}`;
}

export function publishedStoryEmailSubject(locale: AlmaLocale): string {
  if (locale === 'pt') return 'Uma história no AlmaMundi';
  if (locale === 'en') return 'A story on AlmaMundi';
  return 'Una historia en AlmaMundi';
}
