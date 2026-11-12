import { PaginaProposito, metadataProposito } from '@/components/proposito/PaginaProposito';

export const metadata = metadataProposito('en');

export default function PropositoEnPage() {
  return <PaginaProposito locale="en" />;
}
