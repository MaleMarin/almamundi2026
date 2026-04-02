/**
 * Páginas /historias/* (carrusel embebido): si los filtros dejan 0 resultados pero el
 * listado completo tiene historias, el carrusel usa ese listado completo. Así no desaparece
 * el coverflow cuando solo hay demos en un país y el usuario filtra otro.
 */
export function pickStoriesForEmbeddedCarousel<T>(
  filtered: T[],
  unfiltered: T[],
  hasActiveFilters: boolean
): {
  carouselStories: T[];
  /** Hay filtros activos pero el carrusel muestra todas las historias del formato. */
  showingUnfilteredBecauseNoMatches: boolean;
} {
  if (filtered.length > 0) {
    return { carouselStories: filtered, showingUnfilteredBecauseNoMatches: false };
  }
  if (unfiltered.length > 0) {
    return {
      carouselStories: unfiltered,
      showingUnfilteredBecauseNoMatches: hasActiveFilters,
    };
  }
  return { carouselStories: [], showingUnfilteredBecauseNoMatches: false };
}
