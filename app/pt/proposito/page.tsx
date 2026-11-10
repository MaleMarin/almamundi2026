import { PaginaProposito, metadataProposito } from '@/components/proposito/PaginaProposito';

export const metadata = metadataProposito('pt');

export default function PropositoPtPage() {
  return <PaginaProposito locale="pt" />;
}
