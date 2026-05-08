'use client';

/**
 * Layout compartido de /historias/videos, /audios, /escrito, /fotos.
 * Nav, hero y filtros en columna centrada (primera vista); carrusel a ancho completo.
 * Masthead: `GlobalSiteChrome` en layout raíz. Footer global en `app/layout.tsx`.
 */
import { EthicalShareFlow, EthicalShareTriggerButton } from '@/components/stories/EthicalShareFlow';
import { ResonanceMailbox } from '@/components/stories/ResonanceMailbox';
import { SiteBreadcrumbs } from '@/components/layout/SiteBreadcrumbs';
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
      <main
        className="flex min-h-svh flex-col overflow-x-hidden"
        style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}
      >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="w-full shrink-0 px-4 pt-3 sm:px-6 md:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-[52rem]">
            <div className="mb-3 min-w-0">
              <SiteBreadcrumbs />
            </div>
            <header className="flex flex-shrink-0 flex-col gap-2 border-b border-gray-400/18 pb-5 text-center sm:gap-2.5 sm:text-left md:pb-6">
              <p
                className="mb-0 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] sm:text-xs"
                style={{ color: 'var(--almamundi-orange)' }}
              >
                {orangeKicker}
              </p>
              <h1 className="text-balance text-[1.6rem] font-semibold leading-[1.12] tracking-tight text-gray-800 sm:text-3xl md:text-[2.15rem] md:leading-[1.1] lg:text-5xl lg:tracking-tight">
                {HISTORIAS_LIST_HERO_TITLE}
              </h1>
              <p className="mx-auto max-w-xl text-pretty text-sm leading-relaxed text-gray-600 sm:mx-0 md:text-[1.0625rem] md:leading-snug">
                {HISTORIAS_LIST_HERO_SUBTITLE}
              </p>
            </header>

            <div className="mt-5 flex-shrink-0 md:mt-6" aria-label="Filtros de historias">
              <div
                className="w-full overflow-visible rounded-[22px] px-3 py-3.5 shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-5px_-5px_12px_rgba(255,255,255,0.88)] sm:px-4 sm:py-4 md:rounded-3xl"
                style={{
                  ...neu.cardInset,
                  borderRadius: 22,
                }}
              >
                <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-gray-600 sm:text-xs">
                  {HISTORIAS_FILTER_BLOCK_TITLE}
                </p>
                <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-3 lg:gap-y-3">
                  <label
                    className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-gray-600 lg:min-w-[min(100%,13rem)] lg:max-w-[18rem]"
                    htmlFor="historias-filter-pais"
                  >
                    País
                    <HistoriasFilterCountrySelect
                      id="historias-filter-pais"
                      value={filterCountry}
                      onChange={setFilterCountry}
                    />
                  </label>
                  <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-gray-600 lg:w-[7.75rem] lg:max-w-none">
                    Año
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="w-full min-h-[2.75rem] rounded-xl border border-gray-300/45 bg-[#E0E5EC] px-3 py-2 text-sm text-gray-800 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.42),inset_-2px_-2px_6px_rgba(255,255,255,0.88)] outline-none transition focus:ring-2 focus:ring-orange-400/40"
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
                  <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-gray-600 lg:min-w-[12rem] lg:flex-[1.15]">
                    Palabras clave
                    <input
                      type="search"
                      value={filterKeywords}
                      onChange={(e) => setFilterKeywords(e.target.value)}
                      placeholder={HISTORIAS_FILTER_KEYWORD_PLACEHOLDER}
                      autoComplete="off"
                      className="w-full min-h-[2.75rem] rounded-xl border border-gray-300/45 bg-[#E0E5EC] px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.42),inset_-2px_-2px_6px_rgba(255,255,255,0.88)] outline-none transition focus:ring-2 focus:ring-orange-400/40"
                      style={{ fontFamily: neu.APP_FONT }}
                    />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-white/35 pt-3 sm:justify-end lg:ml-auto lg:min-w-0 lg:flex-nowrap lg:border-t-0 lg:pt-0">
                    {shareTarget ? (
                      <div className="flex shrink-0 items-center gap-2.5">
                        <EthicalShareTriggerButton
                          onClick={() => setEthicalShareOpen(true)}
                          className="flex min-h-11 min-w-11 shrink-0 cursor-help items-center justify-center rounded-full border-2 border-[color:var(--almamundi-orange)] bg-[#E9ECF3] text-[color:var(--almamundi-orange)] shadow-[3px_3px_10px_rgba(163,177,198,0.5),-2px_-2px_8px_rgba(255,255,255,0.92)] transition hover:bg-[#e2e7f0]"
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
                      className={`w-full whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto md:text-[0.8125rem] ${
                        hasActiveFilters
                          ? 'text-gray-800 ring-1 ring-orange-400/35 ring-offset-2 ring-offset-[#E0E5EC]'
                          : 'text-gray-500'
                      }`}
                      style={{
                        ...neu.button,
                        opacity: hasActiveFilters ? 1 : 0.88,
                      }}
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
          className="mt-4 flex min-h-[min(480px,calc(100dvh-11rem))] flex-1 flex-col overflow-visible border-t border-gray-400/25 bg-[linear-gradient(180deg,rgba(224,229,236,0.42)_0%,#E0E5EC_16%,#e2e7ee_100%)] scroll-mt-24 px-2 pb-4 pt-5 sm:mt-5 sm:px-3 sm:pb-6 md:px-6 lg:min-h-[min(520px,calc(100dvh-10.5rem))] lg:px-10 lg:pb-8"
        >
          <div className="flex min-h-0 w-full flex-1 flex-col items-stretch justify-center">
            <HistoricalExhibitionCarousel
              embedded
              className="flex h-full min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden rounded-2xl"
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
