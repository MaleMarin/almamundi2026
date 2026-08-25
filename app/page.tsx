import { HomePageClient } from '@/components/home/HomePageClient';

/** Evita servir `/` desde caché estática/router de forma que quede desactualizada respecto al último despliegue. */
export const dynamic = 'force-dynamic';

/** Open Graph / Twitter del home: `app/layout.tsx` (un `openGraph` aquí reemplazaría el del layout, incluida la imagen). */

export default function Home() {
  return <HomePageClient />;
}
