'use client';

import { useEffect } from 'react';
import { hardNavigateTo } from '@/lib/home-hard-nav';

/**
 * Alias de acceso al inicio real (`/`). Navegación completa para no servir una home en caché antigua.
 */
export default function VistaPreviaPage() {
  useEffect(() => {
    hardNavigateTo('/');
  }, []);

  return (
    <main className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
      <p className="text-gray-500">Redirigiendo al inicio…</p>
    </main>
  );
}
