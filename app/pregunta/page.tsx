import { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import PreguntaForm from '@/components/pregunta/PreguntaForm';
import { ALMA_LOCALE_COOKIE, parseAlmaLocale } from '@/lib/i18n/locale';
import { preguntaPageMeta } from '@/lib/i18n/public-meta';

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  return preguntaPageMeta(parseAlmaLocale(jar.get(ALMA_LOCALE_COOKIE)?.value));
}

export default function PreguntaPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <PreguntaForm />
      </Suspense>
    </main>
  );
}
