'use client';

/**
 * Layout compartido de /historias/videos, /audios, /escrito, /fotos.
 * Copiado de `app/historias/videos/page.tsx`: nav, hero, filtros, carrusel, footer y compartir.
 */
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import {
  EthicalShareFlow,
  EthicalShareTriggerWithCartaCompanion,
} from '@/components/stories/EthicalShareFlow';
import {
  HistoricalExhibitionCarousel,
  type ExhibitionContentMode,
} from '@/components/stories/HistoricalExhibitionCarousel';
import type { HistoricalExhibitionStory } from '@/lib/historias/historical-exhibition-demo';
import {
  HISTORIAS_CAROUSEL_ARIA_LABEL,
  HISTORIAS_FILTER_BLOCK_TITLE,
  HISTORIAS_FILTER_KEYWORD_PLACEHOLDER,
  HISTORIAS_LIST_HERO_SUBTITLE,
  HISTORIAS_LIST_HERO_TITLE,
} from '@/lib/historias/historias-format-list-ui';
import { HistoriasFilterCountrySelect } from '@/components/historias/HistoriasFilterCountrySelect';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

export type HistoriasFormatListActiveTab = 'videos' | 'audios' | 'escrito' | 'fotos';

export type HistoriasFormatListPageLayoutProps = {
  activeTab: HistoriasFormatListActiveTab;
  orangeKicker: string;
  filterCountry: string;
  setFilterCountry: (v: string) => void;
  filterYear: string;
  setFilterYear: (v: string) => void;
  filterKeywords: string;
  setFilterKeywords: (v: string) => void;
  yearOptions: number[];
  hasActiveFilters: boolean;
  showingUnfilteredBecauseNoMatches: boolean;
  filteredStoryCount: number;
  allStoryCount: number;
  shareTarget: HistoricalExhibitionStory | null;
  ethicalShareOpen: boolean;
  setEthicalShareOpen: (open: boolean) => void;
  shareUrlForFlow: string;
  expoLabel: string;
  clearFilters: () => void;
  exhibitionHistorias: HistoricalExhibitionStory[];
  contentMode: ExhibitionContentMode;
  onOpenContent: (index: number) => void;
  onSlideChange: (index: number) => void;
  disableKeyboardNav: boolean;
};

export function HistoriasFormatListPageLayout({
  activeTab,
  orangeKicker,
  filterCountry,
  setFilterCountry,
  filterYear,
  setFilterYear,
  filterKeywords,
  setFilterKeywords,
  yearOptions,
  hasActiveFilters,
  showingUnfilteredBecauseNoMatches,
  filteredStoryCount,
  allStoryCount,
  shareTarget,
  ethicalShareOpen,
  setEthicalShareOpen,
  shareUrlForFlow,
  expoLabel,
  clearFilters,
  exhibitionHistorias,
  contentMode,
  onOpenContent,
  onSlideChange,
  disableKeyboardNav,
}: HistoriasFormatListPageLayoutProps) {
  return (
    <main
      className="flex min-h-svh flex-col overflow-x-hidden"
      style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}
    >
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <HomeHardLink href="/" className="flex min-w-0 flex-shrink-0 items-center pr-2">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </HomeHardLink>
        <div className={historiasInterior.navLinksRowClassName}>
          <ActiveInternalNavLink href="/#intro" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.navLinkIdle }}>Nuestro propósito</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#como-funciona" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.navLinkIdle }}>¿Cómo funciona?</ActiveInternalNavLink>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.navLinkIdle }} className={historiasInterior.navHistoriasAccordionClassName} />
          <ActiveInternalNavLink href="/historias/videos" className={activeTab === 'videos' ? `btn-almamundi ${historiasInterior.navActiveClassName}` : historiasInterior.navLinkClassName} style={activeTab === 'videos' ? neu.cardInset : { ...neu.button, color: neu.navLinkIdle }}>Videos</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/historias/audios" className={activeTab === 'audios' ? `btn-almamundi ${historiasInterior.navActiveClassName}` : historiasInterior.navLinkClassName} style={activeTab === 'audios' ? neu.cardInset : { ...neu.button, color: neu.navLinkIdle }}>Audios</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/historias/escrito" className={activeTab === 'escrito' ? `btn-almamundi ${historiasInterior.navActiveClassName}` : historiasInterior.navLinkClassName} style={activeTab === 'escrito' ? neu.cardInset : { ...neu.button, color: neu.navLinkIdle }}>Escritos</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/historias/fotos" className={activeTab === 'fotos' ? `btn-almamundi ${historiasInterior.navActiveClassName}` : historiasInterior.navLinkClassName} style={activeTab === 'fotos' ? neu.cardInset : { ...neu.button, color: neu.navLinkIdle }}>Fotografías</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#mapa" className={`btn-almamundi ${historiasInterior.navLinkClassName}`} style={{ ...neu.button, color: neu.navLinkIdle }}>Mapa</ActiveInternalNavLink>
        </div>
      </nav>

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-6 min-h-0">
          <header className="flex flex-shrink-0 flex-col pt-[28px]">
            <p
              className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--almamundi-orange)' }}
            >
              {orangeKicker}
            </p>
            <h1 className="mb-1 text-3xl font-semibold leading-[1.1] tracking-tight text-gray-800 md:text-5xl">
              {HISTORIAS_LIST_HERO_TITLE}
            </h1>
            <p className="max-w-2xl text-base text-gray-600 md:text-lg">
              {HISTORIAS_LIST_HERO_SUBTITLE}
            </p>
          </header>

        <div className="mt-5 flex-shrink-0" aria-label="Filtros de historias">
          <div
            className="w-full overflow-visible rounded-2xl px-4 py-4"
            style={neu.cardInset}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              {HISTORIAS_FILTER_BLOCK_TITLE}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2 lg:grid-cols-4 lg:items-end">
              <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-gray-600" htmlFor="historias-filter-pais">
                País
                <HistoriasFilterCountrySelect
                  id="historias-filter-pais"
                  value={filterCountry}
                  onChange={setFilterCountry}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-gray-600">
                Año
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full rounded-xl border border-gray-300/40 bg-[#E0E5EC] px-2.5 py-1.5 text-sm text-gray-800 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.45),inset_-2px_-2px_6px_rgba(255,255,255,0.85)] outline-none focus:ring-2 focus:ring-orange-400/40"
                  style={{ fontFamily: neu.APP_FONT }}
                >
                  <option value="">Todos los años</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-gray-600 sm:col-span-2 lg:col-span-1">
                Palabras clave
                <input
                  type="search"
                  value={filterKeywords}
                  onChange={(e) => setFilterKeywords(e.target.value)}
                  placeholder={HISTORIAS_FILTER_KEYWORD_PLACEHOLDER}
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-300/40 bg-[#E0E5EC] px-2.5 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.45),inset_-2px_-2px_6px_rgba(255,255,255,0.85)] outline-none focus:ring-2 focus:ring-orange-400/40"
                  style={{ fontFamily: neu.APP_FONT }}
                />
              </label>
              <div className="flex flex-wrap items-end justify-end gap-2">
                {shareTarget ? (
                  <EthicalShareTriggerWithCartaCompanion
                    onClick={() => setEthicalShareOpen(true)}
                    buttonClassName="min-h-9 min-w-9 shrink-0 rounded-full border border-gray-300/35 bg-[#E0E5EC] text-gray-700 shadow-[2px_2px_6px_rgba(163,177,198,0.45),-2px_-2px_6px_rgba(255,255,255,0.85)] hover:bg-[#d8dde6]"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  style={neu.button}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
            {showingUnfilteredBecauseNoMatches ? (
              <p className="mt-2 text-xs text-amber-900/85" role="status">
                Ninguna historia coincide con los filtros. El carrusel muestra las {allStoryCount}{' '}
                historias disponibles. Ajustá los filtros o tocá «Limpiar filtros».
              </p>
            ) : null}
            {hasActiveFilters && !showingUnfilteredBecauseNoMatches ? (
              <p className="mt-2 text-xs text-gray-500" role="status">
                Mostrando {filteredStoryCount} de {allStoryCount} historias.
              </p>
            ) : null}
          </div>
        </div>

        <section
          id="historias-carrusel"
          aria-label={HISTORIAS_CAROUSEL_ARIA_LABEL}
          className="mt-5 flex h-[calc(100vh-280px)] min-h-[320px] w-full flex-shrink-0 flex-col overflow-hidden border-t border-gray-300/50 scroll-mt-28"
        >
          <div className="flex h-full w-full min-h-0 flex-col items-center justify-center">
            <HistoricalExhibitionCarousel
              embedded
              className="shadow-xl flex h-full min-h-0 w-full max-w-full flex-1 flex-col"
              contentMode={contentMode}
              historias={exhibitionHistorias}
              spatialVariant="light-gallery"
              expoPaddingTopClassName="pt-0"
              expoMaxWidthClassName="max-w-full"
              tituloExposicion={expoLabel}
              onOpenContent={onOpenContent}
              onSlideChange={onSlideChange}
              shareInGalleryChrome={false}
              disableKeyboardNav={disableKeyboardNav}
            />
          </div>
        </section>
        </div>
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
          exhibitionLabel={expoLabel}
          themeTag={shareTarget.tags[0] ?? 'resiliencia'}
        />
      ) : null}
    </main>
  );
}
