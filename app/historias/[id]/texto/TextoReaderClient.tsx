'use client';

import TextoReader, { type HistoriaTexto } from '@/components/historia/TextoReader';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

type Props = {
  historia: HistoriaTexto;
};

/** Masthead global + footer: columna de lectura bajo el mismo shell que audio / vídeo. */
export function TextoReaderClient({ historia }: Props) {
  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <div className={`${historiasInterior.contentWrapClassName} flex w-full flex-1 flex-col min-h-0`}>
        <section className="flex w-full min-h-0 flex-1 flex-col">
          <TextoReader historia={historia} siteLayout />
        </section>
      </div>
    </main>
  );
}
