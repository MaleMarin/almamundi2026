'use client';

import TextoReader, { type HistoriaTexto } from '@/components/historia/TextoReader';

type Props = {
  historia: HistoriaTexto;
};

/** Igual que `/historias/[id]/video`: lectura inmersiva sin CTA «volver al detalle». */
export function TextoReaderClient({ historia }: Props) {
  return <TextoReader historia={historia} />;
}
