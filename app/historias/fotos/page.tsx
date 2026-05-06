'use client';

/**
 * /historias/fotos — Carrusel exposición + FotoAlbum en la misma página.
 * Layout compartido: `HistoriasFormatListPageLayout` (mismo shell que videos / audios / escrito).
 * Hero y filtros centrados (max-w-5xl); carrusel a ancho completo. Espaciado y alto del carrusel viven en ese layout.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import FotoAlbum, { type HistoriaFoto } from '@/components/historia/FotoAlbum';
import { HistoriasFormatListPageLayout } from '@/components/historias/HistoriasFormatListPageLayout';
import { useStories } from '@/hooks/useStories';
import {
  historiasListFormatExpoLabel,
  historiasListFormatOrangeKicker,
} from '@/lib/historias/historias-format-list-ui';
import { isPublicGlobeFallbackDemoId, showPublicDemoStories } from '@/lib/demo-stories-public';
import { storyPointToHistoricalExhibitionReader } from '@/lib/historias/historical-exhibition-from-story';
import { storyPointToHistoriaFotoModal } from '@/lib/historias/historia-modal-adapters';
import { pickStoriesForEmbeddedCarousel } from '@/lib/historias/historias-embedded-carousel-source';
import { foldText, haystackForStory, yearFromPublished } from '@/lib/historias/story-filter-helpers';
import { DEMO_FOTO_STORIES } from '@/lib/historias/historias-demo-stories';
import type { StoryPoint } from '@/lib/map-data/stories';

function isPhotoStory(s: StoryPoint): boolean {
  const sp = s as StoryPoint & { images?: string[]; imagenes?: unknown[]; photos?: unknown[] };
  return Boolean(s.imageUrl || sp.images?.length || sp.imagenes?.length || sp.photos?.length);
}

export default function HistoriasFotosPage() {
  const allStories = useStories();
  const [fotoOpen, setFotoOpen] = useState<HistoriaFoto | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterKeywords, setFilterKeywords] = useState('');
  const [shareSlideIndex, setShareSlideIndex] = useState(0);
  const [ethicalShareOpen, setEthicalShareOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const photoStoriesAll = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !isPublicGlobeFallbackDemoId(s.id) && isPhotoStory(s)
    );
    const apiIds = new Set(fromApi.map((s) => s.id));
    const demos =
      showPublicDemoStories()
        ? DEMO_FOTO_STORIES.filter((d) => !apiIds.has(d.id))
        : [];
    return [...fromApi, ...demos];
  }, [allStories]);

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (const s of photoStoriesAll) {
      const y = yearFromPublished(s.publishedAt);
      if (y != null) set.add(y);
    }
    return [...set].sort((a, b) => b - a);
  }, [photoStoriesAll]);

  const photoStories = useMemo(() => {
    return photoStoriesAll.filter((s) => {
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
  }, [photoStoriesAll, filterCountry, filterYear, filterKeywords]);

  const hasActiveFilters = Boolean(filterCountry || filterYear || filterKeywords.trim());

  const { carouselStories: photoStoriesForCarousel, showingUnfilteredBecauseNoMatches } = useMemo(
    () => pickStoriesForEmbeddedCarousel(photoStories, photoStoriesAll, hasActiveFilters),
    [photoStories, photoStoriesAll, hasActiveFilters]
  );

  useEffect(() => {
    queueMicrotask(() => setFotoOpen(null));
  }, [filterCountry, filterYear, filterKeywords]);

  const exhibitionHistorias = useMemo(
    () => photoStoriesForCarousel.map((s) => storyPointToHistoricalExhibitionReader(s, 'foto')),
    [photoStoriesForCarousel]
  );

  const shareListResetKey = useMemo(
    () => photoStoriesForCarousel.map((s) => s.id).join('|'),
    [photoStoriesForCarousel]
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
    return `${window.location.origin}/historias/${shareTarget.id}/foto`;
  }, [shareTarget]);

  const openFoto = useCallback(
    (index: number) => {
      const s = photoStoriesForCarousel[index];
      if (!s) return;
      const h = storyPointToHistoriaFotoModal(s);
      if (h) setFotoOpen(h);
    },
    [photoStoriesForCarousel]
  );

  const clearFilters = useCallback(() => {
    setFilterCountry('');
    setFilterYear('');
    setFilterKeywords('');
  }, []);

  return (
    <>
      <HistoriasFormatListPageLayout
        activeTab="fotos"
        orangeKicker={historiasListFormatOrangeKicker.foto}
        filterCountry={filterCountry}
        setFilterCountry={setFilterCountry}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterKeywords={filterKeywords}
        setFilterKeywords={setFilterKeywords}
        yearOptions={yearOptions}
        hasActiveFilters={hasActiveFilters}
        showingUnfilteredBecauseNoMatches={showingUnfilteredBecauseNoMatches}
        filteredStoryCount={photoStories.length}
        allStoryCount={photoStoriesAll.length}
        shareTarget={shareTarget}
        ethicalShareOpen={ethicalShareOpen}
        setEthicalShareOpen={setEthicalShareOpen}
        shareUrlForFlow={shareUrlForFlow}
        expoLabel={historiasListFormatExpoLabel.foto}
        clearFilters={clearFilters}
        exhibitionHistorias={exhibitionHistorias}
        contentMode="foto"
        onOpenContent={openFoto}
        onSlideChange={setShareSlideIndex}
        disableKeyboardNav={Boolean(fotoOpen)}
        immersiveMediaOpen={Boolean(fotoOpen)}
      />
      {mounted && fotoOpen
        ? ReactDOM.createPortal(
            <FotoAlbum historia={fotoOpen} onClose={() => setFotoOpen(null)} />,
            document.body
          )
        : null}
    </>
  );
}
