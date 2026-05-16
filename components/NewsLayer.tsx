'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getNewsTopicCacheKey } from '@/lib/news-topics';

/** Geo = siempre lugar del hecho (event location). No se usa país del medio para ubicar. */
export type NewsGeo = { lat: number; lng: number; label?: string };

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  publishedAt: string | null;
  source: string | null;
  sourceCountry: string | null;
  topicId: string | null;
  topicLabel: string | null;
  outletName: string | null;
  outletId: string | null;
  geo: NewsGeo | null;
  lat: number | null;
  lng: number | null;
  topic?: string | null;
  topicMatched?: boolean;
};

const NEWS_FETCH_TIMEOUT_MS = 14_000;
const NEWS_PANEL_HARD_STOP_MS = 12_000;

export function isDemoNewsItem(item: NewsItem): boolean {
  if (item.id.startsWith('fb-') || item.id.startsWith('media-')) return true;
  if (!item.url?.trim() || item.url === '#') return true;
  const t = item.title.trim();
  return (
    t === 'Noticias en vivo' ||
    t === 'Actualidad global' ||
    t === 'Cobertura mundial' ||
    t === 'Última hora' ||
    t === 'En desarrollo'
  );
}

export function filterRealNewsItems(items: NewsItem[]): NewsItem[] {
  return items.filter((n) => !isDemoNewsItem(n) && n.title.trim().length > 0);
}

export const NEWS_FALLBACK_ITEMS: NewsItem[] = [];

export type FetchNewsResult = {
  topicItems: NewsItem[];
  generalItems: NewsItem[];
  topicMatched: boolean;
  relaxedTopic: boolean;
  isFallback?: boolean;
};

/** Respuesta legacy (MapFullPage) o nueva forma con topic/general separados. */
export type FetchNewsFn = (
  topic: string,
  signal: AbortSignal
) => Promise<FetchNewsResult | { items: NewsItem[]; isFallback?: boolean; relaxedTopic?: boolean }>;

function normalizeFetchResult(
  result: FetchNewsResult | { items: NewsItem[]; isFallback?: boolean; relaxedTopic?: boolean }
): FetchNewsResult {
  if ('topicItems' in result) return result;
  const topicItems = filterRealNewsItems(result.items ?? []);
  return {
    topicItems,
    generalItems: [],
    topicMatched: topicItems.length > 0,
    relaxedTopic: Boolean(result.relaxedTopic),
    isFallback: result.isFallback,
  };
}

export type UseNewsLayerOptions = {
  refreshIntervalMs?: number;
};

type TopicCacheEntry = {
  topicItems: NewsItem[];
  generalItems: NewsItem[];
  topicMatched: boolean;
  relaxedTopic: boolean;
};

function newsToGlobePoint(n: NewsItem): { id: string; lat: number; lng: number; kind: 'news'; title: string; source: string | null; publishedAt: string | null; url: string; topic?: string | null; geoLabel?: string; weight: number; altitude: number; radius?: number } | null {
  const geo = n.geo ?? null;
  if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lng)) return null;
  return {
    id: `news:${n.id}`,
    lat: geo.lat,
    lng: geo.lng,
    kind: 'news',
    title: n.title ?? '',
    source: n.source ?? null,
    publishedAt: n.publishedAt ?? null,
    url: n.url ?? '',
    topic: n.topic ?? n.topicLabel ?? null,
    geoLabel: geo.label,
    weight: n.publishedAt ? new Date(n.publishedAt).getTime() : Date.now(),
    altitude: 0.02,
    radius: 0.2,
  };
}

export function useNewsLayer(
  selectedTopicId: string | null,
  topicQuery: string,
  activeView: 'historias' | 'actualidad' | 'music' | 'musica' | 'bits',
  fetchNews: FetchNewsFn,
  options?: UseNewsLayerOptions
) {
  const topicKey = getNewsTopicCacheKey(selectedTopicId);

  const [topicItems, setTopicItems] = useState<NewsItem[]>([]);
  const [generalItems, setGeneralItems] = useState<NewsItem[]>([]);
  const [topicMatched, setTopicMatched] = useState(true);
  const [relaxedTopic, setRelaxedTopic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const mountedRef = useRef(true);
  const cacheByTopicRef = useRef<Record<string, TopicCacheEntry>>({});
  const requestSeqRef = useRef(0);
  const topicQueryRef = useRef(topicQuery);
  const topicKeyRef = useRef(topicKey);

  useEffect(() => {
    topicQueryRef.current = topicQuery;
    topicKeyRef.current = topicKey;
  }, [topicQuery, topicKey]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (activeView !== 'actualidad') return;
    const ms = options?.refreshIntervalMs ?? 0;
    if (ms <= 0) return;
    const id = window.setInterval(() => setRefreshTick((n) => n + 1), ms);
    return () => window.clearInterval(id);
  }, [activeView, options?.refreshIntervalMs]);

  useEffect(() => {
    if (activeView !== 'actualidad') return;

    const requestSeq = ++requestSeqRef.current;
    const requestTopic = topicQuery;
    const requestKey = topicKey;
    const cached = cacheByTopicRef.current[requestKey];
    const hasCache = Boolean(
      cached && (cached.topicItems.length > 0 || cached.generalItems.length > 0)
    );

    if (hasCache && cached) {
      setTopicItems(cached.topicItems);
      setGeneralItems(cached.generalItems);
      setTopicMatched(cached.topicMatched);
      setRelaxedTopic(cached.relaxedTopic);
      setLoading(false);
      setIsRefreshing(true);
    } else {
      setTopicItems([]);
      setGeneralItems([]);
      setLoading(true);
      setIsRefreshing(false);
    }

    setLoadingTimedOut(false);
    setError(null);

    const controller = new AbortController();
    const abortTimer = window.setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS);

    const endLoading = () => {
      if (!mountedRef.current || requestSeqRef.current !== requestSeq) return;
      setLoading(false);
      setIsRefreshing(false);
    };

    const hardStopTimer = window.setTimeout(() => {
      if (requestSeqRef.current !== requestSeq || !mountedRef.current) return;
      setLoadingTimedOut(true);
      endLoading();
      const entry = cacheByTopicRef.current[requestKey];
      if (entry) {
        setTopicItems(entry.topicItems);
        setGeneralItems(entry.generalItems);
        setTopicMatched(entry.topicMatched);
        setRelaxedTopic(entry.relaxedTopic);
        setError(null);
      } else {
        setError('No pudimos cargar titulares en este momento. Intenta otra categoría.');
      }
    }, NEWS_PANEL_HARD_STOP_MS);

    const applyResult = (result: FetchNewsResult) => {
      const tItems = filterRealNewsItems(result.topicItems);
      const gItems = filterRealNewsItems(result.generalItems);
      const entry: TopicCacheEntry = {
        topicItems: tItems,
        generalItems: gItems,
        topicMatched: result.topicMatched,
        relaxedTopic: result.relaxedTopic,
      };
      cacheByTopicRef.current[requestKey] = entry;
      setTopicItems(tItems);
      setGeneralItems(gItems);
      setTopicMatched(result.topicMatched);
      setRelaxedTopic(result.relaxedTopic);
      setError(null);
      setLoadingTimedOut(false);
    };

    fetchNews(requestTopic, controller.signal)
      .then((raw) => {
        const result = normalizeFetchResult(raw);
        if (!mountedRef.current || requestSeqRef.current !== requestSeq) return;
        if (topicQueryRef.current !== requestTopic || topicKeyRef.current !== requestKey) return;

        const tItems = filterRealNewsItems(result.topicItems);
        const gItems = filterRealNewsItems(result.generalItems);

        if (tItems.length > 0 || gItems.length > 0) {
          applyResult(result);
          return;
        }

        if (result.isFallback) {
          setTopicItems([]);
          setGeneralItems([]);
          setTopicMatched(false);
          setRelaxedTopic(false);
          setError('No pudimos cargar titulares en este momento. Intenta otra categoría.');
          return;
        }

        setTopicItems([]);
        setGeneralItems([]);
        setTopicMatched(false);
        setRelaxedTopic(false);
        setError('No encontramos titulares recientes para esta categoría.');
      })
      .catch((err) => {
        if (!mountedRef.current || requestSeqRef.current !== requestSeq) return;
        if (topicQueryRef.current !== requestTopic || topicKeyRef.current !== requestKey) return;

        const entry = cacheByTopicRef.current[requestKey];
        if (entry && (entry.topicItems.length > 0 || entry.generalItems.length > 0)) {
          setTopicItems(entry.topicItems);
          setGeneralItems(entry.generalItems);
          setTopicMatched(entry.topicMatched);
          setRelaxedTopic(entry.relaxedTopic);
          const isAbort = err instanceof Error && err.name === 'AbortError';
          setError(isAbort ? null : err instanceof Error ? err.message : 'Error al cargar noticias');
          return;
        }

        setTopicItems([]);
        setGeneralItems([]);
        const isAbort = err instanceof Error && err.name === 'AbortError';
        setError(
          isAbort
            ? 'No pudimos cargar titulares en este momento. Intenta otra categoría.'
            : err instanceof Error
              ? err.message
              : 'Error al cargar noticias'
        );
      })
      .finally(() => {
        window.clearTimeout(abortTimer);
        window.clearTimeout(hardStopTimer);
        endLoading();
      });

    return () => {
      window.clearTimeout(abortTimer);
      window.clearTimeout(hardStopTimer);
      controller.abort();
    };
  }, [topicQuery, topicKey, fetchNews, refreshTick, activeView]);

  const effectiveTopicItems = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    return filterRealNewsItems(topicItems);
  }, [activeView, topicItems]);

  const effectiveGeneralItems = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    return filterRealNewsItems(generalItems);
  }, [activeView, generalItems]);

  const panelLoading =
    activeView === 'actualidad' &&
    loading &&
    effectiveTopicItems.length === 0 &&
    effectiveGeneralItems.length === 0;

  const newsPoints = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    return effectiveTopicItems.map(newsToGlobePoint).filter(Boolean) as Array<
      ReturnType<typeof newsToGlobePoint> & { id: string; lat: number; lng: number }
    >;
  }, [activeView, effectiveTopicItems]);

  const newsObjectsForGlobe = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    return effectiveTopicItems.filter(
      (n) => n.geo != null && Number.isFinite(n.geo.lat) && Number.isFinite(n.geo.lng)
    );
  }, [activeView, effectiveTopicItems]);

  return {
    newsItems: effectiveTopicItems,
    topicItems: effectiveTopicItems,
    generalItems: effectiveGeneralItems,
    loading: panelLoading,
    isRefreshing,
    loadingTimedOut,
    error,
    topicMatched,
    relaxedTopic,
    showStaleNotice: false,
    effectiveNewsItems: [...effectiveTopicItems, ...effectiveGeneralItems],
    isFallback: false,
    newsPoints,
    newsObjectsForGlobe,
  };
}
