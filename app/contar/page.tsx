import { HomePageClient } from '@/components/home/HomePageClient';
import { contarMetadata } from '@/lib/contar-routes';

export const dynamic = 'force-dynamic';

export const metadata = contarMetadata('index');

export default function ContarPage() {
  return <HomePageClient />;
}
