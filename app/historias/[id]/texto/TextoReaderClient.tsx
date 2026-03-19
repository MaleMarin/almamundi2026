'use client';

import { useRouter } from 'next/navigation';
import TextoReader, { type HistoriaTexto } from '@/components/historia/TextoReader';

type Props = {
  historia: HistoriaTexto;
  id: string;
};

export function TextoReaderClient({ historia, id }: Props) {
  const router = useRouter();
  return (
    <TextoReader
      historia={historia}
      onClose={() => router.push(`/historias/${id}`)}
    />
  );
}
