import { redirect } from 'next/navigation';

/**
 * Ruta índice `/mapa`: la experiencia de mapa viva está en home `#mapa` (HomeMap + GlobeV2).
 * Subrutas `/mapa/noticias/*`, `/mapa/historias/*`, etc. siguen en sus pages.
 */
export default function MapaPage() {
  redirect('/#mapa');
}
