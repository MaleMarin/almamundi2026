import { notFound } from 'next/navigation';
import {
  getUserByUsername,
  getMuestrasByUser,
  getHistoriasGuardadas,
  getHistoriasPropias,
} from '@/lib/almamundi/perfil-queries';
import { PerfilPage } from '@/components/perfil/PerfilPage';

export const revalidate = 60;

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const perfil = await getUserByUsername(username);
  if (!perfil || !perfil.isPublic) return { title: 'Usuario · AlmaMundi' };
  return {
    title: `${perfil.nombre} · AlmaMundi`,
    description: perfil.bio ?? `Perfil de ${perfil.nombre} en AlmaMundi`,
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const perfil = await getUserByUsername(username);
  if (!perfil || !perfil.isPublic) notFound();

  const [muestras, guardadas, propias] = await Promise.all([
    getMuestrasByUser(perfil.uid, 6),
    getHistoriasGuardadas(perfil.uid, 8),
    getHistoriasPropias(perfil.uid),
  ]);

  // isOwner: cuando haya auth, comparar sesión con perfil.uid. Por ahora false.
  const isOwner = false;

  return (
    <PerfilPage
      perfil={perfil}
      muestras={muestras}
      guardadas={guardadas}
      propias={propias}
      isOwner={isOwner}
    />
  );
}
