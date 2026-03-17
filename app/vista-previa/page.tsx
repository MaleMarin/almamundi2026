'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Vista previa: redirige a /preview-home.
 * Client-side para que siempre funcione aunque el deploy sea antiguo.
 */
export default function VistaPreviaPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/preview-home');
  }, [router]);

  return (
    <main className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
      <p className="text-gray-500">Redirigiendo a vista previa…</p>
    </main>
  );
}
