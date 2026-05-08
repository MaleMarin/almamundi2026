'use client';

/**
 * /historias/videos — Historias en video: carrusel exposición + reproductor en la misma página.
 * Layout compartido: `HistoriasFormatListPageLayout` (mismo shell que audios / escrito / fotos).
 * Hero y filtros centrados (max-w-5xl); carrusel a ancho completo. Espaciado y alto del carrusel viven en ese layout.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import VideoPlayer, { type Historia } from '@/components/historia/VideoPlayer';
import { HistoriasFormatListPageLayout } from '@/components/historias/HistoriasFormatListPageLayout';
import { useStories } from '@/hooks/useStories';
import {
  historiasListFormatExpoLabel,
  historiasListFormatOrangeKicker,
} from '@/lib/historias/historias-format-list-ui';
import { isPublicGlobeFallbackDemoId, showPublicDemoStories } from '@/lib/demo-stories-public';
import { storyPointToHistoricalExhibitionStory } from '@/lib/historias/historical-exhibition-from-story';
import { pickStoriesForEmbeddedCarousel } from '@/lib/historias/historias-embedded-carousel-source';
import { foldText, haystackForStory, yearFromPublished } from '@/lib/historias/story-filter-helpers';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import { demoStoryFieldsFromPoint } from '@/lib/demo-stories-public';
import type { StoryPoint } from '@/lib/map-data/stories';

function isVideoStory(s: StoryPoint): boolean {
  return Boolean(s.videoUrl || s.hasVideo);
}

function defaultAvatar(name: string): string {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c23600" opacity="0.25"/><text x="50" y="62" font-family="sans-serif" font-size="44" font-weight="300" fill="#ff4500" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function formatPlace(s: StoryPoint): string {
  return [s.city, s.country].filter(Boolean).join(', ') || s.label || '';
}

function storyToVideoHistoria(s: StoryPoint): Historia {
  const raw =
    s.imageUrl ??
    s.thumbnailUrl ??
    (s as Record<string, unknown>).image ??
    (s as Record<string, unknown>).thumbnail ??
    (s as Record<string, unknown>).coverImage ??
    (s as Record<string, unknown>).videoThumbnail ??
    '';
  const thumb = (String(raw).trim() || '') as string;
  const placeholder =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#e8e4dc" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#8b7a6a">Sin imagen</text></svg>'
    );
  const demoStory = demoStoryFieldsFromPoint(s);
  return {
    id: s.id,
    titulo: s.title ?? s.label ?? 'Historia',
    subtitulo: s.subtitle,
    videoUrl: (s.videoUrl ?? '').trim() || '#',
    thumbnailUrl: thumb || placeholder,
    duracion: 0,
    fecha: s.publishedAt ?? '',
    autor: {
      nombre: s.authorName ?? s.author?.name ?? '',
      avatar: s.author?.avatar ?? s.authorAvatar ?? defaultAvatar(s.authorName ?? ''),
      ubicacion: formatPlace(s) || undefined,
      bio: s.author?.bio,
    },
    tags: s.tags,
    citaDestacada: s.quote,
    ...(demoStory ? { demoStory } : {}),
  };
}

export default function HistoriasVideosPage() {
  const allStories = useStories();
  const [activeVideo, setActiveVideo] = useState<Historia | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterKeywords, setFilterKeywords] = useState('');
  const [shareSlideIndex, setShareSlideIndex] = useState(0);
  const [ethicalShareOpen, setEthicalShareOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const videoStoriesAll = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !isPublicGlobeFallbackDemoId(s.id) && isVideoStory(s)
    );
    const apiIds = new Set(fromApi.map((s) => s.id));
    const demos =
      showPublicDemoStories()
        ? DEMO_VIDEO_STORIES.filter((d) => !apiIds.has(d.id))
        : [];
    return [...fromApi, ...demos];
  }, [allStories]);

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (const s of videoStoriesAll) {
      const y = yearFromPublished(s.publishedAt);
      if (y != null) set.add(y);
    }
    return [...set].sort((a, b) => b - a);
  }, [videoStoriesAll]);

  const videoStories = useMemo(() => {
    return videoStoriesAll.filter((s) => {
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
  }, [videoStoriesAll, filterCountry, filterYear, filterKeywords]);

  const hasActiveFilters = Boolean(filterCountry || filterYear || filterKeywords.trim());

  const { carouselStories: videoStoriesForCarousel, showingUnfilteredBecauseNoMatches } = useMemo(
    () => pickStoriesForEmbeddedCarousel(videoStories, videoStoriesAll, hasActiveFilters),
    [videoStories, videoStoriesAll, hasActiveFilters]
  );

  useEffect(() => {
    queueMicrotask(() => setActiveVideo(null));
  }, [filterCountry, filterYear, filterKeywords]);

  const exhibitionHistorias = useMemo(
    () => videoStoriesForCarousel.map(storyPointToHistoricalExhibitionStory),
    [videoStoriesForCarousel]
  );

  const shareListResetKey = useMemo(
    () => videoStoriesForCarousel.map((s) => s.id).join('|'),
    [videoStoriesForCarousel]
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
    return `${window.location.origin}/historias/${shareTarget.id}/video`;
  }, [shareTarget]);

  const openVideo = useCallback(
    (index: number) => {
      const s = videoStoriesForCarousel[index];
      if (!s?.videoUrl?.trim()) return;
      setActiveVideo(storyToVideoHistoria(s));
    },
    [videoStoriesForCarousel]
  );

  const clearFilters = useCallback(() => {
    setFilterCountry('');
    setFilterYear('');
    setFilterKeywords('');
  }, []);

  return (
    <>
      <HistoriasFormatListPageLayout
        activeTab="videos"
        orangeKicker={historiasListFormatOrangeKicker.video}
        filterCountry={filterCountry}
        setFilterCountry={setFilterCountry}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterKeywords={filterKeywords}
        setFilterKeywords={setFilterKeywords}
        yearOptions={yearOptions}
        hasActiveFilters={hasActiveFilters}
        showingUnfilteredBecauseNoMatches={showingUnfilteredBecauseNoMatches}
        filteredStoryCount={videoStories.length}
        allStoryCount={videoStoriesAll.length}
        shareTarget={shareTarget}
        ethicalShareOpen={ethicalShareOpen}
        setEthicalShareOpen={setEthicalShareOpen}
        shareUrlForFlow={shareUrlForFlow}
        expoLabel={historiasListFormatExpoLabel.video}
        clearFilters={clearFilters}
        exhibitionHistorias={exhibitionHistorias}
        contentMode="video"
        onOpenContent={openVideo}
        onSlideChange={setShareSlideIndex}
        disableKeyboardNav={Boolean(activeVideo)}
      />
      {mounted && activeVideo
        ? ReactDOM.createPortal(
            <VideoPlayer historia={activeVideo} onClose={() => setActiveVideo(null)} skipIntertitle />,
            document.body
          )
        : null}
    </>
  );
}
