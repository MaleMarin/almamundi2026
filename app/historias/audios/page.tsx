'use client';

/**
 * /historias/audios — Carrusel exposición + AudioPlayer en la misma página (sin navegar).
 * Layout compartido: `HistoriasFormatListPageLayout` (mismo shell que videos / escrito / fotos).
 * Hero y filtros centrados (max-w-5xl); carrusel a ancho completo. Espaciado y alto del carrusel viven en ese layout.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import AudioPlayer, { type HistoriaAudio } from '@/components/historia/AudioPlayer';
import { HistoriasFormatListPageLayout } from '@/components/historias/HistoriasFormatListPageLayout';
import { useStories } from '@/hooks/useStories';
import { storyToHistoriaAudio } from '@/lib/historias/audio-adapter';
import {
  historiasListFormatExpoLabel,
  historiasListFormatOrangeKicker,
} from '@/lib/historias/historias-format-list-ui';
import {
  demoStoryFieldsFromPoint,
  isPublicGlobeFallbackDemoId,
  showPublicDemoStories,
} from '@/lib/demo-stories-public';
import { storyPointToHistoricalExhibitionAudio } from '@/lib/historias/historical-exhibition-from-story';
import { pickStoriesForEmbeddedCarousel } from '@/lib/historias/historias-embedded-carousel-source';
import { foldText, haystackForStory, yearFromPublished } from '@/lib/historias/story-filter-helpers';
import { MOCK_STORIES } from '@/lib/almamundi/mock-data';
import { DEMO_AUDIO_STORIES } from '@/lib/historias/historias-demo-stories';
import type { StoryPoint } from '@/lib/map-data/stories';

function isAudioStory(s: StoryPoint): boolean {
  return Boolean(s.audioUrl || (s as StoryPoint & { hasAudio?: boolean }).hasAudio);
}

function storyToHistoriaAudioOrDemo(s: StoryPoint): HistoriaAudio {
  const demoStory = demoStoryFieldsFromPoint(s);
  if (s.id.startsWith('demo-audio-')) {
    const m = MOCK_STORIES.audio;
    const nombre = s.authorName ?? m.autor.nombre;
    return {
      id: s.id,
      titulo: s.title ?? m.titulo,
      subtitulo: s.subtitle ?? m.subtitulo,
      audioUrl: (s.audioUrl ?? m.audioUrl).trim(),
      thumbnailUrl: s.thumbnailUrl ?? m.thumbnailUrl,
      duracion: m.duracion,
      fecha: s.publishedAt?.slice(0, 10) ?? m.fecha,
      citaDestacada: s.quote ?? m.citaDestacada,
      frases: m.frases,
      autor: {
        nombre,
        avatar: s.author?.avatar ?? m.autor.avatar,
        ubicacion: [s.city, s.country].filter(Boolean).join(', ') || m.autor.ubicacion,
        bio: (m.autor as { bio?: string }).bio,
      },
      tags: s.tags ?? m.tags,
      ...(demoStory ? { demoStory } : {}),
    };
  }
  return storyToHistoriaAudio(s);
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

  const audioStoriesAll = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !isPublicGlobeFallbackDemoId(s.id) && isAudioStory(s)
    );
    const apiIds = new Set(fromApi.map((s) => s.id));
    const demos =
      showPublicDemoStories()
        ? DEMO_AUDIO_STORIES.filter((d) => !apiIds.has(d.id))
        : [];
    return [...fromApi, ...demos];
  }, [allStories]);

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

  const shareUrlForFlow = useMemo(() => {
    if (typeof window === 'undefined' || !shareTarget) return '';
    return `${window.location.origin}/historias/${shareTarget.id}/audio`;
  }, [shareTarget]);

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

  const historiaParaPlayer = selectedForAudio ? storyToHistoriaAudioOrDemo(selectedForAudio) : null;

  return (
    <>
      <HistoriasFormatListPageLayout
        activeTab="audios"
        orangeKicker={historiasListFormatOrangeKicker.audio}
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
        shareUrlForFlow={shareUrlForFlow}
        expoLabel={historiasListFormatExpoLabel.audio}
        clearFilters={clearFilters}
        exhibitionHistorias={exhibitionHistorias}
        contentMode="audio"
        onOpenContent={openAudio}
        onSlideChange={setShareSlideIndex}
        disableKeyboardNav={Boolean(selectedForAudio)}
        immersiveMediaOpen={Boolean(selectedForAudio)}
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
