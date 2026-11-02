import { DocumentoLegal, documento } from '@/components/legal/DocumentoLegal';
import { localeDeLaPagina, metaLegal } from '@/lib/i18n/pagina-legal';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return metaLegal('conducta');
}

export default async function CodigoDeConductaPage() {
  const locale = await localeDeLaPagina();
  return <DocumentoLegal locale={locale} doc={documento(locale, 'conducta')} actual="conducta" />;
}
