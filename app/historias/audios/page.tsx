'use client';

/**
 * /historias/audios — Carrusel exposición + AudioPlayer en la misma página (sin navegar).
 * Layout compartido: `HistoriasFormatListPageLayout` (mismo shell que videos / escrito / fotos).
 * Hero y filtros centrados (max-w-5xl); carrusel a ancho completo. Espaciado y alto del carrusel viven en ese layout.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import AudioPlayer from '@/components/historia/AudioPlayer';
import { HistoriasFormatListPageLayout } from '@/components/historias/HistoriasFormatListPageLayout';
import { useStories } from '@/hooks/useStories';
import { storyToHistoriaAudio } from '@/lib/historias/audio-adapter';
import { storyPointToHistoricalExhibitionAudio } from '@/lib/historias/historical-exhibition-from-story';
import { pickStoriesForEmbeddedCarousel } from '@/lib/historias/historias-embedded-carousel-source';
import { foldText, haystackForStory, yearFromPublished } from '@/lib/historias/story-filter-helpers';
import type { StoryPoint } from '@/lib/map-data/stories';

function isAudioStory(s: StoryPoint): boolean {
  return Boolean(s.audioUrl || (s as StoryPoint & { hasAudio?: boolean }).hasAudio);
}

export default function HistoriasAudiosPage() {
  const allStories = useStories();
  const [selectedForAudio, setSelectedForAudio] = useState<StoryPoint | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterKeywords, setFilterKeywords] = useState('');
  const [shareSlideIndex, setShareSlideIndex] = useState(0);
  const [ethicalShareOpen, setEthicalShareOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const audioStoriesAll = useMemo(
    () => allStories.filter((s) => isAudioStory(s)),
    [allStories]
  );

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (const s of audioStoriesAll) {
      const y = yearFromPublished(s.publishedAt);
      if (y != null) set.add(y);
    }
    return [...set].sort((a, b) => b - a);
  }, [audioStoriesAll]);

  const audioStories = useMemo(() => {
    return audioStoriesAll.filter((s) => {
      if (filterCountry && (s.country || '').trim() !== filterCountry) return false;
      if (filterYear) {
        const y = yearFromPublished(s.publishedAt);
        if (String(y ?? '') !== filterYear) return false;
      }
      const q = filterKeywords.trim();
      if (q) {
        const hay = haystackForStory(s);
        const tokens = q
          .split(/\s+/)
          .map((t) => foldText(t))
          .filter(Boolean);
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [audioStoriesAll, filterCountry, filterYear, filterKeywords]);

  const hasActiveFilters = Boolean(filterCountry || filterYear || filterKeywords.trim());

  const { carouselStories: audioStoriesForCarousel, showingUnfilteredBecauseNoMatches } = useMemo(
    () => pickStoriesForEmbeddedCarousel(audioStories, audioStoriesAll, hasActiveFilters),
    [audioStories, audioStoriesAll, hasActiveFilters]
  );

  useEffect(() => {
    queueMicrotask(() => setSelectedForAudio(null));
  }, [filterCountry, filterYear, filterKeywords]);

  const exhibitionHistorias = useMemo(
    () => audioStoriesForCarousel.map(storyPointToHistoricalExhibitionAudio),
    [audioStoriesForCarousel]
  );

  const shareListResetKey = useMemo(
    () => audioStoriesForCarousel.map((s) => s.id).join('|'),
    [audioStoriesForCarousel]
  );

  useEffect(() => {
    queueMicrotask(() => {
      const n = exhibitionHistorias.length;
      if (n === 0) {
        setShareSlideIndex(0);
        return;
      }
      setShareSlideIndex(Math.min(Math.floor(n / 2), n - 1));
    });
  }, [shareListResetKey, exhibitionHistorias.length]);

  const shareTarget =
    exhibitionHistorias[
      Math.min(shareSlideIndex, Math.max(0, exhibitionHistorias.length - 1))
    ] ?? null;

  const openAudio = useCallback(
    (index: number) => {
      const s = audioStoriesForCarousel[index];
      if (!s?.audioUrl?.trim()) return;
      setSelectedForAudio(s);
    },
    [audioStoriesForCarousel]
  );

  const clearFilters = useCallback(() => {
    setFilterCountry('');
    setFilterYear('');
    setFilterKeywords('');
  }, []);

  const historiaParaPlayer = selectedForAudio ? storyToHistoriaAudio(selectedForAudio) : null;

  return (
    <>
      <HistoriasFormatListPageLayout
        activeTab="audios"
        filterCountry={filterCountry}
        setFilterCountry={setFilterCountry}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterKeywords={filterKeywords}
        setFilterKeywords={setFilterKeywords}
        yearOptions={yearOptions}
        hasActiveFilters={hasActiveFilters}
        showingUnfilteredBecauseNoMatches={showingUnfilteredBecauseNoMatches}
        filteredStoryCount={audioStories.length}
        allStoryCount={audioStoriesAll.length}
        shareTarget={shareTarget}
        ethicalShareOpen={ethicalShareOpen}
        setEthicalShareOpen={setEthicalShareOpen}
        clearFilters={clearFilters}
        exhibitionHistorias={exhibitionHistorias}
        contentMode="audio"
        onOpenContent={openAudio}
        onSlideChange={setShareSlideIndex}
        disableKeyboardNav={Boolean(selectedForAudio)}
      />
      {mounted && historiaParaPlayer
        ? ReactDOM.createPortal(
            <AudioPlayer historia={historiaParaPlayer} onClose={() => setSelectedForAudio(null)} />,
            document.body
          )
        : null}
    </>
  );
}
