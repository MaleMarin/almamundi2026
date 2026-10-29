import { foldText } from '@/lib/historias/story-filter-helpers';

function capSegments(value: string): string {
  return value
    .split(',')
    .map((part) => {
      const text = part.trim();
      if (!text) return '';
      return text.charAt(0).toLocaleUpperCase('es-CL') + text.slice(1);
    })
    .filter(Boolean)
    .join(', ');
}

/** La ciudad ya nombra el país (`Santiago, Chile` o `Santiago de Chile`). */
function cityNamesCountry(city: string, country: string): boolean {
  const place = foldText(city).trim();
  const nation = foldText(country).trim();
  if (!place || !nation) return false;
  return place === nation || place.endsWith(`, ${nation}`) || place.endsWith(` ${nation}`);
}

/** Quita el país solo cuando va después de una coma. */
function cityWithoutTrailingCountry(city: string, country: string): string {
  const nation = foldText(country).trim();
  const parts = city
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  while (parts.length > 1 && foldText(parts[parts.length - 1] ?? '') === nation) {
    parts.pop();
  }
  return parts.join(', ');
}

/** Ciudad y país con mayúscula inicial, sin repetir el país si la ciudad ya lo incluye. */
export function formatPublicPlace(city?: string | null, country?: string | null): string {
  const parts = publicCityCountry(city, country);
  return [parts.city, parts.country].filter(Boolean).join(', ');
}

export function publicCityCountry(
  city?: string | null,
  country?: string | null
): { city?: string; country?: string } {
  const cityRaw = (city ?? '').trim();
  const countryRaw = (country ?? '').trim();
  const countryOut = countryRaw ? capSegments(countryRaw) : undefined;
  if (!cityRaw) return { country: countryOut };
  if (countryRaw && cityNamesCountry(cityRaw, countryRaw)) {
    const stripped = cityWithoutTrailingCountry(cityRaw, countryRaw);
    if (stripped && foldText(stripped) !== foldText(countryRaw)) {
      return { city: capSegments(stripped), country: countryOut };
    }
    return { city: capSegments(cityRaw), country: undefined };
  }
  return { city: capSegments(cityRaw), country: countryOut };
}

/** Lugar público: ciudad y país, sin repetir el país. */
export function storyUbicacionLabel(s: { city?: string; country?: string }): string | undefined {
  const label = formatPublicPlace(s.city, s.country);
  return label || undefined;
}
