import type { Metadata } from 'next';
import { HomePageClient } from '@/components/home/HomePageClient';

/** Evita servir `/` desde caché estática/router de forma que quede desactualizada respecto al último despliegue. */
export const dynamic = 'force-dynamic';

/** `og:url` del home; el resto de OG/Twitter vive en `app/layout.tsx`. */
export const metadata: Metadata = {
  openGraph: {
    url: '/',
    type: 'website',
  },
};

export default function Home() {
  return <HomePageClient />;
}
