'use client';

/**
 * /historias — Redirige a la vista única: rueda de videos (/historias/videos).
 * Videos = historias; no hay grid separado.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoriasRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/historias/videos');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E0E5EC]">
      <p className="text-gray-600 font-sans">Redirigiendo…</p>
    </div>
  );
}
