import { Suspense } from 'react';
import HistoriasCatalog from '@/components/historias/HistoriasCatalog';

export default function HistoriasPage() {
  return (
    <Suspense>
      <HistoriasCatalog />
    </Suspense>
  );
}
