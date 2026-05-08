'use client';

import FotoAlbum, { type HistoriaFoto } from '@/components/historia/FotoAlbum';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

type Props = {
  historia: HistoriaFoto;
};

/** Masthead global + footer: misma estructura de página que audio / vídeo dedicados. */
export function FotoAlbumClient({ historia }: Props) {
  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col min-h-0`}>
        <section className="flex w-full min-h-0 flex-1 flex-col items-stretch">
          <FotoAlbum historia={historia} siteLayout />
        </section>
      </div>
    </main>
  );
}
