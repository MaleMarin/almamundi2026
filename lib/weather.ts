export type WeatherCode =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'fog'
  | 'unknown';

export async function getUserWeather(
  lat: number,
  lng: number
): Promise<WeatherCode> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=weather_code`,
      { signal: AbortSignal.timeout(3000) }
    );
    const data = (await res.json()) as {
      current?: { weather_code?: number };
    };
    const code = data.current?.weather_code ?? 0;

    if (code === 0 || code === 1) return 'clear';
    if (code >= 2 && code <= 3) return 'cloudy';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if (code >= 95 && code <= 99) return 'storm';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 45 && code <= 48) return 'fog';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}
