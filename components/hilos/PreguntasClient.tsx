'use client';

import { CortinaTemas } from '@/components/hilos/CortinaTemas';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';

type PreguntasClientProps = {
  initialId: string | null;
  initialTema: string | null;
};

export function PreguntasClient({ initialId, initialTema }: PreguntasClientProps) {
  const { locale } = useHomeLocale();

  return (
    <main className="w-full px-6 pb-16 md:px-10">
      <CortinaTemas
        locale={locale}
        initialTema={initialTema}
        initialPregunta={initialId}
        enPagina
        titulo="h1"
      />
    </main>
  );
}
