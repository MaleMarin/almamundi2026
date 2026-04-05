'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SalaHilo, type SalaHiloMuestraInput } from '@/components/muestras/SalaHilo';
import { getMuestraBySlug, type Muestra } from '@/lib/muestras';

function slugFromParams(params: ReturnType<typeof useParams>): string {
  const raw = params?.slug;
  if (typeof raw === 'string' && raw.length > 0) {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  if (Array.isArray(raw) && raw[0]) {
    try {
      return decodeURIComponent(String(raw[0]));
    } catch {
      return String(raw[0]);
    }
  }
  return '';
}

function toSalaMuestra(muestra: Muestra): SalaHiloMuestraInput {
  return {
    titulo: muestra.title,
    descripcion: [muestra.intro, muestra.description].filter(Boolean).join('\n\n'),
    curadora: 'Equipo de AlmaMundi',
    historias: muestra.items.map((it) => ({
      id: it.id,
      titulo: it.title,
      quote: it.context || (it.textBody ? it.textBody.slice(0, 280) : '') || '—',
      meta: `${it.alias} · ${it.date}`,
      formato: it.type,
    })),
  };
}

function MuestraDetailBody() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = slugFromParams(params);
  const muestra = getMuestraBySlug(slug);
  const skipPortal = searchParams.get('portal') !== '1';

  if (!muestra) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#e6e9ee',
          color: '#1a1f2a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <p style={{ margin: 0 }}>No se encontró esta muestra.</p>
        <Link
          href="/muestras"
          className="text-blue-600 font-semibold underline underline-offset-[5px] hover:text-blue-800"
        >
          Volver al listado
        </Link>
      </main>
    );
  }

  return (
    <div
      id="muestra-sala-host"
      style={{
        width: '100%',
        minWidth: 0,
        minHeight: 'calc(100vh - 6rem)',
        backgroundColor: '#e6e9ee',
        color: '#1a1f2a',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <SalaHilo muestra={toSalaMuestra(muestra)} skipPortal={skipPortal} />
    </div>
  );
}

export default function MuestraDetailPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100%',
            minHeight: 'calc(100vh - 6rem)',
            backgroundColor: '#e6e9ee',
          }}
        />
      }
    >
      <MuestraDetailBody />
    </Suspense>
  );
}
