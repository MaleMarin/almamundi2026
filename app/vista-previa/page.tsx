import { redirect } from 'next/navigation';

/**
 * Vista previa: redirige a /preview-home para que la URL "vista-previa" funcione.
 */
export default function VistaPreviaPage() {
  redirect('/preview-home');
}
