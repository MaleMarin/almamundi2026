import { DocumentosLegalesNav } from '@/components/legal/DocumentoLegal';
import { localeDeLaPagina } from '@/lib/i18n/pagina-legal';
import { MisDatosPersonalesForm } from './MisDatosPersonalesForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await localeDeLaPagina();
  const title =
    locale === 'pt'
      ? 'Meus dados pessoais'
      : locale === 'en'
        ? 'My personal data'
        : 'Mis datos personales';
  return { title, description: title };
}

export default async function MisDatosPersonalesPage() {
  const locale = await localeDeLaPagina();
  return (
    <main className="min-h-svh bg-[#F5F4F2]" style={{ fontFamily: 'inherit' }}>
      <MisDatosPersonalesForm />
      <div className="mx-auto w-full max-w-[720px] px-6 pb-16">
        <DocumentosLegalesNav locale={locale} actual="datos" />
      </div>
    </main>
  );
}
