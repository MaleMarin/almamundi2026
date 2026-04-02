'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';

/**
 * /historias/videos — Historias en video: carrusel exposición + reproductor en la misma página.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import VideoPlayer, { type Historia } from '@/components/historia/VideoPlayer';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import {
  EthicalShareFlow,
  EthicalShareTriggerButton,
} from '@/components/stories/EthicalShareFlow';
import { HistoricalExhibitionCarousel } from '@/components/stories/HistoricalExhibitionCarousel';
import { useStories } from '@/hooks/useStories';
import { storyPointToHistoricalExhibitionStory } from '@/lib/historias/historical-exhibition-from-story';
import { foldText, haystackForStory, yearFromPublished } from '@/lib/historias/story-filter-helpers';
import { DEMO_VIDEO_STORIES } from '@/lib/demo-video-stories';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
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

  useEffect(() => setMounted(true), []);

  const videoStoriesAll = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo && isVideoStory(s)
    );
    const apiIds = new Set(fromApi.map((s) => s.id));
    const demos = DEMO_VIDEO_STORIES.filter((d) => !apiIds.has(d.id));
    return [...fromApi, ...demos];
  }, [allStories]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of videoStoriesAll) {
      const c = (s.country || '').trim();
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [videoStoriesAll]);

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

  useEffect(() => {
    setActiveVideo(null);
  }, [filterCountry, filterYear, filterKeywords]);

  const exhibitionHistorias = useMemo(
    () => videoStories.map(storyPointToHistoricalExhibitionStory),
    [videoStories]
  );

  const shareListResetKey = useMemo(
    () => videoStories.map((s) => s.id).join('|'),
    [videoStories]
  );

  useEffect(() => {
    const n = exhibitionHistorias.length;
    if (n === 0) {
      setShareSlideIndex(0);
      return;
    }
    setShareSlideIndex(Math.min(Math.floor(n / 2), n - 1));
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
      const s = videoStories[index];
      if (!s?.videoUrl?.trim()) return;
      setActiveVideo(storyToVideoHistoria(s));
    },
    [videoStories]
  );

  const clearFilters = useCallback(() => {
    setFilterCountry('');
    setFilterYear('');
    setFilterKeywords('');
  }, []);

  const hasActiveFilters = Boolean(filterCountry || filterYear || filterKeywords.trim());

  return (
    <main className={historiasInterior.mainClassName} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <HomeHardLink href="/" className="flex min-w-0 flex-shrink-0 items-center pr-2">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </HomeHardLink>
        <div className={historiasInterior.navLinksRowClassName}>
          <ActiveInternalNavLink href="/#intro" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#como-funciona" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</ActiveInternalNavLink>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className={historiasInterior.navHistoriasAccordionClassName} />
          <ActiveInternalNavLink href="/historias/videos" className={`btn-almamundi ${historiasInterior.navActiveClassName}`} style={neu.cardInset}>Videos</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/historias/audios" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Audios</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/historias/escrito" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Escritos</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/historias/fotos" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Fotografías</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#mapa" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textMain }}>Mapa</ActiveInternalNavLink>
        </div>
      </nav>

      <div className={historiasInterior.contentWrapClassName}>
        <header className={historiasInterior.headerClassName}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--almamundi-orange)' }}>
            Historias en video
          </p>
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-gray-800 md:text-5xl">
            El mundo tiene millones de historias que nadie conoce.
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-600 md:text-lg">
            Estas son algunas.
          </p>
        </header>

        <div
          className="flex-shrink-0 px-6 md:px-12 pb-6"
          aria-label="Filtros de historias con video"
        >
          <div
            className="mx-auto w-full max-w-[min(100%,96rem)] rounded-3xl p-5 md:p-6"
            style={neu.cardInset}
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">
              Buscar por país, año o palabras clave
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-gray-600">
                País
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full rounded-2xl border border-gray-300/40 bg-[#E0E5EC] px-3 py-2.5 text-base text-gray-800 shadow-[inset_3px_3px_8px_rgba(163,177,198,0.45),inset_-3px_-3px_8px_rgba(255,255,255,0.85)] outline-none focus:ring-2 focus:ring-orange-400/40"
                  style={{ fontFamily: neu.APP_FONT }}
                >
                  <option value="">Todos los países</option>
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-gray-600">
                Año
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full rounded-2xl border border-gray-300/40 bg-[#E0E5EC] px-3 py-2.5 text-base text-gray-800 shadow-[inset_3px_3px_8px_rgba(163,177,198,0.45),inset_-3px_-3px_8px_rgba(255,255,255,0.85)] outline-none focus:ring-2 focus:ring-orange-400/40"
                  style={{ fontFamily: neu.APP_FONT }}
                >
                  <option value="">Cualquier año</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-gray-600 sm:col-span-2 lg:col-span-1">
                Palabras clave
                <input
                  type="search"
                  value={filterKeywords}
                  onChange={(e) => setFilterKeywords(e.target.value)}
                  placeholder="Ej. migración familia"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-gray-300/40 bg-[#E0E5EC] px-3 py-2.5 text-base text-gray-800 placeholder:text-gray-400 shadow-[inset_3px_3px_8px_rgba(163,177,198,0.45),inset_-3px_-3px_8px_rgba(255,255,255,0.85)] outline-none focus:ring-2 focus:ring-orange-400/40"
                  style={{ fontFamily: neu.APP_FONT }}
                />
              </label>
              <div className="flex flex-wrap items-end justify-end gap-3">
                {shareTarget ? (
                  <EthicalShareTriggerButton
                    onClick={() => setEthicalShareOpen(true)}
                    className="min-h-[44px] min-w-[44px] shrink-0 rounded-full border border-gray-300/35 bg-[#E0E5EC] text-gray-700 shadow-[3px_3px_8px_rgba(163,177,198,0.45),-3px_-3px_8px_rgba(255,255,255,0.85)] hover:bg-[#d8dde6]"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  style={neu.button}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
            {hasActiveFilters ? (
              <p className="mt-3 text-sm text-gray-500" role="status">
                Mostrando {videoStories.length} de {videoStoriesAll.length} historias con video.
              </p>
            ) : null}
          </div>
        </div>

        <section className={`${historiasInterior.sectionGrowClassName} min-h-0`}>
          <HistoricalExhibitionCarousel
            embedded
            className="shadow-xl"
            contentMode="video"
            historias={exhibitionHistorias}
            spatialVariant="light-gallery"
            expoPaddingTopClassName="pt-10 sm:pt-14"
            expoMaxWidthClassName="max-w-[min(100%,96rem)]"
            tituloExposicion="alma.mundi / historias en video"
            onOpenContent={openVideo}
            onSlideChange={setShareSlideIndex}
            shareInGalleryChrome={false}
            disableKeyboardNav={Boolean(activeVideo)}
          />
        </section>
      </div>

      <Footer />

      {shareTarget ? (
        <EthicalShareFlow
          key={shareTarget.id}
          open={ethicalShareOpen}
          onClose={() => setEthicalShareOpen(false)}
          authorName={shareTarget.nombre}
          storyTitle={shareTarget.titulo}
          quote={shareTarget.cita}
          imageUrl={shareTarget.imagen_principal}
          shareUrl={shareUrlForFlow}
          exhibitionLabel="alma.mundi / historias en video"
          themeTag={shareTarget.tags[0] ?? 'resiliencia'}
        />
      ) : null}

      {mounted && activeVideo
        ? ReactDOM.createPortal(
            <VideoPlayer historia={activeVideo} onClose={() => setActiveVideo(null)} skipIntertitle />,
            document.body
          )
        : null}
    </main>
  );
}
