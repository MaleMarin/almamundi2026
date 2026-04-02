'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SalaHilo, type SalaHiloMuestraInput } from '@/components/muestras/SalaHilo';
import { getMuestraBySlug, type Muestra } from '@/lib/muestras';

function toSalaMuestra(muestra: Muestra): SalaHiloMuestraInput {
  return {
    titulo: muestra.title,
    descripcion: [muestra.intro, muestra.description].filter(Boolean).join('\n\n'),
    curadora: 'Curaduría AlmaMundi',
    historias: muestra.items.map((it) => ({
      id: it.id,
      titulo: it.title,
      quote: it.context || (it.textBody ? it.textBody.slice(0, 280) : '') || '—',
      meta: `${it.alias} · ${it.date}`,
      formato: it.type,
    })),
  };
}

export default function MuestraDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const muestra = getMuestraBySlug(slug);

  if (!muestra) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#080808',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <p style={{ margin: 0 }}>No se encontró esta muestra.</p>
        <Link href="/muestras" style={{ color: '#d2aa5a', textDecoration: 'none' }}>
          Volver al listado
        </Link>
      </main>
    );
  }

  return <SalaHilo muestra={toSalaMuestra(muestra)} />;
}
