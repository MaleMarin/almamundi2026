import type { Metadata } from 'next';
import { SiteBreadcrumbs } from '@/components/layout/SiteBreadcrumbs';
import { SITE_FONT_STACK } from '@/lib/typography';
import { MisDatosPersonalesForm } from './MisDatosPersonalesForm';

export const metadata: Metadata = {
  title: 'Solicitud sobre tus datos personales · AlmaMundi',
  description:
    'Formulario para solicitar información o ejercer derechos sobre los datos personales compartidos con AlmaMundi.',
};

export default function MisDatosPersonalesPage() {
  return (
    <main
      className="min-h-svh bg-[#e8ecf0]"
      style={{ fontFamily: SITE_FONT_STACK }}
    >
      <div className="mx-auto max-w-2xl px-4 pt-8">
        <SiteBreadcrumbs />
      </div>
      <MisDatosPersonalesForm />
    </main>
  );
}
