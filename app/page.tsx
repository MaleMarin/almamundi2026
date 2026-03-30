import { HomePageClient } from '@/components/home/HomePageClient';

/** Evita servir `/` desde caché estática/router de forma que quede desactualizada respecto al último despliegue. */
export const dynamic = 'force-dynamic';

export default function Home() {
  return <HomePageClient />;
}
