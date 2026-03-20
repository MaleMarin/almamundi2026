'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HomeFirstPart } from '@/components/home/HomeFirstPart';
import { MapSectionLocked } from '@/components/politica-v2/MapSectionLocked';
import { Footer } from '@/components/layout/Footer';

/**
 * Home AlmaMundi — neumorfismo, intro, cuatro tarjetas, mapa (#mapa), footer.
 * No sustituir por otras plantillas; ajustes de UI en `HomeFirstPart` / sección mapa acordados.
 */
export default function Home() {
  const router = useRouter();

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#E0E5EC]">
      <HomeFirstPart
        onShowPurpose={() => scrollToId('intro')}
        onShowInspiration={() => scrollToId('mapa')}
        onRecordVideo={() => router.push('/subir?format=video')}
        onRecordAudio={() => router.push('/subir?format=audio')}
        onWriteStory={() => router.push('/subir?format=texto')}
        onUploadPhoto={() => router.push('/subir?format=foto')}
        basePath="/"
      />
      <MapSectionLocked />
      <Footer />
    </main>
  );
}
