'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/** Geo = siempre lugar del hecho (event location). No se usa país del medio para ubicar. */
export type NewsGeo = { lat: number; lng: number; label?: string };

/**
 * Item normalizado: geo = lugar del hecho; source/outlet = attribution (quién publicó), no para mapa.
 * Si no hay geo, el item se muestra en panel con "Sin ubicación" y no va al globo.
 */
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
  /** Solo lugar del hecho. null = sin ubicación (no se dibuja en el mapa). */
  geo: NewsGeo | null;
  lat: number | null;
  lng: number | null;
  topic?: string | null;
};

const NEWS_FETCH_TIMEOUT_MS = 10_000;

/** Fallback cuando la API falla o devuelve 0. Geo = lugar del hecho (demo). */
export const NEWS_FALLBACK_ITEMS: NewsItem[] = [
  { id: 'fb-1', title: 'Noticias en vivo', url: '#', source: 'AlmaMundi', publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: 'AlmaMundi', outletId: null, geo: { lat: 19.43, lng: -99.13 }, lat: 19.43, lng: -99.13 },
  { id: 'fb-2', title: 'Actualidad global', url: '#', source: null, publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: null, outletId: null, geo: { lat: 40.71, lng: -74.0 }, lat: 40.71, lng: -74.0 },
  { id: 'fb-3', title: 'Cobertura mundial', url: '#', source: null, publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: null, outletId: null, geo: { lat: 51.5, lng: -0.12 }, lat: 51.5, lng: -0.12 },
  { id: 'fb-4', title: 'Última hora', url: '#', source: null, publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: null, outletId: null, geo: { lat: -33.86, lng: 151.2 }, lat: -33.86, lng: 151.2 },
  { id: 'fb-5', title: 'En desarrollo', url: '#', source: null, publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: null, outletId: null, geo: { lat: 35.67, lng: 139.65 }, lat: 35.67, lng: 139.65 },
];

export type FetchNewsFn = (topic: string, signal: AbortSignal) => Promise<{ items: NewsItem[]; isFallback?: boolean }>;

export type UseNewsLayerOptions = {
  /** Vista actualidad: volver a pedir noticias cada N ms (día calendario + lista al día). 0 = solo al cambiar tema. */
  refreshIntervalMs?: number;
};

/** Solo items con geo (lugar del hecho) van al globo. */
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

/**
 * Hook estable para la capa de noticias.
 * selectedTopicId = fuente única: fetch y lista solo ese tema.
 * geo = solo lugar del hecho; items sin geo no van al mapa (panel con "Sin ubicación").
 */
export function useNewsLayer(
  selectedTopicId: string | null,
  topicQuery: string,
  activeView: 'historias' | 'actualidad' | 'music' | 'musica' | 'bits',
  fetchNews: FetchNewsFn,
  options?: UseNewsLayerOptions
) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const mountedRef = useRef(true);
  const topicQueryRef = useRef(topicQuery);
  topicQueryRef.current = topicQuery;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Al cambiar tema, la lista anterior suele tener topicId distinto (p. ej. null en "Todas").
   * Un frame con loading=false + filtro estricto dejaba el panel vacío hasta que llegaba el fetch.
   */
  useLayoutEffect(() => {
    if (activeView !== 'actualidad') return;
    setNewsItems([]);
    setLoading(true);
    setError(null);
  }, [topicQuery, activeView]);

  useEffect(() => {
    if (activeView !== 'actualidad') return;
    const ms = options?.refreshIntervalMs ?? 0;
    if (ms <= 0) return;
    const id = window.setInterval(() => setRefreshTick((n) => n + 1), ms);
    return () => window.clearInterval(id);
  }, [activeView, options?.refreshIntervalMs]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS);

    const requestTopic = topicQuery;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
      if (!cancelled) setError(null);
    });
    fetchNews(requestTopic, controller.signal)
      .then((result) => {
        if (cancelled || !mountedRef.current) return;
        if (topicQueryRef.current !== requestTopic) return;
        setNewsItems(result.items);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        if (cancelled || !mountedRef.current) return;
        setLoading(false);
        if (err?.name === 'AbortError') setError(null);
        else setError(err instanceof Error ? err.message : 'Error al cargar noticias');
      })
      .finally(() => window.clearTimeout(t));

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      controller.abort();
    };
  }, [topicQuery, fetchNews, refreshTick]);

  /** Filtro estricto por tema: item.topicId === selectedTopicId (o todos si null). */
  const effectiveNewsItems = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    if (loading) return NEWS_FALLBACK_ITEMS;
    if (error) return NEWS_FALLBACK_ITEMS;
    const raw = newsItems;
    const byTopic =
      selectedTopicId == null
        ? raw
        : raw.filter((n) => n.topicId === selectedTopicId);
    return byTopic;
  }, [activeView, loading, error, newsItems, selectedTopicId]);

  const isFallback = activeView === 'actualidad' && (loading || error != null);

  /** Solo items con geo (lugar del hecho) van al globo. */
  const newsPoints = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    return effectiveNewsItems.map(newsToGlobePoint).filter(Boolean) as Array<ReturnType<typeof newsToGlobePoint> & { id: string; lat: number; lng: number }>;
  }, [activeView, effectiveNewsItems]);

  const newsObjectsForGlobe = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    return effectiveNewsItems.filter((n) => n.geo != null && Number.isFinite(n.geo.lat) && Number.isFinite(n.geo.lng));
  }, [activeView, effectiveNewsItems]);

  return {
    newsItems,
    loading,
    error,
    effectiveNewsItems,
    isFallback,
    newsPoints,
    newsObjectsForGlobe,
  };
}
