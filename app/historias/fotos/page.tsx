'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';

/**
 * /historias/fotos — Carrusel exposición + FotoAlbum en la misma página.
 */
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import FotoAlbum, { type HistoriaFoto } from '@/components/historia/FotoAlbum';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import {
  EthicalShareFlow,
  EthicalShareTriggerButton,
} from '@/components/stories/EthicalShareFlow';
import { HistoricalExhibitionCarousel } from '@/components/stories/HistoricalExhibitionCarousel';
import { useStories } from '@/hooks/useStories';
import { storyPointToHistoricalExhibitionReader } from '@/lib/historias/historical-exhibition-from-story';
import { storyPointToHistoriaFotoModal } from '@/lib/historias/historia-modal-adapters';
import { foldText, haystackForStory, yearFromPublished } from '@/lib/historias/story-filter-helpers';
import { MOCK_STORIES } from '@/lib/almamundi/mock-data';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import type { StoryPoint } from '@/lib/map-data/stories';

function isPhotoStory(s: StoryPoint): boolean {
  const sp = s as StoryPoint & { images?: string[]; imagenes?: unknown[]; photos?: unknown[] };
  return Boolean(s.imageUrl || sp.images?.length || sp.imagenes?.length || sp.photos?.length);
}

/** Demo en carrusel cuando no hay álbumes en la API. */
const DEMO_FOTO_STORY = {
  id: 'demo-foto-1',
  lat: 20.6597,
  lng: -103.3496,
  label: MOCK_STORIES.fotos.titulo,
  title: MOCK_STORIES.fotos.titulo,
  subtitle: MOCK_STORIES.fotos.subtitulo,
  authorName: MOCK_STORIES.fotos.autor.nombre,
  author: {
    name: MOCK_STORIES.fotos.autor.nombre,
    avatar: MOCK_STORIES.fotos.autor.avatar,
  },
  city: 'Guadalajara',
  country: 'México',
  publishedAt: `${MOCK_STORIES.fotos.fecha}T12:00:00.000Z`,
  tags: MOCK_STORIES.fotos.tags,
  thumbnailUrl: MOCK_STORIES.fotos.imagenes[0]?.url,
  imagenes: MOCK_STORIES.fotos.imagenes,
  isDemo: true,
} as StoryPoint;

const EXPO_LABEL = 'alma.mundi / historias en fotografía';

export default function HistoriasFotosPage() {
  const allStories = useStories();
  const [fotoOpen, setFotoOpen] = useState<HistoriaFoto | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterKeywords, setFilterKeywords] = useState('');
  const [shareSlideIndex, setShareSlideIndex] = useState(0);
  const [ethicalShareOpen, setEthicalShareOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const photoStoriesAll = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo && isPhotoStory(s)
    );
    const hasDemo = fromApi.some((s) => s.id === DEMO_FOTO_STORY.id);
    return hasDemo ? fromApi : [DEMO_FOTO_STORY, ...fromApi];
  }, [allStories]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of photoStoriesAll) {
      const c = (s.country || '').trim();
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [photoStoriesAll]);

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

  useEffect(() => {
    setFotoOpen(null);
  }, [filterCountry, filterYear, filterKeywords]);

  const exhibitionHistorias = useMemo(
    () => photoStories.map((s) => storyPointToHistoricalExhibitionReader(s, 'foto')),
    [photoStories]
  );

  const shareListResetKey = useMemo(
    () => photoStories.map((s) => s.id).join('|'),
    [photoStories]
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
    return `${window.location.origin}/historias/${shareTarget.id}/foto`;
  }, [shareTarget]);

  const openFoto = useCallback(
    (index: number) => {
      const s = photoStories[index];
      if (!s) return;
      const h = storyPointToHistoriaFotoModal(s);
      if (h) setFotoOpen(h);
    },
    [photoStories]
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
          <HomeHardLink href="/#intro" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</HomeHardLink>
          <HomeHardLink href="/#como-funciona" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</HomeHardLink>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className={historiasInterior.navHistoriasAccordionClassName} />
          <span className={historiasInterior.navActiveClassName} style={{ ...neu.cardInset, color: 'var(--almamundi-orange)' }}>Fotografías</span>
          <Link href="/historias/videos" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Videos</Link>
          <Link href="/historias/audios" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Audios</Link>
          <Link href="/historias/escrito" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Escritos</Link>
          <HomeHardLink href="/#mapa" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textMain }}>Mapa</HomeHardLink>
        </div>
      </nav>

      <div className={historiasInterior.contentWrapClassName}>
        <header className={historiasInterior.headerClassName}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--almamundi-orange)' }}>
            Historias en fotografía
          </p>
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-gray-800 md:text-5xl">
            Imágenes que cuentan.
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-600 md:text-lg">
            Abre el álbum aquí mismo, sin otra URL.
          </p>
        </header>

        <div
          className="flex-shrink-0 px-6 md:px-12 pb-6"
          aria-label="Filtros de historias en fotografía"
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
                  placeholder="Ej. retrato comunidad"
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
                Mostrando {photoStories.length} de {photoStoriesAll.length} historias en fotografía.
              </p>
            ) : null}
          </div>
        </div>

        <section className={`${historiasInterior.sectionGrowClassName} min-h-0`}>
          <HistoricalExhibitionCarousel
            embedded
            className="shadow-xl"
            contentMode="foto"
            historias={exhibitionHistorias}
            spatialVariant="light-gallery"
            expoPaddingTopClassName="pt-10 sm:pt-14"
            expoMaxWidthClassName="max-w-[min(100%,96rem)]"
            tituloExposicion={EXPO_LABEL}
            onOpenContent={openFoto}
            onSlideChange={setShareSlideIndex}
            shareInGalleryChrome={false}
            disableKeyboardNav={Boolean(fotoOpen)}
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
          exhibitionLabel={EXPO_LABEL}
          themeTag={shareTarget.tags[0] ?? 'resiliencia'}
        />
      ) : null}

      {mounted && fotoOpen
        ? ReactDOM.createPortal(
            <FotoAlbum historia={fotoOpen} onClose={() => setFotoOpen(null)} />,
            document.body
          )
        : null}
    </main>
  );
}
