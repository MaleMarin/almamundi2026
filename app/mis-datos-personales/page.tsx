import type { Metadata } from 'next';
import { LegalLanguageNotice } from '@/components/legal/LegalLanguageNotice';
import { MisDatosPersonalesForm } from './MisDatosPersonalesForm';

export const metadata: Metadata = {
  title: 'Solicitud sobre tus datos personales · AlmaMundi',
  description:
    'Formulario para solicitar información o ejercer derechos sobre los datos personales compartidos con AlmaMundi.' };

export default function MisDatosPersonalesPage() {
  return (
    <main
      className="min-h-svh bg-[#e8ecf0]"
      style={{ fontFamily: 'inherit' }}
    >
      <LegalLanguageNotice />
      <MisDatosPersonalesForm />
    </main>
  );
}
