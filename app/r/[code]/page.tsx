import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** El enlace corto de una respuesta breve ya no se publica. */
export default async function RespuestaCortaPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await params;
  permanentRedirect('/preguntas');
}
