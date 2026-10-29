import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { HomePageClient } from '@/components/home/HomePageClient';
import { contarMetadata, isContarFormat } from '@/lib/contar-routes';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ formato: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { formato } = await params;
  if (!isContarFormat(formato)) return {};
  const jar = await cookies();
  return contarMetadata(formato, parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value));
}

export default async function ContarFormatoPage({ params }: Props) {
  const { formato } = await params;
  if (!isContarFormat(formato)) notFound();
  return <HomePageClient />;
}
