import { MapaToHomeRedirect } from '@/components/map/MapaToHomeRedirect';

export const dynamic = 'force-dynamic';

/**
 * Ruta exacta `/mapa`: no monta la experiencia antigua; redirige a `/#mapa` en cliente.
 * Redirect en `next.config.ts` (`/?section=mapa`) cubre la primera petición en edge.
 */
export default function MapaPage() {
  return <MapaToHomeRedirect />;
}
