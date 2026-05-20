import { redirect } from 'next/navigation';
import { MAPA_HOME_REDIRECT_PATH } from '@/lib/mapa-home-nav';

/** Las noticias no tienen página interna; abrir news.url en nueva pestaña. */
export default function ObservatorioNoticiaPage() {
  redirect(MAPA_HOME_REDIRECT_PATH);
}
