import { PaginaProposito, metadataProposito } from '@/components/proposito/PaginaProposito';

export const metadata = metadataProposito('es');

export default function PropositoPage() {
  return <PaginaProposito locale="es" />;
}
