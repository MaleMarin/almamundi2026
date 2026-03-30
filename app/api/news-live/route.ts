import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import type { Item } from "rss-parser";
import { ALMA_FEED_SOURCES } from "@/lib/feedSourcesAlma";
import { isPublishedOnCalendarDay, sanitizeDayYmd, sanitizeTimeZone } from "@/lib/news-calendar-day";

/** rss-parser + fetch a feeds externos: Node completo (evita fallos en Edge / Buffer). */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Alias para pruebas / nombres cortos → id de NEWS_TOPIC_GROUPS. Incluye temas del NewsStrip. */
const TOPIC_ALIASES: Record<string, string> = {
  conflictos: "poder-gobernanza",
  general: "poder-gobernanza",
  arte: "arte-cultura",
  tecnologia: "tecnologia-innovacion",
  economia: "finanzas-salud",
  salud: "finanzas-salud",
  migracion: "migracion-derechos",
  cine: "arte-cultura",
  musica: "arte-cultura",
  viajes: "arte-cultura",
  historias: "arte-cultura",
  literatura: "arte-cultura",
};

const parser = new Parser({
  timeout: 15_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; AlmaMundi/1.0; +https://almamundi.org) AppleWebKit/537.36 (KHTML, like Gecko)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content", "mediaContent"],
      ["georss:point", "geoPoint"],
    ],
  },
});

const cache = new Map<string, { items: NewsLiveItem[]; fetchedAt: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000;

export interface NewsLiveItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  topic: string;
  language: string;
  region: string;
  publishedAt: string | null;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
}

type AlmaItem = Item & {
  mediaThumbnail?: { $?: { url?: string } } | string;
  mediaContent?: { $?: { url?: string } } | string;
  geoPoint?: string;
};

function pickThumbnailUrl(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as { $?: { url?: string }; url?: string };
  if (typeof o.$?.url === "string") return o.$.url;
  if (typeof o.url === "string") return o.url;
  return null;
}

function extractImage(item: AlmaItem): string | null {
  return (
    pickThumbnailUrl(item.mediaThumbnail) ??
    pickThumbnailUrl(item.mediaContent) ??
    (typeof item.enclosure?.url === "string" ? item.enclosure.url : null) ??
    null
  );
}

function extractGeo(item: AlmaItem): { lat: number | null; lng: number | null } {
  const gp = item.geoPoint;
  if (typeof gp === "string" && gp.trim()) {
    const parts = gp.trim().split(/\s+/);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  return { lat: null, lng: null };
}

/** Id estable sin Buffer (compatible Edge / cualquier runtime). */
function hashLinkFragment(link: string): string {
  let h = 2166136261;
  for (let i = 0; i < link.length; i++) {
    h ^= link.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function stableItemId(item: AlmaItem, fallback: string): string {
  const g = item.guid;
  if (typeof g === "string" && g.trim()) return `guid:${g.trim().slice(0, 200)}`;
  if (typeof item.link === "string" && item.link.trim())
    return `link:${hashLinkFragment(item.link.trim())}`;
  return fallback;
}

async function fetchTopic(topic: string): Promise<NewsLiveItem[]> {
  const cached = cache.get(topic);
  /* No reutilizar listas vacías: si todos los RSS fallaron, el siguiente request reintenta. */
  if (cached && cached.items.length > 0 && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.items;
  }

  const sources = ALMA_FEED_SOURCES.filter((s) => s.topic === topic);
  if (sources.length === 0) {
    return [];
  }

  const allItems: NewsLiveItem[] = [];

  await Promise.allSettled(
    sources.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        const items = (feed.items.slice(0, 10) as AlmaItem[]).map((item, i): NewsLiveItem => {
          const geo = extractGeo(item);
          const pub = item.pubDate ?? item.isoDate;
          let publishedAt: string | null = null;
          if (pub) {
            try {
              publishedAt = new Date(pub).toISOString();
            } catch {
              publishedAt = null;
            }
          }
          return {
            id: stableItemId(item, `${source.id}-${i}`),
            title: item.title ?? "",
            summary: item.contentSnippet ?? item.summary ?? "",
            url: item.link ?? "",
            source: source.name,
            topic: source.topic,
            language: source.language,
            region: source.region,
            publishedAt,
            imageUrl: extractImage(item),
            lat: geo.lat,
            lng: geo.lng,
          };
        });
        allItems.push(...items);
      } catch (err) {
        console.error(`[news-live] Error fetching ${source.name}:`, err);
      }
    })
  );

  allItems.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  if (allItems.length > 0) {
    cache.set(topic, { items: allItems, fetchedAt: Date.now() });
  }

  return allItems;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topicRaw = searchParams.get("topic") ?? "general";
  const topic = TOPIC_ALIASES[topicRaw] ?? topicRaw;
  const limitRaw = searchParams.get("limit");
  const limitParsed = limitRaw != null ? parseInt(limitRaw, 10) : 20;
  const limit = Math.min(Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : 20, 50);
  const geoOnly = searchParams.get("geoOnly") === "true";

  try {
    let items = await fetchTopic(topic);

    if (geoOnly) {
      items = items.filter((i) => i.lat !== null && i.lng !== null);
    }

    const dayParam = sanitizeDayYmd(searchParams.get("day"));
    const tzParam = sanitizeTimeZone(searchParams.get("tz"));
    if (dayParam && tzParam) {
      const dayFiltered = items.filter((i) =>
        isPublishedOnCalendarDay(i.publishedAt, dayParam, tzParam)
      );
      // Solo aplicar día si hay resultados; si no, los RSS suelen traer ayer o sin pubDate válido
      if (dayFiltered.length > 0) {
        items = dayFiltered;
      }
    }

    items = items.slice(0, limit);

    return NextResponse.json(
      { items, topic, count: items.length },
      {
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[news-live] Error:", err);
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
