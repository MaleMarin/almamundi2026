import { DocumentoLegal, documento } from '@/components/legal/DocumentoLegal';
import { localeDeLaPagina, metaLegal } from '@/lib/i18n/pagina-legal';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return metaLegal('privacidad');
}

export default async function PrivacidadPage() {
  const locale = await localeDeLaPagina();
  return <DocumentoLegal locale={locale} doc={documento(locale, 'privacidad')} actual="privacidad" />;
}
