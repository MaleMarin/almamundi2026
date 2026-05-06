'use client';

/**
 * /historias/escrito — Carrusel exposición + TextoReader en la misma página.
 * Layout compartido: `HistoriasFormatListPageLayout` (mismo shell que videos / audios / fotos).
 * Hero y filtros centrados (max-w-5xl); carrusel a ancho completo. Espaciado y alto del carrusel viven en ese layout.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import TextoReader, { type HistoriaTexto } from '@/components/historia/TextoReader';
import { HistoriasFormatListPageLayout } from '@/components/historias/HistoriasFormatListPageLayout';
import { useStories } from '@/hooks/useStories';
import {
  historiasListFormatExpoLabel,
  historiasListFormatOrangeKicker,
} from '@/lib/historias/historias-format-list-ui';
import { isPublicGlobeFallbackDemoId, showPublicDemoStories } from '@/lib/demo-stories-public';
import { storyPointToHistoricalExhibitionReader } from '@/lib/historias/historical-exhibition-from-story';
import { storyPointToHistoriaTextoModal } from '@/lib/historias/historia-modal-adapters';
import { pickStoriesForEmbeddedCarousel } from '@/lib/historias/historias-embedded-carousel-source';
import { foldText, haystackForStory, yearFromPublished } from '@/lib/historias/story-filter-helpers';
import { DEMO_TEXT_STORIES } from '@/lib/historias/historias-demo-stories';
import type { StoryPoint } from '@/lib/map-data/stories';

function isTextStory(s: StoryPoint): boolean {
  return Boolean(s.body || s.hasText || (s as StoryPoint & { content?: string }).content);
}

export default function HistoriasEscritoPage() {
  const allStories = useStories();
  const [textoOpen, setTextoOpen] = useState<HistoriaTexto | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterKeywords, setFilterKeywords] = useState('');
  const [shareSlideIndex, setShareSlideIndex] = useState(0);
  const [ethicalShareOpen, setEthicalShareOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const textStoriesAll = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !isPublicGlobeFallbackDemoId(s.id) && isTextStory(s)
    );
    const apiIds = new Set(fromApi.map((s) => s.id));
    const demos =
      showPublicDemoStories()
        ? DEMO_TEXT_STORIES.filter((d) => !apiIds.has(d.id))
        : [];
    return [...fromApi, ...demos];
  }, [allStories]);

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (const s of textStoriesAll) {
      const y = yearFromPublished(s.publishedAt);
      if (y != null) set.add(y);
    }
    return [...set].sort((a, b) => b - a);
  }, [textStoriesAll]);

  const textStories = useMemo(() => {
    return textStoriesAll.filter((s) => {
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
  }, [textStoriesAll, filterCountry, filterYear, filterKeywords]);

  const hasActiveFilters = Boolean(filterCountry || filterYear || filterKeywords.trim());

  const { carouselStories: textStoriesForCarousel, showingUnfilteredBecauseNoMatches } = useMemo(
    () => pickStoriesForEmbeddedCarousel(textStories, textStoriesAll, hasActiveFilters),
    [textStories, textStoriesAll, hasActiveFilters]
  );

  useEffect(() => {
    queueMicrotask(() => setTextoOpen(null));
  }, [filterCountry, filterYear, filterKeywords]);

  const exhibitionHistorias = useMemo(
    () => textStoriesForCarousel.map((s) => storyPointToHistoricalExhibitionReader(s, 'texto')),
    [textStoriesForCarousel]
  );

  const shareListResetKey = useMemo(
    () => textStoriesForCarousel.map((s) => s.id).join('|'),
    [textStoriesForCarousel]
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
    return `${window.location.origin}/historias/${shareTarget.id}/texto`;
  }, [shareTarget]);

  const openTexto = useCallback(
    (index: number) => {
      const s = textStoriesForCarousel[index];
      if (!s) return;
      const h = storyPointToHistoriaTextoModal(s);
      if (h) setTextoOpen(h);
    },
    [textStoriesForCarousel]
  );

  const clearFilters = useCallback(() => {
    setFilterCountry('');
    setFilterYear('');
    setFilterKeywords('');
  }, []);

  return (
    <>
      <HistoriasFormatListPageLayout
        activeTab="escrito"
        orangeKicker={historiasListFormatOrangeKicker.texto}
        filterCountry={filterCountry}
        setFilterCountry={setFilterCountry}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterKeywords={filterKeywords}
        setFilterKeywords={setFilterKeywords}
        yearOptions={yearOptions}
        hasActiveFilters={hasActiveFilters}
        showingUnfilteredBecauseNoMatches={showingUnfilteredBecauseNoMatches}
        filteredStoryCount={textStories.length}
        allStoryCount={textStoriesAll.length}
        shareTarget={shareTarget}
        ethicalShareOpen={ethicalShareOpen}
        setEthicalShareOpen={setEthicalShareOpen}
        shareUrlForFlow={shareUrlForFlow}
        expoLabel={historiasListFormatExpoLabel.texto}
        clearFilters={clearFilters}
        exhibitionHistorias={exhibitionHistorias}
        contentMode="texto"
        onOpenContent={openTexto}
        onSlideChange={setShareSlideIndex}
        disableKeyboardNav={Boolean(textoOpen)}
        immersiveMediaOpen={Boolean(textoOpen)}
      />
      {mounted && textoOpen
        ? ReactDOM.createPortal(
            <TextoReader historia={textoOpen} onClose={() => setTextoOpen(null)} />,
            document.body
          )
        : null}
    </>
  );
}
