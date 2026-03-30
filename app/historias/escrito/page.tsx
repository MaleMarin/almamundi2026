'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';

/**
 * /historias/escrito — Carrusel exposición + TextoReader en la misma página.
 */
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import TextoReader, { type HistoriaTexto } from '@/components/historia/TextoReader';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import {
  EthicalShareFlow,
  EthicalShareTriggerButton,
} from '@/components/stories/EthicalShareFlow';
import { HistoricalExhibitionCarousel } from '@/components/stories/HistoricalExhibitionCarousel';
import { useStories } from '@/hooks/useStories';
import { storyPointToHistoricalExhibitionReader } from '@/lib/historias/historical-exhibition-from-story';
import { storyPointToHistoriaTextoModal } from '@/lib/historias/historia-modal-adapters';
import { foldText, haystackForStory, yearFromPublished } from '@/lib/historias/story-filter-helpers';
import { MOCK_STORIES } from '@/lib/almamundi/mock-data';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import type { StoryPoint } from '@/lib/map-data/stories';

function isTextStory(s: StoryPoint): boolean {
  return Boolean(s.body || s.hasText || (s as StoryPoint & { content?: string }).content);
}

/** Demo en carrusel cuando aún no hay escritos en la API (mismo criterio que audios/videos). */
const DEMO_TEXT_STORY: StoryPoint = {
  id: 'demo-texto-1',
  lat: -34.6037,
  lng: -58.3816,
  label: MOCK_STORIES.texto.titulo,
  title: MOCK_STORIES.texto.titulo,
  subtitle: MOCK_STORIES.texto.subtitulo,
  authorName: MOCK_STORIES.texto.autor.nombre,
  author: {
    name: MOCK_STORIES.texto.autor.nombre,
    avatar: MOCK_STORIES.texto.autor.avatar,
  },
  city: 'Buenos Aires',
  country: 'Argentina',
  body: MOCK_STORIES.texto.contenido,
  hasText: true,
  publishedAt: `${MOCK_STORIES.texto.fecha}T12:00:00.000Z`,
  tags: MOCK_STORIES.texto.tags,
  thumbnailUrl: 'https://picsum.photos/seed/almamundi-texto-demo/800/600',
  excerpt: `${MOCK_STORIES.texto.contenido.slice(0, 140).trim()}…`,
  quote: 'Eres un puente, no una fractura.',
  isDemo: true,
};

const EXPO_LABEL = 'alma.mundi / historias escritas';

export default function HistoriasEscritoPage() {
  const allStories = useStories();
  const [textoOpen, setTextoOpen] = useState<HistoriaTexto | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterKeywords, setFilterKeywords] = useState('');
  const [shareSlideIndex, setShareSlideIndex] = useState(0);
  const [ethicalShareOpen, setEthicalShareOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const textStoriesAll = useMemo(() => {
    const fromApi = allStories.filter(
      (s) => !(s as StoryPoint & { isDemo?: boolean }).isDemo && isTextStory(s)
    );
    const hasDemo = fromApi.some((s) => s.id === DEMO_TEXT_STORY.id);
    return hasDemo ? fromApi : [DEMO_TEXT_STORY, ...fromApi];
  }, [allStories]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of textStoriesAll) {
      const c = (s.country || '').trim();
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [textStoriesAll]);

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

  useEffect(() => {
    setTextoOpen(null);
  }, [filterCountry, filterYear, filterKeywords]);

  const exhibitionHistorias = useMemo(
    () => textStories.map((s) => storyPointToHistoricalExhibitionReader(s, 'texto')),
    [textStories]
  );

  const shareListResetKey = useMemo(
    () => textStories.map((s) => s.id).join('|'),
    [textStories]
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
    return `${window.location.origin}/historias/${shareTarget.id}/texto`;
  }, [shareTarget]);

  const openTexto = useCallback(
    (index: number) => {
      const s = textStories[index];
      if (!s) return;
      const h = storyPointToHistoriaTextoModal(s);
      if (h) setTextoOpen(h);
    },
    [textStories]
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
          <span className={historiasInterior.navActiveClassName} style={{ ...neu.cardInset, color: 'var(--almamundi-orange)' }}>Escritos</span>
          <Link href="/historias/videos" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Videos</Link>
          <Link href="/historias/audios" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Audios</Link>
          <Link href="/historias/fotos" className={historiasInterior.navLinkClassName} style={{ ...neu.button, color: neu.textBody }}>Fotografías</Link>
          <HomeHardLink href="/#mapa" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.textMain }}>Mapa</HomeHardLink>
        </div>
      </nav>

      <div className={historiasInterior.contentWrapClassName}>
        <header className={historiasInterior.headerClassName}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--almamundi-orange)' }}>
            Historias escritas
          </p>
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-gray-800 md:text-5xl">
            Palabras que cuentan.
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-600 md:text-lg">
            Lee en esta misma página, sin cambiar de ruta.
          </p>
        </header>

        <div
          className="flex-shrink-0 px-6 md:px-12 pb-6"
          aria-label="Filtros de historias escritas"
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
                  placeholder="Ej. memoria esperanza"
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
                Mostrando {textStories.length} de {textStoriesAll.length} historias escritas.
              </p>
            ) : null}
          </div>
        </div>

        <section className={`${historiasInterior.sectionGrowClassName} min-h-0`}>
          <HistoricalExhibitionCarousel
            embedded
            className="shadow-xl"
            contentMode="texto"
            historias={exhibitionHistorias}
            spatialVariant="light-gallery"
            expoPaddingTopClassName="pt-10 sm:pt-14"
            expoMaxWidthClassName="max-w-[min(100%,96rem)]"
            tituloExposicion={EXPO_LABEL}
            onOpenContent={openTexto}
            onSlideChange={setShareSlideIndex}
            shareInGalleryChrome={false}
            disableKeyboardNav={Boolean(textoOpen)}
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

      {mounted && textoOpen
        ? ReactDOM.createPortal(
            <TextoReader historia={textoOpen} onClose={() => setTextoOpen(null)} />,
            document.body
          )
        : null}
    </main>
  );
}
