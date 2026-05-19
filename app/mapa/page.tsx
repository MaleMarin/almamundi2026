import { MapaToHomeRedirect } from '@/components/map/MapaToHomeRedirect';

/**
 * Ruta índice `/mapa`: redirige en cliente a home `/#mapa` (HomeMap + GlobeV2 bajo las tarjetas).
 * Subrutas `/mapa/noticias/*`, `/mapa/historias/*`, etc. siguen en sus pages.
 */
export default function MapaPage() {
  return <MapaToHomeRedirect />;
}
