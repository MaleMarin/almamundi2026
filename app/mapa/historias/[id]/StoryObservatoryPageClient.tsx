'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { hardNavigateTo } from '@/lib/home-hard-nav';
import type { StoryPoint } from '@/lib/map-data/stories';
import type { EmotionVisual } from '@/lib/audioEmotion';
import { EMOTION_VISUALS } from '@/lib/audioEmotion';
import { incrementStoriesRead } from '@/lib/sessionTracker';
import { StoryInvitation } from '@/components/mapa/StoryInvitation';
import { SimilarStories } from '@/components/mapa/SimilarStories';
import { ObservatoryShell } from '@/components/observatory/ObservatoryShell';
import { StoryObservatory } from '@/components/observatory/StoryObservatory';
import { SaveToCollectionButton } from '@/components/collection/SaveToCollectionButton';

export function StoryObservatoryPageClient({ story }: { story: StoryPoint }) {
  const searchParams = useSearchParams();
  const fromMusic = searchParams.get('from') === 'music';
  const backHref = '/#mapa';
  const subtitleLeft = [story.city, story.country].filter(Boolean).join(', ') || undefined;

  const [currentEmotion, setCurrentEmotion] = useState<EmotionVisual>(EMOTION_VISUALS.silence);
  const [entranceDone, setEntranceDone] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (story?.id) incrementStoriesRead(story.id);
  }, [story?.id]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntranceDone(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main
      ref={mainRef}
      className="min-h-screen flex flex-col relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(160deg, #090e1a 0%, #0f1729 100%)',
        transition: 'background 800ms ease',
      }}
    >
      {/* Fondo vivo: sugestión de globo girando detrás (roadmap 1A) */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 120%, rgba(30,60,120,0.4) 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 30% 20%, rgba(20,40,80,0.25) 0%, transparent 45%),
            radial-gradient(ellipse 70% 70% at 70% 60%, rgba(15,35,70,0.2) 0%, transparent 40%)
          `,
          animation: 'cinema-bg-drift 20s ease-in-out infinite alternate',
        }}
      />
      <div
        className="relative z-[1] flex flex-col min-h-screen transition-all duration-[900ms] ease-out"
        style={{
          opacity: entranceDone ? 1 : 0,
          transform: entranceDone ? 'translateY(0)' : 'translateY(28px)',
        }}
      >
        <ObservatoryShell
        title={story.label}
        subtitleLeft={subtitleLeft}
        variant="page"
        backHref={backHref}
        actions={
          <SaveToCollectionButton
            kind="stories"
            id={story.id}
            title={story.label}
            subtitle={subtitleLeft ?? '—'}
          />
        }
      >
        <StoryObservatory story={story} onEmotionChange={setCurrentEmotion} />
        <SimilarStories storyId={story.id} />
        <StoryInvitation onInvite={() => hardNavigateTo('/?openModal=true')} />
        <div className="mt-8">
          <HomeHardLink
            href={backHref}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition font-medium"
          >
            Volver al globo
          </HomeHardLink>
        </div>
      </ObservatoryShell>
      </div>

      {/* Overlay de emoción — encima de todo el contenido, tinta la pantalla */}
      <div
        aria-hidden
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         5,
          pointerEvents:  'none',
          background:     currentEmotion.overlayColor,
          transition:     'background 800ms ease',
        }}
      />
    </main>
  );
}
