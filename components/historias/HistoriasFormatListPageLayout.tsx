'use client';

/**
 * Layout compartido de /historias/videos, /audios, /escrito, /fotos.
 * Nav, hero y filtros en columna centrada (primera vista); carrusel a ancho completo.
 * Footer global en `app/layout.tsx`.
 */
import { HistoriasInteriorSiteHeader } from '@/components/historias/HistoriasInteriorSiteHeader';
import { EthicalShareFlow, EthicalShareTriggerButton } from '@/components/stories/EthicalShareFlow';
import { ResonanceMailbox } from '@/components/stories/ResonanceMailbox';
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
  HISTORIAS_SHARE_ICONS_LEGEND,
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
    <>
      <HistoriasInteriorSiteHeader />
      <main
        className={`flex min-h-svh flex-col overflow-x-hidden ${historiasInterior.fixedHeaderContentPadClassName}`}
        style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}
      >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="w-full shrink-0 px-6 pt-[16px] md:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-5xl">
            <header className="flex flex-shrink-0 flex-col text-center sm:text-left">
              <p
                className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'var(--almamundi-orange)' }}
              >
                {orangeKicker}
              </p>
              <h1 className="mb-1 text-3xl font-semibold leading-[1.1] tracking-tight text-gray-800 md:text-5xl">
                {HISTORIAS_LIST_HERO_TITLE}
              </h1>
              <p className="mx-auto max-w-2xl text-base text-gray-600 sm:mx-0 md:text-lg">
                {HISTORIAS_LIST_HERO_SUBTITLE}
              </p>
            </header>

            <div className="mt-3 flex-shrink-0" aria-label="Filtros de historias">
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
                      <div className="flex shrink-0 items-end gap-2">
                        <EthicalShareTriggerButton
                          onClick={() => setEthicalShareOpen(true)}
                          className="min-h-10 min-w-10 shrink-0 cursor-help rounded-full border-2 border-[color:var(--almamundi-orange)] bg-[#E0E5EC] p-2.5 text-[color:var(--almamundi-orange)] shadow-[2px_2px_6px_rgba(163,177,198,0.45),-2px_-2px_6px_rgba(255,255,255,0.85)] hover:bg-[#d8dde6]"
                          title={`${HISTORIAS_SHARE_ICONS_LEGEND[0].label}: ${HISTORIAS_SHARE_ICONS_LEGEND[0].text}`}
                          ariaLabel={`${HISTORIAS_SHARE_ICONS_LEGEND[0].label}. ${HISTORIAS_SHARE_ICONS_LEGEND[0].text}`}
                        />
                        <ResonanceMailbox
                          storyId={shareTarget.id}
                          recipientName={shareTarget.nombre}
                          triggerLayout="inline"
                          triggerTone="orange"
                          triggerTitle={`${HISTORIAS_SHARE_ICONS_LEGEND[1].label}: ${HISTORIAS_SHARE_ICONS_LEGEND[1].text}`}
                          triggerAriaLabel={`${HISTORIAS_SHARE_ICONS_LEGEND[1].label}. ${HISTORIAS_SHARE_ICONS_LEGEND[1].text}`}
                          className="cursor-help"
                        />
                      </div>
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
                    historias disponibles. Ajusta los filtros o pulsa «Limpiar filtros».
                  </p>
                ) : null}
                {hasActiveFilters && !showingUnfilteredBecauseNoMatches ? (
                  <p className="mt-2 text-xs text-gray-500" role="status">
                    Mostrando {filteredStoryCount} de {allStoryCount} historias.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <section
          id="historias-carrusel"
          aria-label={HISTORIAS_CAROUSEL_ARIA_LABEL}
          className="mt-3 flex h-[calc(100vh-232px)] min-h-[300px] w-full flex-shrink-0 flex-col overflow-hidden border-t border-gray-300/50 scroll-mt-24 px-2 sm:px-4 md:px-6 lg:px-10"
        >
          <div className="flex h-full w-full min-h-0 max-w-[100vw] flex-col items-stretch justify-center">
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
              showMailboxInGalleryChrome={false}
              disableKeyboardNav={disableKeyboardNav}
            />
          </div>
        </section>
      </div>

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
    </>
  );
}
