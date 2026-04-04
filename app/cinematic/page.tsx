import { redirect } from 'next/navigation';

/**
 * Ruta histórica: el inicio del recorrido vive en `/muestras`.
 */
export default function CinematicPage() {
  redirect('/muestras');
}
