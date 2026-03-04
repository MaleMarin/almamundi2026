import { redirect } from 'next/navigation';

/** Las noticias no tienen página interna; abrir news.url en nueva pestaña. */
export default function ObservatorioNoticiaPage() {
  redirect('/mapa');
}
