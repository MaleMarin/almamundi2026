import { DocumentoLegal, documento } from '@/components/legal/DocumentoLegal';
import { localeDeLaPagina, metaLegal } from '@/lib/i18n/pagina-legal';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return metaLegal('contacto');
}

export default async function ContactoPage() {
  const locale = await localeDeLaPagina();
  return <DocumentoLegal locale={locale} doc={documento(locale, 'contacto')} actual="contacto" />;
}
