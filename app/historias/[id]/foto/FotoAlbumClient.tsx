'use client';

import FotoAlbum, { type HistoriaFoto } from '@/components/historia/FotoAlbum';

type Props = {
  historia: HistoriaFoto;
};

/** Igual que `/historias/[id]/video`: álbum a pantalla completa sin volver al detalle neumórfico. */
export function FotoAlbumClient({ historia }: Props) {
  return <FotoAlbum historia={historia} />;
}
