'use client';

import { useEffect } from 'react';
import { hardNavigateTo } from '@/lib/home-hard-nav';

/** Enlaces antiguos a /subir/foto van a las 4 tarjetas de la home. */
export default function SubirFotoRedirectPage() {
  useEffect(() => {
    hardNavigateTo('/#historias');
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#E0E5EC' }}>
      <p className="text-sm text-gray-600">Te llevamos a contar tu historia…</p>
    </main>
  );
}
