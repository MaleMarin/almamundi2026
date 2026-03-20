import { redirect } from 'next/navigation';

/**
 * /mapa/historias sin id → redirige al mapa con vista de historias.
 */
export default function HistoriasIndexPage() {
  redirect('/mapa');
}
