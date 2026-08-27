/** Ciudad+país tal como llega en `city` (`placeLabel`); no concatenar `country` otra vez. */
export function storyUbicacionLabel(s: { city?: string; country?: string }): string | undefined {
  const city = s.city?.trim();
  if (city) return city;
  const country = s.country?.trim();
  return country || undefined;
}
