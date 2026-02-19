import { NextRequest } from "next/server";
import { mockWorldNow } from "@/lib/world/mockWorldNow";
import { getMediaByDomain, MEDIA_SOURCES } from "@/lib/media-sources";
import { DEFAULT_NEWS_TOPIC_QUERY } from "@/lib/news-topics";

export const runtime = "nodejs";

const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";
const CACHE_TTL_MS = 300_000; // 5 min
const GDELT_REQUEST_TIMEOUT_MS = 8_000;
const RSS_FETCH_TIMEOUT_MS = 6_000;

/** Feeds RSS de medios curados: titulares reales cuando GDELT no responde */
const RSS_FEEDS: { domain: string; url: string }[] = [
  { domain: "elpais.com", url: "https://elpais.com/rss/" },
  { domain: "eldiario.es", url: "https://www.eldiario.es/rss/" },
  { domain: "infobae.com", url: "https://www.infobae.com/arc/outboundfeeds/rss/" },
  { domain: "lanacion.com.ar", url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/" },
  { domain: "pagina12.com.ar", url: "https://www.pagina12.com.ar/rss" },
  { domain: "elmostrador.cl", url: "https://www.elmostrador.cl/feed" },
  { domain: "ciperchile.cl", url: "https://ciperchile.cl/feed/" },
  { domain: "latercera.com", url: "https://www.latercera.com/feed/" },
  { domain: "emol.com", url: "https://www.emol.com/rss/" },
  { domain: "jornada.com.mx", url: "https://www.jornada.com.mx/rss" },
  { domain: "animalpolitico.com", url: "https://www.animalpolitico.com/feed/" },
  { domain: "eluniversal.com.mx", url: "https://www.eluniversal.com.mx/rss" },
];

/** Query GDELT por dominios de tus medios: devuelve artículos reales (titular, URL, fecha) de esos sitios */
function buildDomainQuery(): string {
  const domains = MEDIA_SOURCES.slice(0, 12).map((m) => `domainis:${m.domain}`).join(" OR ");
  return `(${domains})`;
}

type Mode = "now" | "today";
function isMode(x: string): x is Mode {
  return x === "now" || x === "today";
}

// --- In-memory cache for news (key = cacheKey(topic, limit), value = { at, data })
type CacheEntry = { at: number; data: NormalizedNewsResponse };
const newsCache = new Map<string, CacheEntry>();

function cacheKey(topic: string, limit: number, lang: string): string {
  return `${topic}|${limit}|${lang}`;
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
export type NormalizedNewsItem = {
  id: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
  sourceCountry: string | null;
  lat: number | null;
  lng: number | null;
};

export type NormalizedNewsResponse = {
  generatedAt: string;
  items: NormalizedNewsItem[];
  /** true cuando la respuesta es la lista de medios (fallback), no titulares reales */
  isFallback?: boolean;
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
    const coords = coordsForCountry(sourceCountry);
    return {
      item: {
        id: a.url ? `gdelt-${Buffer.from(a.url).toString("base64url").slice(0, 32)}` : `gdelt-${i}`,
        title: a.title ?? "",
        url: a.url ?? "",
        source: media ? media.name : (a.domain ?? null),
        publishedAt: seendateToISO(a.seendate),
        sourceCountry,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
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

async function fetchNewsFromGdelt(topic: string, limit: number, lang: string, maxRecords = 150): Promise<NormalizedNewsResponse | null> {
  const queryStr = topic.trim().length > 0 ? (lang === "es" ? `${topic.trim()} sourcelang:spanish` : topic.trim()) : "news";
  const params = new URLSearchParams({
    query: queryStr,
    mode: "artlist",
    format: "json",
    sort: "datedesc",
    timespan: "1day",
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
    if (items.length === 0) return null;
    return { generatedAt: new Date().toISOString(), items, isFallback: false };
  } catch {
    clearTimeout(timeoutId);
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

/** Extrae título, link y fecha de un bloque <item> o <entry> en XML (regex simple, sin dependencias). */
function parseRssItemBlock(block: string): { title: string; link: string; pubDate: string | null } {
  const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim() : "";
  let link = "";
  const linkTag = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (linkTag) link = linkTag[1].trim();
  const hrefMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (hrefMatch) link = hrefMatch[1].trim();
  if (!link && linkTag) link = linkTag[1].replace(/<[^>]+>/g, "").trim();
  const pubMatch = block.match(/<(?:pubDate|updated|dc:date)[^>]*>([^<]+)</i);
  const pubDate = pubMatch ? pubMatch[1].trim() : null;
  return { title, link, pubDate };
}

/**
 * Pulso global: titulares desde RSS de los medios curados.
 * Usa Promise.allSettled (no Promise.all): si un feed falla, se ignora y el resto sí pasa.
 * Timeout por feed vía AbortController para no bloquear.
 */
async function fetchNewsFromRss(limit: number): Promise<NormalizedNewsResponse | null> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async ({ domain, url }) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), RSS_FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          next: { revalidate: 0 },
          headers: { "User-Agent": "AlmaMundi/1.0 (News aggregator)" },
        });
        clearTimeout(timeoutId);
        if (!res.ok) return [];
        const xml = await res.text();
        const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
        const media = getMediaByDomain(domain);
        const name = media?.name ?? domain;
        const country = media?.country ?? null;
        const coords = coordsForCountry(country);
        const items: NormalizedNewsItem[] = [];
        for (let i = 0; i < itemBlocks.length; i++) {
          const { title: rawTitle, link, pubDate } = parseRssItemBlock(itemBlocks[i]);
          const hasRealTitle = rawTitle != null && String(rawTitle).trim().length > 0;
          let title = hasRealTitle ? rawTitle.trim() : (link ? titleFromUrl(link) : "");
          if (!title && link) title = name;
          if (!title && !link) continue;
          const id = link ? `rss-${Buffer.from(link).toString("base64url").slice(0, 28)}` : `rss-${domain}-${i}`;
          let publishedAt: string | null = null;
          if (pubDate) {
            try {
              publishedAt = new Date(pubDate).toISOString();
            } catch {
              publishedAt = null;
            }
          }
          items.push({
            id,
            title,
            url: link,
            source: name,
            publishedAt,
            sourceCountry: country,
            lat: coords?.lat ?? null,
            lng: coords?.lng ?? null,
          });
        }
        return items;
      } catch {
        clearTimeout(timeoutId);
        return [];
      }
    })
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
  const items = allItems.slice(0, limit);
  if (items.length === 0) return null;
  return { generatedAt: new Date().toISOString(), items, isFallback: false };
}

export async function getNews(topic: string, limit: number, lang: string = "es"): Promise<NormalizedNewsResponse> {
  const key = cacheKey(topic, limit, lang);
  const cached = getCached(key);
  if (cached) return cached;

  const domainQuery = buildDomainQuery();
  let gdelt = await fetchNewsFromGdelt(domainQuery, limit, lang, 150).catch(() => null);
  if (gdelt && gdelt.items.length > 0) {
    setCached(key, gdelt);
    return gdelt;
  }
  gdelt = await fetchNewsFromGdelt(SIMPLE_TOPIC, limit, lang, 100).catch(() => null);
  if (gdelt && gdelt.items.length > 0) {
    setCached(key, gdelt);
    return gdelt;
  }
  const rss = await fetchNewsFromRss(limit).catch(() => null);
  if (rss && rss.items.length > 0) {
    setCached(key, rss);
    return rss;
  }
  const cachedNews = getAnyCachedNews();
  if (cachedNews) return cachedNews;
  return fallbackMediaLinks();
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
      let data = await getNews(topic, limit, lang);
      if (!data.items || data.items.length === 0) data = fallbackMediaLinks();
      return Response.json(data);
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
    return Response.json({
      mode: modeParam,
      updatedAt: new Date().toISOString(),
      items: data.items.slice(0, limit),
      source: "mock",
    });
  } catch (err) {
    console.error("[api/world] GET error:", err);
    const fallback = fallbackMediaLinks();
    return Response.json(fallback, { status: 200 });
  }
}
