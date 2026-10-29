import { NotFoundView } from '@/components/layout/NotFoundView';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { notFoundTitle } from '@/lib/i18n/public-meta';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  return {
    title: notFoundTitle(parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value)),
    robots: { index: false, follow: false },
  };
}

export default function NotFound() {
  return <NotFoundView />;
}
