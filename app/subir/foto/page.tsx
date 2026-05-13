'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

/**
 * El envío de fotos vive en el flujo unificado /subir?format=foto
 * para mantener el mismo orden (historia → datos → envío → confirmación).
 */
export default function SubirFotoRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/subir?format=foto&step=capture');
  }, [router]);

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center px-6 ${historiasInterior.mainClassName}`}
      style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}
    >
      <p className="text-center text-base" style={{ color: neu.textBody }}>
        Te llevamos al espacio para subir tu historia en foto…
      </p>
    </main>
  );
}
