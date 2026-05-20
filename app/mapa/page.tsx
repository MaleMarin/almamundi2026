import Script from 'next/script';
import { MapaToHomeRedirect } from '@/components/map/MapaToHomeRedirect';

export const dynamic = 'force-dynamic';

/**
 * `/mapa` no es una página: solo redirige al mapa de la home (`/#mapa` vía `?section=mapa`).
 * Subrutas `/mapa/historias/*` etc. siguen activas para deep links.
 */
export default function MapaPage() {
  return (
    <>
      <Script id="mapa-root-redirect" strategy="beforeInteractive">
        {`if(location.pathname==='/mapa'||location.pathname==='/mapa/'){location.replace('/?section=mapa');}`}
      </Script>
      <MapaToHomeRedirect />
    </>
  );
}
