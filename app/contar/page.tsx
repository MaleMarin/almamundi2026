import { HomePageClient } from '@/components/home/HomePageClient';
import { contarMetadata } from '@/lib/contar-routes';
import { ALMA_LOCALE_COOKIE } from '@/lib/i18n/locale';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const jar = await cookies();
  return contarMetadata('index', jar.get(ALMA_LOCALE_COOKIE)?.value);
}

export default function ContarPage() {
  return <HomePageClient />;
}
