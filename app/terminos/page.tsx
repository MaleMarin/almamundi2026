import { DocumentoLegal, documento } from '@/components/legal/DocumentoLegal';
import { localeDeLaPagina, metaLegal } from '@/lib/i18n/pagina-legal';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return metaLegal('terminos');
}

export default async function TerminosPage() {
  const locale = await localeDeLaPagina();
  return <DocumentoLegal locale={locale} doc={documento(locale, 'terminos')} actual="terminos" />;
}
