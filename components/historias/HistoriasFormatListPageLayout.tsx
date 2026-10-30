'use client';

/**
 * Layout compartido de /historias/videos, /audios, /escrito, /fotos.
 * Nav, hero y filtros en columna centrada (primera vista); carrusel a ancho completo.
 * Masthead: `GlobalSiteChrome` en layout raíz. Footer global en `app/layout.tsx`.
 */
import { EthicalShareTriggerButton } from '@/components/stories/EthicalShareTrigger';
import { ShareAfterNotice } from '@/components/stories/ShareAfterNotice';
import { ResonanceMailbox } from '@/components/stories/ResonanceMailbox';
import {
  HistoricalExhibitionCarousel,
  type ExhibitionContentMode } from '@/components/stories/HistoricalExhibitionCarousel';
import type { HistoricalExhibitionStory } from '@/lib/historias/historical-exhibition-story-types';
import { formatPagesCopy } from '@/lib/historias/format-pages-copy';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { interpolate } from '@/lib/i18n/locale';
import { HistoriasFilterCountrySelect } from '@/components/historias/HistoriasFilterCountrySelect';
import { neu } from '@/lib/historias-neumorph';

export type HistoriasFormatListActiveTab = 'videos' | 'audios' | 'escrito' | 'fotos';

export type HistoriasFormatListPageLayoutProps = {
  activeTab: HistoriasFormatListActiveTab;
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
  clearFilters: () => void;
  exhibitionHistorias: HistoricalExhibitionStory[];
  contentMode: ExhibitionContentMode;
  onOpenContent: (index: number) => void;
  onSlideChange: (index: number) => void;
  disableKeyboardNav: boolean;
};

export function HistoriasFormatListPageLayout({
  activeTab,
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
  clearFilters,
  exhibitionHistorias,
  contentMode,
  onOpenContent,
  onSlideChange,
  disableKeyboardNav }: HistoriasFormatListPageLayoutProps) {
  const { locale } = useHomeLocale();
  const copy = formatPagesCopy(locale);
  const shareLegend = `${copy.shareLabel}: ${copy.shareText}`;
  return (
    <>
      <main
        className="flex min-h-svh flex-col overflow-x-hidden"
        style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}
      >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="w-full shrink-0 px-4 pt-3 sm:px-6 md:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-[52rem]">
            <header className="flex flex-shrink-0 flex-col gap-2 border-b border-gray-400/18 pb-5 text-center sm:gap-2.5 sm:text-left md:pb-6">
              <p
                className="mb-0 text-[length:var(--fs-etiqueta)] font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'var(--almamundi-orange)' }}
              >
                {copy.kicker[activeTab]}
              </p>
              <h1 className="text-balance text-[length:var(--fs-titular)] font-normal leading-[1.12] text-gray-800 md:leading-[1.1] ">
                {copy.heroTitle}
              </h1>
              <p className="mx-auto max-w-xl text-pretty text-[length:var(--fs-pequeno)] leading-relaxed text-gray-600 sm:mx-0 md:leading-snug">
                {copy.heroSubtitle}
              </p>
            </header>

            <div className="mt-5 flex-shrink-0 md:mt-6" aria-label={copy.filterAria}>
              <div
                className="w-full overflow-visible rounded-[22px] px-3 py-3.5 shadow-[inset_6px_6px_12px_rgba(120,110,100,0.28),inset_-5px_-5px_12px_rgba(255,255,255,0.88)] sm:px-4 sm:py-4 md:rounded-3xl"
                style={{
                  ...neu.cardInset,
                  borderRadius: 22 }}
              >
                <p className="mb-2.5 text-[length:var(--fs-etiqueta)] font-semibold uppercase text-gray-600 tracking-[0.12em]">
                  {copy.filterTitle}
                </p>
                <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-3 lg:gap-y-3">
                  <label
                    className="flex min-w-0 flex-1 flex-col gap-1.5 text-[length:var(--fs-etiqueta)] font-medium text-gray-600 lg:min-w-[min(100%,13rem)] lg:max-w-[16.5rem]"
                    htmlFor="historias-filter-pais"
                  >
                    {copy.country}
                    <HistoriasFilterCountrySelect
                      id="historias-filter-pais"
                      value={filterCountry}
                      onChange={setFilterCountry}
                    />
                  </label>
                  <label className="flex w-full shrink-0 flex-none flex-col gap-1.5 text-[length:var(--fs-etiqueta)] font-medium text-gray-600 min-w-[15.5rem] sm:min-w-[16rem] lg:w-[16.5rem] lg:max-w-[16.5rem]">
                    {copy.year}
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="box-border w-full min-h-[2.75rem] min-w-[15.5rem] rounded-xl border border-gray-300/45 bg-[var(--home-bg)] py-2 pl-3 pr-12 text-[length:var(--fs-pequeno)] text-gray-800 shadow-[inset_2px_2px_6px_rgba(120,110,100,0.28),inset_-2px_-2px_6px_rgba(255,255,255,0.88)] outline-none transition focus:ring-2 focus:ring-orange-400/40"
                      style={{ fontFamily: neu.APP_FONT }}
                    >
                      <option value="">{copy.allYears}</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={String(y)}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[length:var(--fs-etiqueta)] font-medium text-gray-600 lg:min-w-[12rem] lg:flex-[1.15]">
                    {copy.keywords}
                    <input
                      type="search"
                      value={filterKeywords}
                      onChange={(e) => setFilterKeywords(e.target.value)}
                      placeholder={copy.keywordPlaceholder}
                      autoComplete="off"
                      className="w-full min-h-[2.75rem] rounded-xl border border-gray-300/45 bg-[var(--home-bg)] px-3 py-2 text-[length:var(--fs-pequeno)] text-gray-800 placeholder:text-[#646E7E] shadow-[inset_2px_2px_6px_rgba(120,110,100,0.28),inset_-2px_-2px_6px_rgba(255,255,255,0.88)] outline-none transition focus:ring-2 focus:ring-orange-400/40"
                      style={{ fontFamily: neu.APP_FONT }}
                    />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-white/35 pt-3 sm:justify-end lg:ml-auto lg:min-w-0 lg:flex-nowrap lg:border-t-0 lg:pt-0">
                    {shareTarget ? (
                      <div className="flex shrink-0 items-center gap-2.5">
                        <EthicalShareTriggerButton
                          onClick={() => setEthicalShareOpen(true)}
                          className="flex min-h-11 min-w-11 shrink-0 cursor-help items-center justify-center rounded-full border-2 border-[color:var(--almamundi-orange)] bg-[#FBFAF8] text-[color:var(--almamundi-orange)] shadow-[3px_3px_10px_rgba(120,110,100,0.28),-2px_-2px_8px_rgba(255,255,255,0.92)] transition hover:bg-[#E6E3DE]"
                          title={shareLegend}
                          ariaLabel={`${copy.shareLabel}. ${copy.shareText}`}
                        />
                        {false && shareTarget ? (
                        <ResonanceMailbox
                          storyId={shareTarget?.id ?? ''}
                          recipientName={shareTarget?.nombre ?? ''}
                          triggerLayout="inline"
                          triggerTone="orange"
                          triggerTitle={shareLegend}
                          triggerAriaLabel={`${copy.shareLabel}. ${copy.shareText}`}
                          className="cursor-help"
                        />
                        ) : null}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className={`w-full whitespace-nowrap rounded-full px-4 py-2 text-[length:var(--fs-etiqueta)] font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto ${
                        hasActiveFilters
                          ? 'text-gray-800 ring-1 ring-orange-400/35 ring-offset-2 ring-offset-[var(--home-bg)]'
                          : 'text-[#646E7E]'
                      }`}
                      style={{
                        ...neu.button,
                        opacity: hasActiveFilters ? 1 : 0.88 }}
                    >
                      {copy.clear}
                    </button>
                  </div>
                </div>
                {showingUnfilteredBecauseNoMatches ? (
                  <p className="mt-2 text-[length:var(--fs-etiqueta)] text-amber-900/85" role="status">
                    {interpolate(copy.noMatch, { count: allStoryCount })}
                  </p>
                ) : null}
                {hasActiveFilters && !showingUnfilteredBecauseNoMatches ? (
                  <p className="mt-2 text-[length:var(--fs-etiqueta)] text-[#646E7E]" role="status">
                    {interpolate(copy.showing, { shown: filteredStoryCount, total: allStoryCount })}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <section
          id="historias-carrusel"
          aria-label={copy.carouselAria}
          className="mt-4 flex min-h-[min(480px,calc(100dvh-11rem))] flex-1 flex-col overflow-visible border-t border-gray-400/25 bg-[linear-gradient(180deg,rgba(245,244,242,0.42)_0%,var(--home-bg)_16%,#E6E3DE_100%)] scroll-mt-24 px-2 pb-4 pt-5 sm:mt-5 sm:px-3 sm:pb-6 md:px-6 lg:min-h-[min(520px,calc(100dvh-10.5rem))] lg:px-10 lg:pb-8"
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
              tituloExposicion={copy.expo[activeTab]}
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
        <ShareAfterNotice
          key={shareTarget.id}
          open={ethicalShareOpen}
          onClose={() => setEthicalShareOpen(false)}
          kind="story"
          storyId={shareTarget.id}
          title={shareTarget.titulo}
          city={shareTarget.lugar}
          format={contentMode === 'foto' ? 'photo' : contentMode === 'texto' ? 'text' : contentMode}
        />
      ) : null}
      </main>
    </>
  );
}
