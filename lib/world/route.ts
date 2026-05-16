import { NextRequest } from "next/server";
import Parser from "rss-parser";
import { mockWorldNow, worldMockItemsPublicFilter } from "@/lib/world/mockWorldNow";
import { getMediaByDomain, MEDIA_SOURCES } from "@/lib/media-sources";
import { DEFAULT_NEWS_TOPIC_API, DEFAULT_NEWS_TOPIC_QUERY } from "@/lib/news-topics";

function isDefaultNewsTopic(topicTrim: string): boolean {
  const t = topicTrim.trim();
  return t === DEFAULT_NEWS_TOPIC_QUERY || t === DEFAULT_NEWS_TOPIC_API;
}
import { isPublishedOnCalendarDay, sanitizeDayYmd, sanitizeTimeZone } from "@/lib/news-calendar-day";

export const runtime = "nodejs";

const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";
/** Caché corta para que el polling del cliente vea títulos nuevos sin esperar demasiado. */
const CACHE_TTL_MS = 120_000; // 2 min
const GDELT_REQUEST_TIMEOUT_MS = 12_000;

const rssParser = new Parser({
  timeout: 8_000,
  headers: { "User-Agent": "AlmaMundi/1.0 (News aggregator)" },
});

// URLs RSS por dominio: todos los medios de la curaduría que tienen feed disponible
const RSS_URL_BY_DOMAIN: Record<string, string> = {
  "elpais.com": "https://elpais.com/rss/",
  "eldiario.es": "https://www.eldiario.es/rss/",
  "infobae.com": "https://www.infobae.com/arc/outboundfeeds/rss/",
  "lanacion.com.ar": "https://www.lanacion.com.ar/arc/outboundfeeds/rss/",
  "pagina12.com.ar": "https://www.pagina12.com.ar/rss",
  "elmostrador.cl": "https://www.elmostrador.cl/feed",
  "ciperchile.cl": "https://ciperchile.cl/feed/",
  "latercera.com": "https://www.latercera.com/feed/",
  "emol.com": "https://www.emol.com/rss/",
  "jornada.com.mx": "https://www.jornada.com.mx/rss",
  "animalpolitico.com": "https://www.animalpolitico.com/feed/",
  "eluniversal.com.mx": "https://www.eluniversal.com.mx/rss",
  "theclinic.cl": "https://www.theclinic.cl/feed/",
  "nytimes.com": "https://rss.nytimes.com/services/xml/rss/nyt/es.xml",
  "laopinion.com": "https://www.laopinion.com/feed/",
  "eldiariony.com": "https://www.eldiariony.com/feed/",
  "precisar.net": "https://precisar.net/feed/",
  "politica-digital.com": "https://politica-digital.com/feed/",
};

/** Feeds RSS derivados de la curaduría: solo medios con URL conocida */
const RSS_FEEDS: { domain: string; url: string }[] = MEDIA_SOURCES.filter((m) =>
  RSS_URL_BY_DOMAIN[m.domain]
).map((m) => ({ domain: m.domain, url: RSS_URL_BY_DOMAIN[m.domain] }));

/** Query GDELT por dominios de los medios curados (todos los de media-sources). */
function buildDomainQuery(): string {
  const domains = MEDIA_SOURCES.map((m) => `domainis:${m.domain}`).join(" OR ");
  return `(${domains})`;
}

type Mode = "now" | "today";
function isMode(x: string): x is Mode {
  return x === "now" || x === "today";
}

// --- In-memory cache for news (key incluye día+zona si aplica)
type CacheEntry = { at: number; data: NormalizedNewsResponse };
const newsCache = new Map<string, CacheEntry>();

function cacheKey(topic: string, limit: number, lang: string, dayKey: string): string {
  return `${topic}|${limit}|${lang}|${dayKey}`;
}

function getCached(key: string): NormalizedNewsResponse | null {
  const entry = newsCache.get(key);
  if (!entry || Date.now() - entry.at > CACHE_TTL_MS) return null;
  return entry.data;
}

/** Devuelve la respuesta en caché más reciente con noticias reales (títulos de la API), si existe. */
function getAnyCachedNews(): NormalizedNewsResponse | null {
  let latest: CacheEntry | null = null;
  const now = Date.now();
  for (const entry of newsCache.values()) {
    if (entry.data.items.length > 0 && now - entry.at <= CACHE_TTL_MS && (!latest || entry.at > latest.at))
      latest = entry;
  }
  return latest ? latest.data : null;
}

function setCached(key: string, data: NormalizedNewsResponse): void {
  newsCache.set(key, { at: Date.now(), data });
}

// --- Country (ISO2 or name) -> [lat, lng] capital/representative, no geocoding
const COUNTRY_COORDS: Record<string, [number, number]> = {
  us: [38.9072, -77.0369],
  usa: [38.9072, -77.0369],
  "united states": [38.9072, -77.0369],
  gb: [51.5074, -0.1276],
  uk: [51.5074, -0.1276],
  "united kingdom": [51.5074, -0.1276],
  de: [50.1109, 8.6821],
  germany: [50.1109, 8.6821],
  fr: [48.8566, 2.3522],
  france: [48.8566, 2.3522],
  es: [40.4168, -3.7038],
  spain: [40.4168, -3.7038],
  it: [41.9028, 12.4964],
  italy: [41.9028, 12.4964],
  in: [28.6139, 77.209],
  india: [28.6139, 77.209],
  cn: [39.9042, 116.4074],
  china: [39.9042, 116.4074],
  jp: [35.6895, 139.6917],
  japan: [35.6895, 139.6917],
  lt: [54.6872, 25.2797],
  lithuania: [54.6872, 25.2797],
  mx: [19.4326, -99.1332],
  mexico: [19.4326, -99.1332],
  br: [-15.7942, -47.8825],
  brazil: [-15.7942, -47.8825],
  ar: [-34.6037, -58.3816],
  argentina: [-34.6037, -58.3816],
  cl: [-33.4489, -70.6693],
  chile: [-33.4489, -70.6693],
  co: [4.711, -74.0721],
  colombia: [4.711, -74.0721],
  ru: [55.7558, 37.6173],
  russia: [55.7558, 37.6173],
  ua: [50.4501, 30.5234],
  ukraine: [50.4501, 30.5234],
  ca: [45.4215, -75.6972],
  canada: [45.4215, -75.6972],
  au: [-35.2809, 149.1289],
  australia: [-35.2809, 149.1289],
  pl: [52.2297, 21.0122],
  poland: [52.2297, 21.0122],
  nl: [52.3676, 4.9041],
  "netherlands": [52.3676, 4.9041],
  be: [50.8503, 4.3517],
  belgium: [50.8503, 4.3517],
  pt: [38.7223, -9.1393],
  portugal: [38.7223, -9.1393],
  gr: [37.9838, 23.7275],
  greece: [37.9838, 23.7275],
  tr: [39.9334, 32.8597],
  turkey: [39.9334, 32.8597],
  eg: [30.0444, 31.2357],
  egypt: [30.0444, 31.2357],
  za: [-26.2041, 28.0473],
  "south africa": [-26.2041, 28.0473],
  ng: [9.0765, 7.3986],
  nigeria: [9.0765, 7.3986],
  kr: [37.5665, 126.978],
  "south korea": [37.5665, 126.978],
  id: [-6.2088, 106.8456],
  indonesia: [-6.2088, 106.8456],
  ph: [14.5995, 120.9842],
  philippines: [14.5995, 120.9842],
  my: [3.139, 101.6869],
  malaysia: [3.139, 101.6869],
  th: [13.7563, 100.5018],
  thailand: [13.7563, 100.5018],
  vn: [21.0285, 105.8412],
  vietnam: [21.0285, 105.8412],
  pk: [33.6844, 73.0479],
  pakistan: [33.6844, 73.0479],
  bd: [23.8103, 90.4125],
  bangladesh: [23.8103, 90.4125],
  ir: [35.6892, 51.389],
  iran: [35.6892, 51.389],
  il: [32.0853, 34.7818],
  israel: [32.0853, 34.7818],
  sa: [24.7136, 46.7386],
  "saudi arabia": [24.7136, 46.7386],
  ae: [24.4539, 54.3773],
  "united arab emirates": [24.4539, 54.3773],
  nz: [-41.2865, 174.7645],
  "new zealand": [-41.2865, 174.7645],
  ie: [53.3498, -6.2603],
  ireland: [53.3498, -6.2603],
  at: [48.2082, 16.3738],
  austria: [48.2082, 16.3738],
  ch: [46.948, 7.4474],
  switzerland: [46.948, 7.4474],
  se: [59.3293, 18.0686],
  sweden: [59.3293, 18.0686],
  no: [59.9139, 10.7522],
  norway: [59.9139, 10.7522],
  fi: [60.1699, 24.9384],
  finland: [60.1699, 24.9384],
  ro: [44.4268, 26.1025],
  romania: [44.4268, 26.1025],
  hu: [47.4979, 19.0402],
  hungary: [47.4979, 19.0402],
  cz: [50.0755, 14.4378],
  "czech republic": [50.0755, 14.4378],
  czechia: [50.0755, 14.4378],
};

function coordsForCountry(country: string | null): { lat: number; lng: number } | null {
  if (!country || !country.trim()) return null;
  const key = country.trim().toLowerCase();
  const c = COUNTRY_COORDS[key];
  if (!c) return null;
  return { lat: c[0], lng: c[1] };
}

// --- Live streams (iframe-embeddable) for kind=live
const LIVE_STREAMS: Array<{ id: string; title: string; source: string; embedUrl: string; lat: number; lng: number }> = [
  { id: "live-1", title: "Al Jazeera English", source: "Al Jazeera", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UC88nxveff2C1f8DTc2Q4bRw&autoplay=1&mute=1", lat: 25.2854, lng: 51.5310 },
  { id: "live-2", title: "DW News", source: "DW", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCknLrEdhRCp1aegoMqRaCZg&autoplay=1&mute=1", lat: 50.1109, lng: 8.6821 },
  { id: "live-3", title: "France 24", source: "France 24", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCCCPCZNChQdGa9Ek9loeBHg&autoplay=1&mute=1", lat: 48.8566, lng: 2.3522 },
  { id: "live-4", title: "Sky News", source: "Sky News", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCvlR0bJbvk3V7Q2sTz7Yerg&autoplay=1&mute=1", lat: 51.5074, lng: -0.1276 },
  { id: "live-5", title: "CNN International", source: "CNN", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCupvZG-5ko_eioXA5bFGBMg&autoplay=1&mute=1", lat: 33.7490, lng: -84.3880 },
  { id: "live-6", title: "NHK World-Japan", source: "NHK", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCGmD5tLf7o0FVqJpnv0nN0w&autoplay=1&mute=1", lat: 35.6895, lng: 139.6917 },
  { id: "live-7", title: "CGTN", source: "CGTN", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCwNfjLnvK4V-ocFQ8n6fRHA&autoplay=1&mute=1", lat: 39.9042, lng: 116.4074 },
  { id: "live-8", title: "RT en vivo", source: "RT", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCpwvZw36amcPrwiUEcPmWwQ&autoplay=1&mute=1", lat: 55.7558, lng: 37.6173 },
];

// --- Normalized news shape
export type NewsGeo = {
  lat: number;
  lng: number;
  precision?: "country" | "city" | "unknown";
  label?: string;
  /** false = coordenadas del medio (sede); true o ausente = ubicación del hecho. El globo solo debe moverse cuando es ubicación del hecho. */
  isEventLocation?: boolean;
};

export type NormalizedNewsItem = {
  id: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
  sourceCountry: string | null;
  lat: number | null;
  lng: number | null;
  geo?: NewsGeo | null;
};

/** Origen del medio → coordenadas aproximadas (para noticias sin geo, ej. RSS). */
const SOURCE_GEO_FALLBACK: Record<string, { lat: number; lng: number; label: string; precision: "country" | "city" }> = (() => {
  const map: Record<string, { lat: number; lng: number; label: string; precision: "country" | "city" }> = {};
  for (const m of MEDIA_SOURCES) {
    const coords = coordsForCountry(m.country);
    if (coords) map[m.name] = { lat: coords.lat, lng: coords.lng, label: m.countryName, precision: "country" };
  }
  // Ajustes ciudad cuando convenga (opcional)
  map["El País"] = { lat: 40.4168, lng: -3.7038, label: "Madrid, España", precision: "city" };
  map["elDiario.es"] = { lat: 40.4168, lng: -3.7038, label: "Madrid, España", precision: "city" };
  map["Infobae"] = { lat: -34.6037, lng: -58.3816, label: "Buenos Aires, Argentina", precision: "city" };
  map["La Nación"] = { lat: -34.6037, lng: -58.3816, label: "Buenos Aires, Argentina", precision: "city" };
  map["Página/12"] = { lat: -34.6037, lng: -58.3816, label: "Buenos Aires, Argentina", precision: "city" };
  return map;
})();

function normalizeSource(s: string): string {
  return (s || "").trim().replace(/\s+/g, " ");
}

/** Segmentos de URL o palabras en título que indican el país/región de la noticia (no del medio). */
const STORY_LOCATION_HINTS: Record<string, string> = {
  "estados-unidos": "us",
  "eeuu": "us",
  "united-states": "us",
  "usa": "us",
  "mexico": "mx",
  "méxico": "mx",
  "argentina": "ar",
  "chile": "cl",
  "colombia": "co",
  "espana": "es",
  "españa": "es",
  "brasil": "br",
  "brazil": "br",
  "venezuela": "ve",
  "peru": "pe",
  "perú": "pe",
  "ecuador": "ec",
  "bolivia": "bo",
  "paraguay": "py",
  "uruguay": "uy",
  "cuba": "cu",
  "francia": "fr",
  "france": "fr",
  "alemania": "de",
  "germany": "de",
  "reino-unido": "gb",
  "uk": "gb",
  "italia": "it",
  "italy": "it",
  "china": "cn",
  "rusia": "ru",
  "russia": "ru",
  "ucrania": "ua",
  "ukraine": "ua",
  "israel": "il",
  "palestina": "ps",
  "el-mundo": "us",
};

const STORY_LOCATION_LABELS: Record<string, string> = {
  us: "Estados Unidos", mx: "México", ar: "Argentina", cl: "Chile", es: "España", br: "Brasil",
  fr: "Francia", de: "Alemania", gb: "Reino Unido", cn: "China", ru: "Rusia", ua: "Ucrania", co: "Colombia", ve: "Venezuela", pe: "Perú", ec: "Ecuador", bo: "Bolivia", py: "Paraguay", uy: "Uruguay", cu: "Cuba", it: "Italia", il: "Israel", ps: "Palestina",
};

/** Inferir ubicación del hecho desde URL (path) y título. Devuelve coords del país de la noticia, no del medio. */
function getStoryLocationFromContent(url: string, title: string): { lat: number; lng: number; label: string } | null {
  const path = (url || "").split("?")[0] || "";
  const pathLower = path.toLowerCase();
  const segments = path.split("/").map((s) => s.toLowerCase().trim()).filter(Boolean);

  for (const seg of segments) {
    const code = STORY_LOCATION_HINTS[seg];
    if (code) {
      const coords = coordsForCountry(code);
      if (coords) return { ...coords, label: STORY_LOCATION_LABELS[code] ?? code.toUpperCase() };
    }
  }
  if (/estados-unidos|eeuu|estadosunidos/i.test(pathLower) || /\b(ee\.?\s*uu\.?|estados\s*unidos|eeuu)\b/i.test(title || "")) {
    const coords = coordsForCountry("us");
    if (coords) return { ...coords, label: "Estados Unidos" };
  }
  if (/mexico|méxico/i.test(pathLower) || /\b(méxico|mexico)\b/i.test(title || "")) {
    const coords = coordsForCountry("mx");
    if (coords) return { ...coords, label: "México" };
  }
  const titleNorm = (title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const titleWords = titleNorm.split(/\s+/);
  const stopWords = new Set(["el", "la", "los", "las", "un", "una", "de", "en", "y", "para", "que", "con", "por", "al", "del", "ice"]);
  for (const w of titleWords) {
    if (w.length < 3 || stopWords.has(w)) continue;
    const code = STORY_LOCATION_HINTS[w] ?? STORY_LOCATION_HINTS[w.replace(/\s+/g, "-")];
    if (code) {
      const coords = coordsForCountry(code);
      if (coords) return { ...coords, label: STORY_LOCATION_LABELS[code] ?? code.toUpperCase() };
    }
  }
  return null;
}

function applyGeoFallback(items: NormalizedNewsItem[]): NormalizedNewsItem[] {
  return items.map((it) => {
    const hasValidCoords = Number.isFinite(it.lat) && Number.isFinite(it.lng);
    if (hasValidCoords && it.lat != null && it.lng != null) {
      return { ...it, geo: it.geo ?? { lat: it.lat, lng: it.lng, precision: "unknown" as const, isEventLocation: true } };
    }
    const storyLoc = getStoryLocationFromContent(it.url ?? "", it.title ?? "");
    if (storyLoc) {
      return {
        ...it,
        lat: storyLoc.lat,
        lng: storyLoc.lng,
        geo: { lat: storyLoc.lat, lng: storyLoc.lng, label: storyLoc.label, precision: "country" as const, isEventLocation: true },
      };
    }
    // Sin lugar del hecho: no usar país del medio para el mapa. Attribution (source) es solo quién publicó.
    return { ...it, lat: null, lng: null, geo: null };
  });
}

export type NormalizedNewsResponse = {
  generatedAt: string;
  items: NormalizedNewsItem[];
  /** true cuando la respuesta es la lista de medios (fallback), no titulares reales */
  isFallback?: boolean;
  /** true cuando se amplió a titulares generales por pocos resultados del tema */
  relaxedTopic?: boolean;
};

// GDELT artlist response (subset we use)
type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  sourcecountry?: string;
  language?: string;
};

function seendateToISO(seendate: string | undefined): string | null {
  if (!seendate || seendate.length < 15) return null;
  // e.g. 20260215T233000Z -> 2026-02-15T23:30:00.000Z
  const y = seendate.slice(0, 4),
    m = seendate.slice(4, 6),
    d = seendate.slice(6, 8),
    h = seendate.slice(9, 11),
    min = seendate.slice(11, 13),
    s = seendate.slice(13, 15);
  return `${y}-${m}-${d}T${h}:${min}:${s}.000Z`;
}

/** Noticias reales de GDELT. Si el dominio está en la lista curada, se usa el nombre del medio; si no, el dominio. Así siempre hay titulares reales; los de tus medios se muestran con su nombre. */
function normalizeGdeltArticles(articles: GdeltArticle[]): NormalizedNewsItem[] {
  const withFlag = articles.map((a, i) => {
    const domain = a.domain ?? null;
    const media = getMediaByDomain(domain);
    const sourceCountry = media ? media.country : (a.sourcecountry?.trim() || null);
    return {
      item: {
        id: a.url ? `gdelt-${Buffer.from(a.url).toString("base64url").slice(0, 32)}` : `gdelt-${i}`,
        title: a.title ?? "",
        url: a.url ?? "",
        source: media ? media.name : (a.domain ?? null),
        publishedAt: seendateToISO(a.seendate),
        sourceCountry,
        lat: null,
        lng: null,
        geo: undefined,
      } as NormalizedNewsItem,
      curated: !!media,
    };
  });
  withFlag.sort((x, y) => (y.curated ? 1 : 0) - (x.curated ? 1 : 0));
  return withFlag.map((w) => w.item);
}

const SPANISH_LANGUAGE_NAMES = new Set(["spanish", "español", "es"]);

function isLikelySpanish(article: GdeltArticle): boolean {
  const lang = (article.language ?? "").trim().toLowerCase();
  if (!lang) return false;
  if (SPANISH_LANGUAGE_NAMES.has(lang)) return true;
  if (lang.startsWith("spanish") || lang.startsWith("español")) return true;
  return false;
}

async function fetchNewsFromGdelt(
  topic: string,
  limit: number,
  lang: string,
  maxRecords = 150,
  timespan: string = "6h"
): Promise<NormalizedNewsResponse | null> {
  const queryStr = topic.trim().length > 0 ? (lang === "es" ? `${topic.trim()} sourcelang:spanish` : topic.trim()) : "news";
  const params = new URLSearchParams({
    query: queryStr,
    mode: "artlist",
    format: "json",
    sort: "datedesc",
    timespan,
    maxrecords: String(Math.min(250, maxRecords)),
  });
  const url = `${GDELT_BASE}?${params.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GDELT_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 0 } });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const json = (await res.json()) as { articles?: GdeltArticle[] };
    let articles = Array.isArray(json.articles) ? json.articles : [];
    if (lang === "es" && articles.length > 0) {
      const spanishOnly = articles.filter(isLikelySpanish);
      if (spanishOnly.length > 0) articles = spanishOnly;
    }
    const items = normalizeGdeltArticles(articles).slice(0, limit);
    if (items.length === 0 && timespan === "6h") {
      return fetchNewsFromGdelt(topic, limit, lang, maxRecords, "1day");
    }
    if (items.length === 0) return null;
    return { generatedAt: new Date().toISOString(), items, isFallback: false };
  } catch {
    clearTimeout(timeoutId);
    if (timespan === "6h") {
      return fetchNewsFromGdelt(topic, limit, lang, maxRecords, "1day");
    }
    return null;
  }
}

const SIMPLE_TOPIC = "noticias";

/** Genera un título legible desde la URL: slug → reemplazar guiones por espacios → capitalizar. Nunca "Sin título". */
function titleFromUrl(url: string): string {
  if (!url || !url.trim()) return "";
  try {
    const pathname = new URL(url).pathname || "";
    const segments = pathname.split("/").filter(Boolean);
    const slug = segments.length > 0 ? segments[segments.length - 1] : pathname.replace(/^\//, "").replace(/\/$/, "") || "";
    const decoded = decodeURIComponent(slug).replace(/%20/g, " ");
    const withSpaces = decoded.replace(/-/g, " ");
    const capitalized = withSpaces
      .split(/\s+/)
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");
    return capitalized.trim().slice(0, 200) || "";
  } catch {
    return "";
  }
}

/** Normaliza texto para búsqueda (quita acentos, minúsculas). */
function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** True si el título contiene al menos una palabra del tema (query). */
function titleMatchesTopic(title: string, topicQuery: string): boolean {
  if (!topicQuery || !topicQuery.trim()) return true;
  const titleNorm = normalizeForMatch(title);
  const words = topicQuery.trim().split(/\s+/).filter(Boolean).map(normalizeForMatch);
  return words.some((w) => w.length >= 2 && titleNorm.includes(w));
}

/**
 * Titulares desde un feed RSS curado (rss-parser: Atom/RSS con CDATA y namespaces).
 * Misma forma que el flujo anterior: NormalizedNewsItem sin campos extra.
 */
async function fetchRssFeedCurated(domain: string, feedUrl: string): Promise<NormalizedNewsItem[]> {
  try {
    const feed = await rssParser.parseURL(feedUrl);
    const media = getMediaByDomain(domain);
    const name = media?.name ?? domain;
    const country = media?.country ?? null;
    const items: NormalizedNewsItem[] = [];
    const slice = feed.items.slice(0, 30);
    for (let i = 0; i < slice.length; i++) {
      const item = slice[i];
      const link = typeof item.link === "string" ? item.link.trim() : "";
      const rawTitle = item.title != null ? String(item.title).trim() : "";
      let title = rawTitle.length > 0 ? rawTitle : link ? titleFromUrl(link) : "";
      if (!title && link) title = name;
      if (!title && !link) continue;
      const pubRaw = item.pubDate ?? (item as { isoDate?: string }).isoDate;
      let publishedAt: string | null = null;
      if (pubRaw) {
        try {
          publishedAt = new Date(pubRaw).toISOString();
        } catch {
          publishedAt = null;
        }
      }
      const id = link ? `rss-${Buffer.from(link).toString("base64url").slice(0, 28)}` : `rss-${domain}-${i}`;
      items.push({
        id,
        title,
        url: link,
        source: name,
        publishedAt,
        sourceCountry: country,
        lat: null,
        lng: null,
      });
    }
    return items;
  } catch (err) {
    if (process.env.DEBUG_WORLD_RSS === "1") {
      console.warn(`[world] RSS skipped ${domain}:`, err);
    }
    return [];
  }
}

/**
 * Pulso global: titulares desde RSS de los medios curados.
 * Si topic tiene valor, se filtran los ítems cuyo título coincida con alguna palabra del tema.
 */
async function fetchNewsFromRss(limit: number, topic: string = ""): Promise<NormalizedNewsResponse | null> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(({ domain, url }) => fetchRssFeedCurated(domain, url))
  );

  const allItems: NormalizedNewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) allItems.push(...r.value);
  }
  allItems.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });
  let items = allItems;
  const topicTrimmed = topic.trim();
  if (topicTrimmed.length > 0 && topicTrimmed.length <= 80 && !isDefaultNewsTopic(topicTrimmed)) {
    items = items.filter((it) => titleMatchesTopic(it.title, topicTrimmed));
  }
  items = items.slice(0, limit);
  if (items.length === 0) return null;
  return { generatedAt: new Date().toISOString(), items, isFallback: false };
}

function dedupeNewsItems(items: NormalizedNewsItem[]): NormalizedNewsItem[] {
  const seenUrl = new Set<string>();
  const seenId = new Set<string>();
  const out: NormalizedNewsItem[] = [];
  for (const it of items) {
    const u = (it.url ?? "").trim();
    const id = (it.id ?? "").trim();
    if (u && seenUrl.has(u)) continue;
    if (!u && id && seenId.has(id)) continue;
    if (u) seenUrl.add(u);
    if (id) seenId.add(id);
    out.push(it);
  }
  return out;
}

function sortByPublishedDesc(items: NormalizedNewsItem[]): NormalizedNewsItem[] {
  return [...items].sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });
}

export type NewsCalendarFilter = { dayYmd: string; timeZone: string };

export async function getNews(
  topic: string,
  limit: number,
  lang: string = "es",
  calendar: NewsCalendarFilter | null = null
): Promise<NormalizedNewsResponse> {
  const topicTrim = topic.trim();
  const dayKey = calendar ? `${calendar.dayYmd}|${calendar.timeZone}` : "all";
  const key = cacheKey(topic, limit, lang, dayKey);
  const cached = getCached(key);
  if (cached) return cached;

  if (calendar) {
    const applyDay = (items: NormalizedNewsItem[]) =>
      items.filter((it) => isPublishedOnCalendarDay(it.publishedAt, calendar.dayYmd, calendar.timeZone));

    const rssLimit = Math.min(250, Math.max(limit * 8, 60));
    const rss = await fetchNewsFromRss(rssLimit, topicTrim).catch(() => null);
    let merged: NormalizedNewsItem[] = rss && rss.items.length ? applyDay(rss.items) : [];
    merged = sortByPublishedDesc(merged);

    if (merged.length < limit) {
      const domainQuery = buildDomainQuery();
      const fullQuery = topicTrim.length > 0 ? `${topicTrim} ${domainQuery}` : domainQuery;
      const g = await fetchNewsFromGdelt(fullQuery, Math.max(limit * 2, 40), lang, 250, "6h").catch(() => null);
      if (g && g.items.length) merged = dedupeNewsItems(sortByPublishedDesc([...merged, ...applyDay(g.items)]));
    }
    if (merged.length < limit) {
      const domainQuery = buildDomainQuery();
      const g = await fetchNewsFromGdelt(domainQuery, Math.max(limit * 2, 40), lang, 250, "6h").catch(() => null);
      if (g && g.items.length) merged = dedupeNewsItems(sortByPublishedDesc([...merged, ...applyDay(g.items)]));
    }

    merged = merged.slice(0, limit);
    merged = applyGeoFallback(merged);

    if (merged.length > 0) {
      let relaxedTopic = false;
      if (merged.length < limit && topicTrim.length > 0 && !isDefaultNewsTopic(topicTrim)) {
        const broader = await getNews(DEFAULT_NEWS_TOPIC_API, limit, lang, null);
        if (broader.items.length > merged.length) {
          merged = dedupeNewsItems(sortByPublishedDesc([...merged, ...broader.items])).slice(0, limit);
          relaxedTopic = true;
        }
      }
      const data: NormalizedNewsResponse = {
        generatedAt: new Date().toISOString(),
        items: merged,
        isFallback: false,
        relaxedTopic,
      };
      setCached(key, data);
      return data;
    }
    // Nada encaja en el día calendario (feeds retrasados o sin pubDate): mismas fuentes sin filtro de día
    return getNews(topic, limit, lang, null);
  }

  const MIN_TOPIC_ITEMS = Math.min(limit, 8);

  // RSS primero (rápido, medios curados); GDELT ventana corta (6h) para titulares más frescos
  const rss = await fetchNewsFromRss(Math.max(limit, MIN_TOPIC_ITEMS * 2), topicTrim).catch(() => null);
  if (rss && rss.items.length > 0) {
    let items = rss.items.slice(0, limit);
    let relaxedTopic = false;
    if (
      items.length < MIN_TOPIC_ITEMS &&
      topicTrim.length > 0 &&
      !isDefaultNewsTopic(topicTrim)
    ) {
      const general = await fetchNewsFromRss(limit, "").catch(() => null);
      if (general && general.items.length > 0) {
        items = dedupeNewsItems(sortByPublishedDesc([...items, ...general.items])).slice(0, limit);
        relaxedTopic = true;
      }
    }
    const withGeo: NormalizedNewsResponse = {
      ...rss,
      items: applyGeoFallback(items),
      isFallback: false,
      relaxedTopic,
    };
    setCached(key, withGeo);
    return withGeo;
  }

  const domainQuery = buildDomainQuery();
  const fullQuery = topicTrim.length > 0 ? `${topicTrim} ${domainQuery}` : domainQuery;

  let gdelt = await fetchNewsFromGdelt(fullQuery, limit, lang, 150, "6h").catch(() => null);
  if (gdelt && gdelt.items.length > 0) {
    const withGeo = { ...gdelt, items: applyGeoFallback(gdelt.items) };
    setCached(key, withGeo);
    return withGeo;
  }
  gdelt = await fetchNewsFromGdelt(domainQuery, limit, lang, 150, "6h").catch(() => null);
  if (gdelt && gdelt.items.length > 0) {
    const withGeo = { ...gdelt, items: applyGeoFallback(gdelt.items) };
    setCached(key, withGeo);
    return withGeo;
  }
  if (topicTrim.length > 0 && !isDefaultNewsTopic(topicTrim)) {
    const broad = await getNews(DEFAULT_NEWS_TOPIC_API, limit, lang, null);
    if (broad.items.length > 0) {
      const withGeo: NormalizedNewsResponse = {
        ...broad,
        items: applyGeoFallback(broad.items),
        isFallback: false,
        relaxedTopic: true,
      };
      setCached(key, withGeo);
      return withGeo;
    }
  }

  const cachedNews = getAnyCachedNews();
  if (cachedNews) return { ...cachedNews, items: applyGeoFallback(cachedNews.items) };
  const fallback = fallbackMediaLinks();
  return { ...fallback, items: applyGeoFallback(fallback.items) };
}

function fallbackMediaLinks(): NormalizedNewsResponse {
  const now = new Date().toISOString();
  const items: NormalizedNewsItem[] = MEDIA_SOURCES.map((media, i) => {
    const coords = coordsForCountry(media.country);
    return {
      id: `media-${media.id}-${i}`,
      title: media.name,
      url: `https://${media.domain}`,
      source: media.name,
      publishedAt: null,
      sourceCountry: media.country,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    };
  });
  return { generatedAt: now, items, isFallback: true };
}

export async function GET(request: NextRequest) {
  try {
    const kind = request.nextUrl.searchParams.get("kind") ?? "";

    if (kind === "news") {
      let topic = request.nextUrl.searchParams.get("topic")?.trim() || DEFAULT_NEWS_TOPIC_QUERY;
      if (topic.length > 80) topic = topic.slice(0, 80);
      const limitParam = request.nextUrl.searchParams.get("limit");
      const limit = limitParam ? Math.min(250, Math.max(1, parseInt(limitParam, 10) || 10)) : 20;
      const lang = request.nextUrl.searchParams.get("lang")?.trim() ?? "es";
      const dayParam = sanitizeDayYmd(request.nextUrl.searchParams.get("day"));
      const tzParam = sanitizeTimeZone(request.nextUrl.searchParams.get("tz"));
      const calendar = dayParam && tzParam ? { dayYmd: dayParam, timeZone: tzParam } : null;
      let data = await getNews(topic, limit, lang, calendar);
      const topicTrim = topic.trim();
      if (
        calendar &&
        data.items.length > 0 &&
        data.items.length < Math.min(limit, 8) &&
        !isDefaultNewsTopic(topicTrim)
      ) {
        const broader = await getNews(topic, limit, lang, null);
        if (broader.items.length > data.items.length) {
          data = {
            ...broader,
            items: dedupeNewsItems(sortByPublishedDesc([...data.items, ...broader.items])).slice(0, limit),
            relaxedTopic: true,
          };
        }
      }
      if ((!data.items || data.items.length === 0) && !isDefaultNewsTopic(topicTrim)) {
        const broader = await getNews(DEFAULT_NEWS_TOPIC_API, limit, lang, null);
        if (broader.items.length > 0) {
          data = { ...broader, relaxedTopic: true };
        }
      }
      if (data.items?.length) {
        data = {
          ...data,
          items: data.items.filter((it) => !String(it.id ?? '').startsWith('media-')),
          isFallback: false,
        };
      }
      if (!data.items || data.items.length === 0) {
        const cachedNews = getAnyCachedNews();
        if (cachedNews && cachedNews.items.length > 0) {
          data = {
            ...cachedNews,
            items: cachedNews.items.filter((it) => !String(it.id ?? '').startsWith('media-')),
            isFallback: false,
            relaxedTopic: true,
          };
        } else {
          data = {
            generatedAt: new Date().toISOString(),
            items: [],
            isFallback: true,
          };
        }
      }
      return Response.json(data, {
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      });
    }

    if (kind === "live") {
      const limitParam = request.nextUrl.searchParams.get("limit");
      const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10) || 8)) : 8;
      return Response.json({
        generatedAt: new Date().toISOString(),
        items: LIVE_STREAMS.slice(0, limit),
      });
    }

    const modeParam = request.nextUrl.searchParams.get("mode") ?? "today";
    if (!isMode(modeParam)) {
      return Response.json({ error: "Invalid mode. Use 'now' or 'today'." }, { status: 400 });
    }

    const limit = modeParam === "now" ? 20 : 40;
    const data = mockWorldNow();
    const items = worldMockItemsPublicFilter(data.items).slice(0, limit);
    return Response.json({
      mode: modeParam,
      updatedAt: new Date().toISOString(),
      items,
      source: "mock",
    });
  } catch (err) {
    console.error("[api/world] GET error:", err);
    const fallback = fallbackMediaLinks();
    return Response.json(fallback, { status: 200 });
  }
}
