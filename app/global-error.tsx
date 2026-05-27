'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { source: 'boundary.global' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#0F172A', color: '#fff', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Algo salió mal</h1>
        <p style={{ opacity: 0.8, fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
          Ha ocurrido un error. Puedes intentar de nuevo o volver al inicio.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{ padding: '8px 16px', borderRadius: 12, background: '#f97316', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Intentar de nuevo
          </button>
          <HomeHardLink
            href="/"
            style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: 500 }}
          >
            Ir al inicio
          </HomeHardLink>
        </div>
      </body>
    </html>
  );
}
