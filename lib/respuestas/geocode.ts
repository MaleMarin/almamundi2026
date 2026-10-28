import "server-only";

/**
 * Coordenadas de ciudad y país. Si Nominatim no responde, la respuesta se guarda igual
 * y no sale en el globo hasta tener latitud y longitud.
 */
export async function geocodeCityCountry(
  city: string,
  country: string
): Promise<{ lat: number; lng: number } | null> {
  const q = `${city}, ${country}`.replace(/\s+/g, " ").trim().slice(0, 160);
  if (q.length < 3) return null;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AlmaMundi/1.0 (https://www.almamundi.org)",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
