import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import type { Item } from "rss-parser";
import { ALMA_FEED_SOURCES } from "@/lib/feedSourcesAlma";

/** Alias para pruebas / URLs antiguas (ej. topic=conflictos → poder-gobernanza). */
const TOPIC_ALIASES: Record<string, string> = {
  conflictos: "poder-gobernanza",
  general: "poder-gobernanza",
};

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "AlmaMundi-Bot/1.0" },
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content", "mediaContent"],
      ["georss:point", "geoPoint"],
    ],
  },
});

const cache = new Map<string, { items: NewsLiveItem[]; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

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

function stableItemId(item: AlmaItem, fallback: string): string {
  const g = item.guid;
  if (typeof g === "string" && g.trim()) return `guid:${g.trim().slice(0, 200)}`;
  if (typeof item.link === "string" && item.link.trim())
    return `link:${Buffer.from(item.link).toString("base64url").slice(0, 48)}`;
  return fallback;
}

async function fetchTopic(topic: string): Promise<NewsLiveItem[]> {
  const cached = cache.get(topic);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
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

  cache.set(topic, { items: allItems, fetchedAt: Date.now() });

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

    items = items.slice(0, limit);

    return NextResponse.json(
      { items, topic, count: items.length },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[news-live] Error:", err);
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
