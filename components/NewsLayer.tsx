'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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

const NEWS_FETCH_TIMEOUT_MS = 18_000;
const NEWS_PANEL_LOADING_HINT_MS = 20_000;

/** Identificadores de placeholder (no mostrar como titulares reales). */
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

/** @deprecated Solo para pruebas; no usar en UI de producto. */
export const NEWS_FALLBACK_ITEMS: NewsItem[] = [
  { id: 'fb-1', title: 'Noticias en vivo', url: '#', source: 'AlmaMundi', publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: 'AlmaMundi', outletId: null, geo: { lat: 19.43, lng: -99.13 }, lat: 19.43, lng: -99.13 },
  { id: 'fb-2', title: 'Actualidad global', url: '#', source: null, publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: null, outletId: null, geo: { lat: 40.71, lng: -74.0 }, lat: 40.71, lng: -74.0 },
  { id: 'fb-3', title: 'Cobertura mundial', url: '#', source: null, publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: null, outletId: null, geo: { lat: 51.5, lng: -0.12 }, lat: 51.5, lng: -0.12 },
  { id: 'fb-4', title: 'Última hora', url: '#', source: null, publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: null, outletId: null, geo: { lat: -33.86, lng: 151.2 }, lat: -33.86, lng: 151.2 },
  { id: 'fb-5', title: 'En desarrollo', url: '#', source: null, publishedAt: new Date().toISOString(), sourceCountry: null, topicId: null, topicLabel: null, outletName: null, outletId: null, geo: { lat: 35.67, lng: 139.65 }, lat: 35.67, lng: 139.65 },
];

export type FetchNewsResult = {
  items: NewsItem[];
  isFallback?: boolean;
  relaxedTopic?: boolean;
};

export type FetchNewsFn = (topic: string, signal: AbortSignal) => Promise<FetchNewsResult>;

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
 * La API ya filtra por tema; no se vuelve a filtrar por topicId en cliente (evita vaciar la lista).
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relaxedTopic, setRelaxedTopic] = useState(false);
  const [showStaleNotice, setShowStaleNotice] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const mountedRef = useRef(true);
  const lastSuccessfulItemsRef = useRef<NewsItem[]>([]);
  const requestSeqRef = useRef(0);
  const topicQueryRef = useRef(topicQuery);

  useEffect(() => {
    topicQueryRef.current = topicQuery;
  }, [topicQuery]);

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
    const hasVisibleItems =
      filterRealNewsItems(newsItems).length > 0 || lastSuccessfulItemsRef.current.length > 0;

    setLoadingTimedOut(false);
    setError(null);
    setRelaxedTopic(false);
    if (hasVisibleItems) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setIsRefreshing(false);
    }

    const controller = new AbortController();
    const abortTimer = window.setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS);
    const hintTimer = window.setTimeout(() => {
      if (requestSeqRef.current !== requestSeq) return;
      setLoadingTimedOut(true);
    }, NEWS_PANEL_LOADING_HINT_MS);

    const finish = () => {
      if (requestSeqRef.current !== requestSeq || !mountedRef.current) return;
      setLoading(false);
      setIsRefreshing(false);
    };

    fetchNews(requestTopic, controller.signal)
      .then((result) => {
        if (requestSeqRef.current !== requestSeq || !mountedRef.current) return;
        if (topicQueryRef.current !== requestTopic) return;

        const realItems = filterRealNewsItems(result.items);
        const isRelaxed = Boolean(result.relaxedTopic);
        setRelaxedTopic(isRelaxed);

        if (realItems.length > 0) {
          lastSuccessfulItemsRef.current = realItems;
          setNewsItems(realItems);
          setShowStaleNotice(isRelaxed);
          setError(null);
          setLoadingTimedOut(false);
        } else if (lastSuccessfulItemsRef.current.length > 0) {
          setNewsItems(lastSuccessfulItemsRef.current);
          setShowStaleNotice(true);
          setError(null);
        } else {
          setShowStaleNotice(false);
          setNewsItems([]);
          setError(
            result.isFallback
              ? 'No pudimos cargar titulares en este momento. Intenta otra categoría.'
              : 'No hay titulares para este tema en este momento.'
          );
        }
      })
      .catch((err) => {
        if (requestSeqRef.current !== requestSeq || !mountedRef.current) return;
        if (topicQueryRef.current !== requestTopic) return;

        const isAbort = err instanceof Error && err.name === 'AbortError';
        if (lastSuccessfulItemsRef.current.length > 0) {
          setNewsItems(lastSuccessfulItemsRef.current);
          setShowStaleNotice(true);
          setError(isAbort ? null : err instanceof Error ? err.message : 'Error al cargar noticias');
        } else if (!isAbort) {
          setNewsItems([]);
          setShowStaleNotice(false);
          setError(err instanceof Error ? err.message : 'Error al cargar noticias');
        } else {
          setShowStaleNotice(false);
          setError('No pudimos cargar titulares en este momento. Intenta otra categoría.');
        }
      })
      .finally(() => {
        window.clearTimeout(abortTimer);
        window.clearTimeout(hintTimer);
        finish();
      });

    return () => {
      window.clearTimeout(abortTimer);
      window.clearTimeout(hintTimer);
      controller.abort();
      finish();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- newsItems solo define modo inicial/recarga
  }, [topicQuery, fetchNews, refreshTick, activeView]);

  const effectiveNewsItems = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    const current = filterRealNewsItems(newsItems);
    if (current.length > 0) return current;
    if (loading || isRefreshing) {
      return filterRealNewsItems(lastSuccessfulItemsRef.current);
    }
    return current;
  }, [activeView, loading, isRefreshing, newsItems]);

  const panelLoading =
    activeView === 'actualidad' &&
    loading &&
    effectiveNewsItems.length === 0 &&
    !loadingTimedOut;

  const isFallback = false;

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
    loading: panelLoading,
    isRefreshing,
    loadingTimedOut,
    error,
    relaxedTopic,
    showStaleNotice,
    effectiveNewsItems,
    isFallback,
    newsPoints,
    newsObjectsForGlobe,
  };
}
