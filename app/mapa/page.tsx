import { redirect } from 'next/navigation';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

export const dynamic = 'force-dynamic';

/**
 * `/mapa` exacto: redirect inmediato en servidor (sin MapFullPage).
 * Respaldo edge: `middleware.ts` + `next.config.ts` → misma query `section=mapa`.
 */
export default function MapaPage() {
  redirect(MAPA_HOME_REDIRECT_PATH);
}
