'use client';

import TextoReader, { type HistoriaTexto } from '@/components/historia/TextoReader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

type Props = {
  historia: HistoriaTexto;
};

/** Igual que `/historias/[id]/video`: lectura inmersiva sin CTA «volver al detalle». */
export function TextoReaderClient({ historia }: Props) {
  return (
    <div className="flex w-full min-h-0 flex-1 flex-col items-center gap-1">
      <div className="w-full max-w-4xl shrink-0 px-3 pt-1 md:px-8">
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Historias', href: '/historias' },
            { label: 'Escritos', href: '/historias/escrito' },
            { label: historia.titulo },
          ]}
        />
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <TextoReader historia={historia} siteLayout />
      </div>
    </div>
  );
}
