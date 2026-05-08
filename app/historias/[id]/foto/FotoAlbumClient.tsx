'use client';

import FotoAlbum, { type HistoriaFoto } from '@/components/historia/FotoAlbum';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

type Props = {
  historia: HistoriaFoto;
};

/** Igual que `/historias/[id]/video`: álbum a pantalla completa sin volver al detalle neumórfico. */
export function FotoAlbumClient({ historia }: Props) {
  return (
    <div className="flex w-full min-h-0 flex-1 flex-col items-center gap-1">
      <div className="w-full max-w-6xl shrink-0 px-3 pt-1 md:px-8">
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Historias', href: '/historias' },
            { label: 'Fotografías', href: '/historias/fotos' },
            { label: historia.titulo },
          ]}
        />
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <FotoAlbum historia={historia} siteLayout />
      </div>
    </div>
  );
}
