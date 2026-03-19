'use client';

import { useRouter } from 'next/navigation';
import FotoAlbum, { type HistoriaFoto } from '@/components/historia/FotoAlbum';

type Props = {
  historia: HistoriaFoto;
  id: string;
};

export function FotoAlbumClient({ historia, id }: Props) {
  const router = useRouter();
  return (
    <FotoAlbum
      historia={historia}
      onClose={() => router.push(`/historias/${id}`)}
    />
  );
}
