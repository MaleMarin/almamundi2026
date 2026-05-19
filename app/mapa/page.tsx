import { redirect } from 'next/navigation';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

export const dynamic = 'force-dynamic';

/**
 * `/mapa` ya no monta MapFullPage: el mapa vive en home `/#mapa` (MapSectionLocked + HomeMap).
 * Redirect en servidor (el fragmento `#mapa` no sobrevive a redirects HTTP).
 */
export default function MapaPage() {
  redirect(MAPA_HOME_REDIRECT_PATH);
}
