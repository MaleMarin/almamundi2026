'use client';

import { Suspense, useCallback, useLayoutEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { HomeFormatCards } from '@/components/home/HomeFormatCards';
import { StoryModal, type StoryModalMode } from '@/components/home/StoryModal';
import { neu } from '@/lib/historias-neumorph';

function isStoryMode(raw: string | null): raw is StoryModalMode {
  return raw === 'video' || raw === 'audio' || raw === 'texto' || raw === 'foto';
}

function SubirPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyMode, setStoryMode] = useState<StoryModalMode>('video');

  useLayoutEffect(() => {
    const raw = searchParams.get('format')?.toLowerCase() ?? null;
    if (isStoryMode(raw)) {
      setStoryMode(raw);
      setStoryOpen(true);
      return;
    }
    setStoryOpen(false);
  }, [searchParams]);

  const selectFormat = useCallback(
    (mode: StoryModalMode) => {
      setStoryMode(mode);
      setStoryOpen(true);
      router.replace(`/subir?format=${mode}`, { scroll: false });
    },
    [router]
  );

  const closeStory = useCallback(() => {
    setStoryOpen(false);
    router.replace('/subir', { scroll: false });
  }, [router]);

  return (
    <main
      className="flex min-h-0 flex-1 flex-col overflow-x-hidden"
      style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}
    >
      <h1 className="sr-only">Elegir formato de participación</h1>
      <HomeFormatCards
        fillViewport
        onRecordVideo={() => selectFormat('video')}
        onRecordAudio={() => selectFormat('audio')}
        onWriteStory={() => selectFormat('texto')}
        onRecordPhoto={() => selectFormat('foto')}
      />
      <p className="shrink-0 px-6 pb-4 pt-1 text-center md:pb-5">
        <HomeHardLink
          href="/#historias"
          className="text-sm font-medium underline-offset-4 hover:underline"
          style={{ color: neu.textBody }}
        >
          ← Volver al inicio
        </HomeHardLink>
      </p>
      <StoryModal
        isOpen={storyOpen}
        onClose={closeStory}
        mode={storyMode}
        chosenTopic={null}
        onClearTopic={() => {}}
      />
    </main>
  );
}

export default function SubirPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#E0E5EC' }}>
          <p className="text-sm text-gray-500">Cargando…</p>
        </main>
      }
    >
      <SubirPageInner />
    </Suspense>
  );
}
