import { redirect } from 'next/navigation';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

/**
 * /mapa/historias sin id → redirige al mapa con vista de historias.
 */
export default function HistoriasIndexPage() {
  redirect(MAPA_HOME_REDIRECT_PATH);
}
