'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getStoryById } from '@/lib/map-data/stories';
import { ObservatoryShell } from '@/components/observatory/ObservatoryShell';
import { StoryObservatory } from '@/components/observatory/StoryObservatory';
import { SaveToCollectionButton } from '@/components/collection/SaveToCollectionButton';

export default function ObservatorioHistoriaModalPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const story = getStoryById(id);

  useEffect(() => {
    if (!story) router.replace('/mapa?view=historias');
  }, [story, router]);

  const handleClose = () => router.back();

  if (!story) return null;

  const subtitleLeft = [story.city, story.country].filter(Boolean).join(', ') || undefined;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0F172A]/98 backdrop-blur-xl overflow-hidden">
      <ObservatoryShell
        title={story.label}
        subtitleLeft={subtitleLeft}
        variant="modal"
        backHref="/mapa?view=historias"
        onClose={handleClose}
        actions={
          <SaveToCollectionButton
            kind="stories"
            id={story.id}
            title={story.label}
            subtitle={subtitleLeft ?? '—'}
          />
        }
      >
        <StoryObservatory story={story} />
      </ObservatoryShell>
    </div>
  );
}
