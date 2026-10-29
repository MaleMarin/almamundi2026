import { HomePageClient } from '@/components/home/HomePageClient';
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origin';
import type { Metadata } from 'next';

/** Evita servir `/` desde caché estática/router de forma que quede desactualizada respecto al último despliegue. */
export const dynamic = 'force-dynamic';

const HOME_CANONICAL = `${PUBLIC_SITE_ORIGIN}/`;
const HOME_TITLE = 'AlmaMundi, Entra y cuenta tu historia';
const HOME_DESCRIPTION =
  'Descubre historias de vida reales en video, audio o texto, y entra a contar la tuya. Cada historia despierta otra.';

/**
 * Next omite la barra al resolver el canónico de `/`.
 * Esta página anula ese canónico y `og:url`, y los escribe con la barra.
 * El bloque Open Graph se repite porque un `openGraph` local reemplaza el del layout.
 */
export const metadata: Metadata = {
  alternates: { canonical: null },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    type: 'website',
    locale: 'es_CL',
    siteName: 'AlmaMundi',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AlmaMundi, historias de vida en video, audio, escrito y foto',
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <link rel="canonical" href={HOME_CANONICAL} />
      <meta property="og:url" content={HOME_CANONICAL} />
      <HomePageClient />
    </>
  );
}
