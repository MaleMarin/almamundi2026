import Link from 'next/link';
import { SiteBreadcrumbs } from '@/components/layout/SiteBreadcrumbs';
import type { Metadata } from 'next';
import { SITE_FONT_STACK } from '@/lib/typography';

export const metadata: Metadata = {
  title: 'Educación mediática | AlmaMundi',
  description:
    'Marcos y recursos para analizar la información, la ciudadanía digital y el pensamiento crítico con enfoque en derechos humanos.',
};

export default function EducacionMediaticaPage() {
  return (
    <main
      className="min-h-screen bg-[#E0E5EC] px-6 pb-32 pt-28 md:px-14 md:pb-44 md:pt-36"
      style={{ fontFamily: SITE_FONT_STACK, color: '#1a1f2a' }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <SiteBreadcrumbs />
        </div>
        <Link
          href="/"
          className="inline-block text-sm font-semibold tracking-wide text-[#FF4A1C] underline decoration-2 underline-offset-[6px] transition-opacity hover:opacity-85"
        >
          ← Volver al inicio
        </Link>
        <h1 className="mt-10 text-3xl font-bold leading-tight tracking-tight text-[#2d3748] md:text-4xl">
          Educación mediática
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-[#4A5568] md:text-xl">
          Esta sección reúne el enfoque de AlmaMundi sobre alfabetización mediática y ciudadanía
          digital: leer fuentes con criterio, entender formatos y contextos, y participar en el
          espacio público con respeto a los derechos humanos.
        </p>
        <p className="mt-5 text-lg leading-relaxed text-[#4A5568] md:text-xl">
          Pronto ampliaremos aquí guías, materiales para aula y comunidad, y enlaces a iniciativas
          aliadas. Mientras tanto, puedes seguir explorando historias en el mapa y los formatos de
          la home.
        </p>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/#historias"
            className="inline-flex items-center justify-center rounded-full bg-[#FF4A1C] px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            Ver formatos en la home
          </Link>
          <Link
            href="/#mapa"
            className="inline-flex items-center justify-center rounded-full border-2 border-[#4A5568]/35 bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#2d3748] transition-colors hover:border-[#FF4A1C] hover:text-[#FF4A1C]"
          >
            Ir al mapa
          </Link>
        </div>
      </div>
    </main>
  );
}
