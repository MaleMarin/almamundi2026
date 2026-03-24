'use client';

import { useCallback, useState } from 'react';
import { HomeFirstPart } from '@/components/home/HomeFirstPart';
import { MapSectionLocked } from '@/components/politica-v2/MapSectionLocked';
import { Footer } from '@/components/layout/Footer';
import { StoryModal, type ChosenInspirationTopic, type StoryModalMode } from '@/components/home/StoryModal';
import { InspirationFormatPickers } from '@/components/home/InspirationFormatPickers';

/**
 * Home AlmaMundi — neumorfismo, intro, cuatro tarjetas, mapa (#mapa), footer.
 * StoryModal e inspiración viven aquí; las tarjetas abren el modal sin cambiar el layout de HomeFirstPart.
 */
export default function Home() {
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyMode, setStoryMode] = useState<StoryModalMode>('video');
  const [chosenTopic, setChosenTopic] = useState<ChosenInspirationTopic | null>(null);
  const [inspirationOpen, setInspirationOpen] = useState(false);
  const [formatPickerOpen, setFormatPickerOpen] = useState(false);

  const openStory = useCallback((mode: StoryModalMode, clearTopic: boolean) => {
    if (clearTopic) setChosenTopic(null);
    setStoryMode(mode);
    setStoryOpen(true);
  }, []);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#E0E5EC]">
      <HomeFirstPart
        onShowPurpose={() => scrollToId('intro')}
        onShowInspiration={() => setInspirationOpen(true)}
        onRecordVideo={() => openStory('video', true)}
        onRecordAudio={() => openStory('audio', true)}
        onWriteStory={() => openStory('texto', true)}
        onUploadPhoto={() => openStory('foto', true)}
        basePath="/"
      />
      <MapSectionLocked />
      <Footer />

      <InspirationFormatPickers
        inspirationOpen={inspirationOpen}
        onCloseInspiration={() => setInspirationOpen(false)}
        formatPickerOpen={formatPickerOpen}
        onCloseFormatPicker={() => setFormatPickerOpen(false)}
        onTopicCommitted={(topic) => {
          setChosenTopic(topic);
          setInspirationOpen(false);
          setFormatPickerOpen(true);
        }}
        onFormatCommitted={(mode) => {
          setStoryMode(mode);
          setFormatPickerOpen(false);
          setStoryOpen(true);
        }}
      />

      <StoryModal
        isOpen={storyOpen}
        onClose={() => setStoryOpen(false)}
        mode={storyMode}
        chosenTopic={chosenTopic}
        onClearTopic={() => setChosenTopic(null)}
      />
    </main>
  );
}
