'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Search,
  Filter,
  ChevronDown,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { TopicsModal, type TopicsModalStory } from '@/components/mapa/TopicsModal';
import { WorldClock } from '../../components/mapa/WorldClock';
import { INSPIRATION_TOPICS } from '@/lib/topics';
import { DEFAULT_NEWS_TOPIC_QUERY } from '@/lib/news-topics';
import { getMediaByDomain, normalizeDomain } from '@/lib/media-sources';
import type { Material } from 'three';

const GlobeComp = dynamic(() => import('react-globe.gl'), { ssr: false });

const APP_FONT = 'Avenir, sans-serif';
const GLOBE_PAGE_BG = 'linear-gradient(135deg, #0F172A 0%, #1A202C 50%, #0F172A 100%)';

// === GLOBE LIGHTING (CLONE) ===
const GLOBE_EXPOSURE = 2.25;
const GLOBE_EMISSIVE_INTENSITY = 0.30;
const GLOBE_SHININESS = 26;
const GLOBE_SPECULAR = 0x2f4660;
const AMBIENT_INTENSITY = 0.68;
const KEY_INTENSITY = 2.6;
const FILL_INTENSITY = 0.90;
const RIM_INTENSITY = 1.7;

const GLOBE_CANVAS_BG = 'rgba(0,0,0,0)';

const GLOBE_IMAGE_LOCAL = '/textures/earth-night.jpg';
const GLOBE_IMAGE_DAY_LOCAL = '/textures/earth-day.jpg';

const STARFIELD_DEBUG = false;

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E0E5EC',
    boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '40px'
  },
  inset: {
    backgroundColor: '#E0E5EC',
    boxShadow: 'inset 6px 6px 10px rgba(163,177,198,0.7), inset -6px -6px 10px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '30px'
  },
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
    fontFamily: APP_FONT
  }
} as const;

const globalStyles = `
  html { scroll-behavior: smooth; }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
  .animate-float { animation: float 6s ease-in-out infinite; }
  /* Starfield es un canvas dinámico (no CSS / no imagen estática) */

  .vignette{
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index: 3;
  background: radial-gradient(ellipse 120% 100% at 50% 50%,
    rgba(0,0,0,0) 0%,
    rgba(0,0,0,0.35) 65%,
    rgba(0,0,0,0.70) 100%);
  opacity: 0.85;
  }

  .mapLeftStage{
  position:relative;
  overflow:hidden;
  isolation:isolate;
  }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* starOverlay eliminado: reemplazado por canvas */

  .liveOverlay {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  }
  .liveFrameWrap {
  position: relative;
  max-width: min(420px, 92vw);
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
  background: #1a1a1a;
  }
  .liveFrameWrap iframe {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  border: none;
  }
  .liveOverlay .liveCloseBtn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
  transition: background 0.2s ease, transform 0.15s ease;
  }
  .liveOverlay .liveCloseBtn:hover {
  background: rgba(0,0,0,0.7);
  transform: scale(1.05);
  }

  .newsOverlay {
  position: absolute;
  inset: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  pointer-events: auto;
  background: rgba(0,0,0,0.25);
  }
  .newsCard {
  pointer-events: auto;
  max-width: min(420px, 92vw);
  width: 100%;
  padding: 22px 24px;
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.88) 0%, rgba(30, 41, 59, 0.75) 50%, rgba(15, 23, 42, 0.82) 100%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.10);
  border-top: 1px solid rgba(249,115,22,0.15);
  box-shadow:
    0 28px 70px rgba(0,0,0,0.5),
    0 0 0 1px rgba(255,255,255,0.06),
    0 20px 40px -12px rgba(249,115,22,0.12),
    0 0 60px -10px rgba(249,115,22,0.08);
  animation: newsIn 240ms ease-out both;
  position: relative;
  }
  .newsCard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(249,115,22,0.9), transparent);
  border-radius: 22px 22px 0 0;
  }
  @keyframes newsIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .newsCard .newsCardBadge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(249,115,22,0.95);
  margin-bottom: 10px;
  }
  .newsCard .newsTitle {
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  }
  .newsCard .newsMeta {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255,255,255,0.62);
  }
  .newsCard .newsActions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  }
  .newsCard .newsBtnPrimary {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(249,115,22,0.16);
  border: 1px solid rgba(249,115,22,0.25);
  color: #F97316;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  }
  .newsCard .newsBtnPrimary:hover {
  background: rgba(249,115,22,0.25);
  transform: translateY(-1px);
  }
  .newsCard .newsBtnGhost {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.85);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  }
  .newsCard .newsBtnGhost:hover {
  background: rgba(255,255,255,0.10);
  }

  @keyframes tickerMarquee {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
  }
  .tickerStrip {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 25;
  flex-shrink: 0;
  height: 48px;
  min-height: 48px;
  overflow: hidden;
  padding: 0 14px;
  max-width: 100%;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(15,23,42,0.92);
  border-radius: 12px;
  margin-top: auto;
  }
  .tickerMarquee {
  display: inline-block;
  animation: tickerMarquee 35s linear infinite;
  padding-left: 100%;
  white-space: nowrap;
  }
  .tickerMarquee:hover {
  animation-play-state: paused;
  }

  .hudOverlay, .hudOverlayBg { display: none; }
`;

type StoryPoint = {
  id?: string;
  lat: number;
  lng: number;
  label: string;
  topic?: string;
  description?: string;
  city?: string;
  country?: string;
  timezone?: string;
};
type NewsRing = { lat: number; lng: number; maxR: number; propagationSpeed: number; repeatPeriod: number; newsId?: string };

type NewsItem = {
  id: string;
  /** Título real de la API; no se modifica en frontend. */
  title: string;
  url: string;
  /** source normalizado contra lib/media-sources.ts; nunca string suelto del RSS. */
  source: string | null;
  publishedAt: string | null;
  sourceCountry: string | null;
  lat: number | null;
  lng: number | null;
  /** true si falta al menos uno de: title, source, publishedAt, url */
  isPartial?: boolean;
};

/** Obtiene el nombre del medio según la lista curada (media-sources). No usa strings sueltos del RSS. */
function getCuratedSourceName(url: string | null | undefined, fallbackSource: string | null): string | null {
  if (!url || !url.trim()) return fallbackSource;
  try {
    const hostname = new URL(url).hostname || '';
    const domain = normalizeDomain(hostname);
    const media = getMediaByDomain(domain);
    if (media) return media.name;
  } catch {
    // URL inválida
  }
  return fallbackSource;
}

const NEWS_FETCH_TIMEOUT_MS = 25_000;
const NEWS_RING_MAX_R = 14;
const NEWS_RING_SPEED = 10;
const NEWS_RING_PERIOD = 1600;

/** Pulso global: ventana 24h, máximo 50 regiones, un punto por región, intensidad por cantidad */
const PULSO_WINDOW_MS = 24 * 60 * 60 * 1000;
const PULSO_MAX_REGIONS = 50;
const PULSO_BASE_RADIUS = 0.05;
const PULSO_INTENSITY_SCALE = 8; // count/scale -> intensity cap 1

type LiveCam = {
  id: string;
  slug: string;
  title: string;
  place: string;
  country: string;
  timezone: string;
  lat: number;
  lng: number;
  tags: string[];
  provider: string;
  embedUrl: string; // URL embebible (youtube embed / provider embed) - vacío si no es embebible
  sourceUrl: string; // URL original (abrir en nueva pestaña)
  priority: number;
};

const LIVE_CAMS: LiveCam[] = [
  {
    id: 'iss-live',
    slug: 'iss-live',
    title: 'Tierra desde la ISS (en vivo)',
    place: 'Órbita baja (ISS)',
    country: 'Espacio',
    timezone: 'UTC',
    lat: 0,
    lng: 0,
    tags: ['espacio', 'tierra', 'nasa'],
    provider: 'NASA',
    embedUrl: 'https://www.youtube.com/embed/86YLFOog4GM?autoplay=1&mute=1',
    sourceUrl: 'https://www.youtube.com/watch?v=86YLFOog4GM',
    priority: 1,
  },
  {
    id: 'nyc-times-square',
    slug: 'nyc-times-square',
    title: 'Times Square en vivo',
    place: 'New York, EE.UU.',
    country: 'EE.UU.',
    timezone: 'America/New_York',
    lat: 40.7580,
    lng: -73.9855,
    tags: ['ciudad', 'multitud', 'iconico'],
    provider: 'EarthCam',
    embedUrl: 'https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=1&mute=1',
    sourceUrl: 'https://www.earthcam.com/usa/newyork/timessquare/',
    priority: 1,
  },
  {
    id: 'tokyo-shibuya',
    slug: 'tokyo-shibuya',
    title: 'Shibuya Crossing en vivo',
    place: 'Tokyo, Japón',
    country: 'Japón',
    timezone: 'Asia/Tokyo',
    lat: 35.6598,
    lng: 139.7006,
    tags: ['ciudad', 'multitud', 'iconico'],
    provider: 'YouTube',
    embedUrl: 'https://www.youtube.com/embed/9nA7XwX6JIg?autoplay=1&mute=1',
    sourceUrl: 'https://www.youtube.com/watch?v=9nA7XwX6JIg',
    priority: 1,
  },
  {
    id: 'sydney-harbour',
    slug: 'sydney-harbour',
    title: 'Sydney Harbour en vivo',
    place: 'Sydney, Australia',
    country: 'Australia',
    timezone: 'Australia/Sydney',
    lat: -33.8688,
    lng: 151.2093,
    tags: ['ciudad', 'iconico', 'puerto'],
    provider: 'YouTube',
    embedUrl: 'https://www.youtube.com/embed/1EiC9bvVGnk?autoplay=1&mute=1',
    sourceUrl: 'https://www.youtube.com/watch?v=1EiC9bvVGnk',
    priority: 2,
  },
  {
    id: 'london-tower-bridge',
    slug: 'london-tower-bridge',
    title: 'Tower Bridge en vivo',
    place: 'Londres, Reino Unido',
    country: 'Reino Unido',
    timezone: 'Europe/London',
    lat: 51.5055,
    lng: -0.0754,
    tags: ['ciudad', 'iconico', 'puente'],
    provider: 'YouTube',
    embedUrl: 'https://www.youtube.com/embed/49Ye9s8U2sU?autoplay=1&mute=1',
    sourceUrl: 'https://www.youtube.com/watch?v=49Ye9s8U2sU',
    priority: 2,
  },
  {
    id: 'paris-eiffel',
    slug: 'paris-eiffel',
    title: 'Torre Eiffel en vivo',
    place: 'París, Francia',
    country: 'Francia',
    timezone: 'Europe/Paris',
    lat: 48.8584,
    lng: 2.2945,
    tags: ['ciudad', 'iconico', 'monumento'],
    provider: 'YouTube',
    embedUrl: 'https://www.youtube.com/embed/4AvURp9_wGQ?autoplay=1&mute=1',
    sourceUrl: 'https://www.youtube.com/watch?v=4AvURp9_wGQ',
    priority: 1,
  },
  {
    id: 'santiago-centro',
    slug: 'santiago-centro',
    title: 'Santiago Centro',
    place: 'Santiago de Chile',
    country: 'Chile',
    timezone: 'America/Santiago',
    lat: -33.4489,
    lng: -70.6693,
    tags: ['ciudad', 'trafico', 'centro'],
    provider: 'SkylineWebcams',
    embedUrl: '', // No embebible - solo link
    sourceUrl: 'https://www.skylinewebcams.com/es/webcam/chile/region-metropolitana/santiago/santiago-centro.html',
    priority: 2,
  },
  {
    id: 'dubai-burj-khalifa',
    slug: 'dubai-burj-khalifa',
    title: 'Burj Khalifa en vivo',
    place: 'Dubai, Emiratos Árabes',
    country: 'Emiratos Árabes',
    timezone: 'Asia/Dubai',
    lat: 25.1972,
    lng: 55.2744,
    tags: ['ciudad', 'iconico', 'rascacielos'],
    provider: 'YouTube',
    embedUrl: 'https://www.youtube.com/embed/1La4QzGeaaQ?autoplay=1&mute=1',
    sourceUrl: 'https://www.youtube.com/watch?v=1La4QzGeaaQ',
    priority: 2,
  },
];

type RegionPoint = {
  lat: number;
  lng: number;
  label: string;
  countryCode: string;
  count: number;
  intensity: number;
  lastUpdate: number;
  newsIds: string[];
  altitude: number;
  radius: number;
};

function groupNewsByRegion(
  items: NewsItem[],
  windowMs: number,
  maxRegions: number
): RegionPoint[] {
  const now = Date.now();
  const cutoff = now - windowMs;
  const withCoords = items.filter(
    (i): i is NewsItem & { lat: number; lng: number } => i.lat != null && i.lng != null
  );
  const inWindow = withCoords.filter((i) => {
    if (!i.publishedAt) return true;
    const t = new Date(i.publishedAt).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
  const byKey = new Map<string, { lat: number; lng: number; count: number; lastUpdate: number; newsIds: string[]; countryCode: string }>();
  for (const i of inWindow) {
    const countryCode = (i.sourceCountry && i.sourceCountry.trim()) || `@${i.lat.toFixed(1)}_${i.lng.toFixed(1)}`;
    const key = countryCode;
    const existing = byKey.get(key);
    const ts = i.publishedAt ? new Date(i.publishedAt).getTime() : now;
    if (!existing) {
      byKey.set(key, { lat: i.lat, lng: i.lng, count: 1, lastUpdate: ts, newsIds: [i.id], countryCode });
    } else {
      existing.count += 1;
      existing.lastUpdate = Math.max(existing.lastUpdate, ts);
      existing.newsIds.push(i.id);
    }
  }
  const regions = Array.from(byKey.entries())
    .map(([, v]) => v)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxRegions);
  return regions.map((r) => {
    const intensity = Math.min(1, r.count / PULSO_INTENSITY_SCALE);
    const radius = PULSO_BASE_RADIUS * (0.6 + 0.4 * intensity);
    return {
      lat: r.lat,
      lng: r.lng,
      label: `${r.countryCode.replace(/^@/, '')} (${r.count})`,
      countryCode: r.countryCode,
      count: r.count,
      intensity,
      lastUpdate: r.lastUpdate,
      newsIds: r.newsIds,
      altitude: 0,
      radius
    };
  });
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function easeInOutCubic(t: number): number {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

function hashToUint32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function hashToUnit(str: string): number {
  return hashToUint32(str) / 4294967295;
}
function safeColor(input: unknown, fallback: string): string {
  return typeof input === "string" && input.trim().length > 0 ? input : fallback;
}

const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  CL: { lat: -33.45, lng: -70.66 },
  AR: { lat: -34.61, lng: -58.38 },
  BR: { lat: -15.79, lng: -47.88 },
  MX: { lat: 19.43, lng: -99.13 },
  ES: { lat: 40.42, lng: -3.70 },
  US: { lat: 38.90, lng: -77.04 },
  GB: { lat: 51.50, lng: -0.12 },
  FR: { lat: 48.86, lng: 2.35 },
  DE: { lat: 52.52, lng: 13.41 },
  IT: { lat: 41.90, lng: 12.50 },
  CO: { lat: 4.71, lng: -74.07 },
  PE: { lat: -12.05, lng: -77.04 },
  VE: { lat: 10.48, lng: -66.90 },
  EC: { lat: -0.18, lng: -78.47 },
  UY: { lat: -34.90, lng: -56.16 },
  PY: { lat: -25.26, lng: -57.58 },
  BO: { lat: -16.50, lng: -68.15 },
  CHILE: { lat: -33.45, lng: -70.66 },
  ARGENTINA: { lat: -34.61, lng: -58.38 },
  MEXICO: { lat: 19.43, lng: -99.13 },
  SPAIN: { lat: 40.42, lng: -3.70 },
  COLOMBIA: { lat: 4.71, lng: -74.07 },
  PERU: { lat: -12.05, lng: -77.04 },
  FRANCE: { lat: 48.86, lng: 2.35 },
  GERMANY: { lat: 52.52, lng: 13.41 },
  ITALY: { lat: 41.90, lng: 12.50 },
  "UNITED STATES": { lat: 38.90, lng: -77.04 },
  "UNITED KINGDOM": { lat: 51.50, lng: -0.12 },
};

function withFallbackLatLng<T extends { id?: string; url?: string; title?: string; sourceCountry?: string | null; lat?: number | null; lng?: number | null }>(
  item: T
): T & { lat: number; lng: number } {
  if (item.lat != null && item.lng != null) return { ...item, lat: item.lat, lng: item.lng };
  const raw = (item.sourceCountry || "").trim();
  const code = raw.toUpperCase();
  const cc = COUNTRY_CENTROIDS[code] ?? COUNTRY_CENTROIDS[code.slice(0, 2)];
  if (cc) return { ...item, lat: cc.lat, lng: cc.lng };
  const key = item.id || item.url || item.title || JSON.stringify(item);
  const u1 = hashToUnit(key);
  const u2 = hashToUnit("lng:" + key);
  const lat = u1 * 130 - 60;
  const lng = u2 * 360 - 180;
  return { ...item, lat, lng };
}

function normalizeColorsSafe(item: NewsItem & { lat: number; lng: number }): NewsItem & { lat: number; lng: number } {
  return item;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(700);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      setWidth(r?.width ?? 900);
      setHeight(r?.height ?? 700);
    });
    ro.observe(el);
    setWidth(el.clientWidth || 900);
    setHeight(el.clientHeight || 700);
    return () => ro.disconnect();
  }, []);
  return { ref, width, height };
}

function StarfieldCanvas({
  width,
  height,
  enabled
}: {
  width: number;
  height: number;
  enabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Array<{ x: number; y: number; r: number; a: number; v: number }>>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      const nx = window.innerWidth > 0 ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
      const ny = window.innerHeight > 0 ? (e.clientY / window.innerHeight) * 2 - 1 : 0;
      mouseRef.current = { x: nx, y: ny };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(800, Math.min(1200, Math.floor((w * h) / 1300)));
    const stars: Array<{ x: number; y: number; r: number; a: number; v: number }> = [];
    for (let i = 0; i < count; i++) {
      const r = 0.5 + Math.random() * 1.1;
      const a = 0.4 + Math.random() * 0.4; // 0.4–0.8
      const v = 0.0006 + Math.random() * 0.004; // px/ms (más lento)
      stars.push({ x: Math.random() * w, y: Math.random() * h, r, a, v });
    }
    starsRef.current = stars;

    const loop = (ts: number) => {
      const last = lastFrameRef.current || ts;
      const dt = Math.min(80, ts - last);
      lastFrameRef.current = ts;

      // 30fps aprox
      if (dt < 33) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const { x: mx, y: my } = mouseRef.current;
      const ox = mx * 10;
      const oy = my * 6;

      ctx.clearRect(0, 0, w, h);

      for (const s of starsRef.current) {
        s.x -= s.v * dt;
        if (s.x < -2) s.x = w + 2;
        const px = s.x + ox;
        const py = s.y + oy;
        if (px < -20 || px > w + 20 || py < -20 || py > h + 20) continue;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled, width, height]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0.75 }} />;
}

function normalizeQuery(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
function storySearchHaystack(s: StoryPoint): string {
  return normalizeQuery(
    [s.topic, s.label, s.description, s.city, s.country].filter(Boolean).join(' ')
  );
}

/* ----- Panel derecho: título + búsqueda + acciones (Temas, Explorar, Colecciones, Sonido) + vistas ----- */
/** Tiempo relativo desde publishedAt usando `now` (se actualiza cada minuto en Pulso Global, sin refetch). */
function formatTimeAgoFromNow(publishedAt: string | null, now: number): string {
  if (!publishedAt) return '—';
  try {
    const ts = new Date(publishedAt).getTime();
    if (Number.isNaN(ts)) return '—';
    const diffMs = now - ts;
    if (diffMs < 0) return '—';
    const minutesAgo = Math.floor(diffMs / 60000);
    if (minutesAgo < 1) return 'hace unos segundos';
    if (minutesAgo === 1) return 'hace 1 minuto';
    if (minutesAgo < 60) return `hace ${minutesAgo} minutos`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo === 1) return 'hace 1 hora';
    if (minutesAgo < 1440) return `hace ${hoursAgo} horas`;
    const daysAgo = Math.floor(minutesAgo / 1440);
    if (daysAgo === 1) return 'hace 1 día';
    return `hace ${daysAgo} días`;
  } catch {
    return '—';
  }
}

function RightPanel({
  topicsOpen,
  onTopicsToggle,
  topicsButtonRef,
  isMuted,
  onToggleAudio,
  activeView,
  onActiveViewChange,
  selectedTopic,
  onClearTopic,
  selectedStory,
  onClearStory,
  newsItems,
  lastNewsUpdate,
  newsLoading = false,
  newsError = null,
  newsIsFallback = false,
  selectedNews,
  onSelectNews,
  onClearSelection,
  liveOverlay = null,
  onCloseLive,
  cameraSearchQuery = '',
  onCameraSearchQueryChange,
  onOpenLive
}: {
  topicsOpen: boolean;
  onTopicsToggle: () => void;
  topicsButtonRef: React.RefObject<HTMLButtonElement | null>;
  isMuted: boolean;
  onToggleAudio: () => void;
  activeView: 'historias' | 'actualidad' | 'envivo' | 'camaras';
  onActiveViewChange: (view: 'historias' | 'actualidad' | 'envivo' | 'camaras') => void;
  selectedTopic: string | null;
  onClearTopic: () => void;
  selectedStory: StoryPoint | null;
  onClearStory: () => void;
  newsItems: NewsItem[];
  lastNewsUpdate: number;
  newsLoading?: boolean;
  newsError?: string | null;
  newsIsFallback?: boolean;
  selectedNews: NewsItem | null;
  onSelectNews: (item: NewsItem) => void;
  onClearSelection: () => void;
  liveOverlay?: { embedUrl: string; title: string } | null;
  onCloseLive?: () => void;
  cameraSearchQuery?: string;
  onCameraSearchQueryChange?: (q: string) => void;
  onOpenLive?: (overlay: { embedUrl: string; title: string }) => void;
}) {
  const [secondsAgo, setSecondsAgo] = useState(0);
  useEffect(() => {
    setSecondsAgo(Math.floor((Date.now() - lastNewsUpdate) / 1000));
    const id = window.setInterval(() => setSecondsAgo(Math.floor((Date.now() - lastNewsUpdate) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [lastNewsUpdate]);

  /** Actualización cada minuto del tiempo relativo en Pulso Global; no refetch. */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  /** Filtrado de cámaras - debe estar fuera del condicional para cumplir Rules of Hooks */
  const filteredCameras = useMemo(() => {
    const q = normalizeQuery(cameraSearchQuery);
    const filtered: LiveCam[] = q
      ? LIVE_CAMS.filter(
          (cam: LiveCam) =>
            normalizeQuery(cam.title).includes(q) ||
            normalizeQuery(cam.place).includes(q) ||
            cam.tags.some((tag: string) => normalizeQuery(tag).includes(q))
        )
      : LIVE_CAMS;
    return filtered.slice(0, 12);
  }, [cameraSearchQuery]);

  const views = [
    { id: 'historias' as const, title: 'Historias', description: 'Relatos ciudadanos en el mapa.' },
    { id: 'actualidad' as const, title: 'Pulso Global', description: 'Noticias y actualidad verificada.' },
    { id: 'envivo' as const, title: 'Visión Directa', description: 'Cámaras en tiempo real.' },
    { id: 'camaras' as const, title: 'Cámaras', description: 'Cámaras en vivo del mundo. Elige una para verla en pantalla completa sin salir del mapa.' }
  ];

  // Estilos liquid glass base para cards
  const glassCardClass = "rounded-[24px] border border-white/12 bg-[rgba(15,25,45,0.35)] backdrop-blur-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]";

  return (
    <div
      className="shrink-0 h-full min-h-0 relative z-20 flex flex-col overflow-y-auto overflow-x-hidden"
      style={{ fontFamily: APP_FONT, width: 420, height: '100vh', maxHeight: '100vh', padding: '24px', gap: '18px' }}
    >
      {/* Card 1: Header "Explora el mapa" */}
      <div className={`shrink-0 p-6 ${glassCardClass}`}>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Explora el mapa
        </h2>
        <p className="text-gray-300/90 text-sm md:text-base leading-relaxed">
          Tres formas de mirar el mundo en AlmaMundi. Elige una y haz clic en un punto para abrirlo.
        </p>
      </div>

      {/* Card 2: Search */}
      <div className={`shrink-0 p-4 ${glassCardClass}`}>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/40">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Busca por palabras claves o fechas"
            className="w-full pl-12 pr-4 py-3 rounded-2xl outline-none text-white placeholder:text-white/35 text-sm font-medium border border-white/10 bg-white/5 focus:bg-white/10 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Card 3: Acciones Temas y Sonido */}
      <div className={`shrink-0 p-4 ${glassCardClass}`}>
        <div className="flex flex-wrap gap-3">
          <button
            ref={topicsButtonRef}
            type="button"
            onClick={onTopicsToggle}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all duration-200"
          >
            <Filter size={18} />
            Temas
            <ChevronDown size={16} className={topicsOpen ? 'rotate-180' : ''} />
          </button>
          <button
            type="button"
            onClick={onToggleAudio}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all duration-200"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            Sonido
          </button>
        </div>
      </div>

      {/* Selector único: tres pestañas excluyentes */}
      <div className={`shrink-0 p-3 ${glassCardClass}`}>
        <div className="flex gap-2">
          {views.map((v, viewIdx) => (
            <button
              key={`view-${viewIdx}-${v.id}`}
              type="button"
              onClick={() => onActiveViewChange(v.id)}
              className={`flex-1 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                activeView === v.id
                  ? 'bg-white/15 text-white border border-white/20 shadow-[0_2px_8px_rgba(255,255,255,0.1)]'
                  : 'bg-white/5 text-white/70 border border-transparent hover:bg-white/8 hover:text-white/90'
              }`}
            >
              {v.title}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjeta de contenido principal (única, dinámica por pestaña) */}
      <div className={`flex-1 min-h-[200px] flex flex-col ${glassCardClass} overflow-hidden`}>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden hide-scrollbar p-4 flex flex-col">
          {/* — Historias: autor + inicio del relato */}
          {activeView === 'historias' && (
            <>
              {(selectedTopic || selectedStory) && (
                <div className="space-y-2 mb-4">
                  {selectedTopic && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/45">Tema</span>
                      <span className="text-sm text-white/80 truncate flex-1 mx-2">{selectedTopic}</span>
                      <button type="button" onClick={onClearTopic} className="text-xs font-semibold text-orange-300/90 hover:text-orange-200 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">Limpiar</button>
                    </div>
                  )}
                  {selectedStory && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white/90 truncate min-w-0">{selectedStory.label}</span>
                      <button type="button" onClick={onClearStory} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0" aria-label="Cerrar historia"><X size={16} /></button>
                    </div>
                  )}
                </div>
              )}
              {selectedStory ? (
                <>
                  <div className="text-[10px] font-black tracking-widest uppercase text-white/50 mb-1">Autor / Lugar</div>
                  <p className="text-sm font-semibold text-white/95 mb-3">{selectedStory.label}</p>
                  <div className="text-[10px] font-black tracking-widest uppercase text-white/50 mb-1">Inicio del relato</div>
                  <p className="text-sm text-white/80 leading-relaxed">{selectedStory.description || 'Sin descripción.'}</p>
                </>
              ) : (
                <p className="text-white/50 text-sm py-8 text-center">Haz clic en un punto del mapa para leer su historia.</p>
              )}
            </>
          )}

          {/* — Pulso Global: formato obligatorio por tarjeta + ONLINE solo si API respondió bien */}
          {activeView === 'actualidad' && (
            <>
              <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                <p className="font-mono uppercase tracking-[0.15em] text-white/70 text-xs">Ahora por el mundo</p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>
                  <span className="text-[11px] text-white/50">hace {secondsAgo}s</span>
                  {!newsLoading && !newsError && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">ONLINE</span>
                  )}
                </div>
              </div>
              {selectedNews ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white/95 leading-snug line-clamp-3 flex-1">
                      {selectedNews.title.trim() ? selectedNews.title : '—'}
                    </h4>
                    <button type="button" onClick={onClearSelection} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0" aria-label="Cerrar"><X size={16} /></button>
                  </div>
                  <p className="text-xs text-white/55">
                    {selectedNews.source || '—'} · {selectedNews.publishedAt ? formatTimeAgoFromNow(selectedNews.publishedAt, now) : '—'}
                    {selectedNews.url && (
                      <> · <a href={selectedNews.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline">Abrir medio</a></>
                    )}
                  </p>
                </div>
              ) : (
                <>
                  {newsItems.length === 0 && (newsLoading ?? false) && (
                    <p className="text-white/50 text-sm py-6 text-center">Cargando noticias…</p>
                  )}
                  {newsItems.length === 0 && !(newsLoading ?? false) && !(newsError ?? null) && (
                    <p className="text-white/40 text-sm py-6 text-center">No hay noticias recientes de los medios autorizados.</p>
                  )}
                  {(newsError ?? null) && <p className="text-red-400/80 text-sm py-4 text-center">{newsError}</p>}
                  <div className="space-y-2">
                    {(newsItems as NewsItem[]).map((_item, idx) => {
                      const it = _item as NewsItem;
                      const isSelected = false;
                      return (
                        <button
                          key={`news-${idx}-${it.id ?? 'n'}-${it.publishedAt ?? ''}-${it.title?.slice(0, 20) ?? ''}`}
                          type="button"
                          onClick={() => onSelectNews(it)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                            isSelected ? 'bg-white/10 border-orange-500/40 shadow-md shadow-orange-500/10' : 'bg-white/4 border-white/10 hover:bg-white/8 hover:border-white/20 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex gap-3">
                            <span className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${isSelected ? 'bg-orange-400' : 'bg-white/40'}`} aria-hidden />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-white/95 line-clamp-2 mb-2">
                                {it.title.trim() ? it.title : '—'}
                              </div>
                              <p className="text-xs text-white/55">
                                {it.source || '—'} · {formatTimeAgoFromNow(it.publishedAt, now)}
                                {it.url && (
                                  <> · <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline" onClick={(e) => e.stopPropagation()}>Abrir medio</a></>
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* — Visión Directa: ventana de video a pantalla completa en el contenedor + indicador de estado */}
          {activeView === 'envivo' && (
            <>
              {liveOverlay ? (
                <div className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between gap-2 p-2 shrink-0 border-b border-white/10">
                    <span className="text-xs font-medium text-white/90 truncate">{liveOverlay.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        EN VIVO
                      </span>
                      {onCloseLive && (
                        <button type="button" onClick={onCloseLive} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white" aria-label="Cerrar"><X size={16} /></button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 relative aspect-video w-full">
                    <iframe
                      src={liveOverlay.embedUrl}
                      title={liveOverlay.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <p className="text-white/50 text-sm py-8 text-center">Selecciona una cámara en directo en el mapa para ver la transmisión aquí.</p>
              )}
            </>
          )}

          {/* — Cámaras: lista tipo centro de control */}
          {activeView === 'camaras' && (
            <>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/45">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={cameraSearchQuery}
                  onChange={(e) => onCameraSearchQueryChange?.(e.target.value)}
                  placeholder="Buscar cámara…"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/35 outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:border-orange-500/40 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto hide-scrollbar">
                {filteredCameras.map((cam: LiveCam) => (
                  <div
                    key={cam.id}
                    className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-white/95 leading-snug mb-1">{cam.title}</h4>
                        <p className="text-xs text-white/60">{cam.place}</p>
                        <p className="text-xs text-white/50 mt-0.5">{cam.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => onOpenLive?.({ embedUrl: cam.embedUrl, title: cam.title })}
                        disabled={!cam.embedUrl || cam.embedUrl.trim() === ''}
                        className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500/20"
                      >
                        {cam.embedUrl && cam.embedUrl.trim() !== '' ? 'Ver' : 'No embebible'}
                      </button>
                      <a
                        href={cam.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-colors text-xs font-semibold"
                      >
                        Abrir fuente
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MapaPageContent() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const globeEl = useRef<any>(null);
  const { ref: globeWrapRef, width: globeWrapWidth, height: globeWrapHeight } = useElementSize<HTMLDivElement>();
  const globeSize = Math.max(520, Math.min(globeWrapWidth, globeWrapHeight) - 24);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const topicsButtonRef = useRef<HTMLButtonElement | null>(null);
  const [globeMaterial, setGlobeMaterial] = useState<Material | null>(null);
  const [activeView, setActiveView] = useState<'historias' | 'actualidad' | 'envivo' | 'camaras'>('historias');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<StoryPoint | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [lastNewsUpdate, setLastNewsUpdate] = useState<number>(() => Date.now());
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsIsFallback, setNewsIsFallback] = useState(false);
  const newsTopic = DEFAULT_NEWS_TOPIC_QUERY;
  const [liveOverlay, setLiveOverlay] = useState<{ embedUrl: string; title: string } | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [exploreQuery, setExploreQuery] = useState('');
  const [cameraSearchQuery, setCameraSearchQuery] = useState('');

  useEffect(() => {
    import('three').then((THREE) => {
      const loader = new THREE.TextureLoader();
      const loadTex = (url: string) =>
        new Promise<import('three').Texture | null>((resolve) => {
          loader.load(
            url,
            (t) => resolve(t),
            undefined,
            () => resolve(null)
          );
        });

      Promise.all([loadTex(GLOBE_IMAGE_DAY_LOCAL), loadTex(GLOBE_IMAGE_LOCAL)]).then(([day, night]) => {
        const dayTex = day ?? null;
        const nightTex = night ?? null;
        const mapTex = dayTex ?? nightTex ?? null;

        // No recargar texturas dinámicamente: se cargan una vez y se reusan en el material.
        if (mapTex) {
          (mapTex as any).colorSpace = (THREE as any).SRGBColorSpace ?? (mapTex as any).colorSpace;
          mapTex.needsUpdate = true;
        }
        if (nightTex) {
          (nightTex as any).colorSpace = (THREE as any).SRGBColorSpace ?? (nightTex as any).colorSpace;
          nightTex.needsUpdate = true;
        }

        const mat = new THREE.MeshPhongMaterial({
          map: mapTex ?? undefined,
          emissive: new THREE.Color(0x000000),
          emissiveIntensity: 0,
          shininess: GLOBE_SHININESS,
          specular: new THREE.Color(GLOBE_SPECULAR)
        });

        // Día/Noche continuo: la rotación del globo mueve el terminador.
        // Mantiene el "sol" fijo (directional light KEY) y mezcla nightmap solo en el lado oscuro.
        if (dayTex && nightTex) {
          (mat as any).onBeforeCompile = (shader: any) => {
            shader.uniforms.nightMap = { value: nightTex };
            shader.uniforms.nightIntensity = { value: 1.15 };

            shader.fragmentShader = shader.fragmentShader
              .replace(
                '#include <common>',
                `#include <common>
uniform sampler2D nightMap;
uniform float nightIntensity;`
              )
              .replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>

// Noche: se ve cuando el normal apunta lejos del sol (KEY light).
// directionalLights[0] corresponde al primer DirectionalLight agregado (KEY_LIGHT).
#if NUM_DIR_LIGHTS > 0
  float ndl = dot( normal, directionalLights[0].direction );
  float nightMix = smoothstep(0.18, -0.28, ndl);
  vec3 nightCol = texture2D(nightMap, vUv).rgb;
  gl_FragColor.rgb += nightCol * nightMix * nightIntensity;
#endif`
              );
          };
          (mat as any).customProgramCacheKey = () => 'almamundi-daynight-v1';
        }

        if (mat && "opacity" in mat) {
          (mat as any).transparent = true;
          (mat as any).opacity = 0.92;
        }
        setGlobeMaterial(mat);
      });
    });
  }, []);

  const stories: StoryPoint[] = useMemo(
    () => [
      { id: 'story-scl', lat: -33.4489, lng: -70.6693, label: 'Santiago', city: 'Santiago', country: 'Chile', timezone: 'America/Santiago' },
      { id: 'story-nyc', lat: 40.7128, lng: -74.006, label: 'New York', city: 'New York', country: 'Estados Unidos', timezone: 'America/New_York' },
      { id: 'story-par', lat: 48.8566, lng: 2.3522, label: 'Paris', city: 'Paris', country: 'Francia', timezone: 'Europe/Paris' },
      { id: 'story-tyo', lat: 35.6762, lng: 139.6503, label: 'Tokyo', city: 'Tokyo', country: 'Japón', timezone: 'Asia/Tokyo' }
    ],
    []
  );

  const selectedLocation = useMemo(() => {
    if (selectedStory) {
      return {
        city: selectedStory.city ?? selectedStory.label,
        country: selectedStory.country,
        timezone: selectedStory.timezone
      };
    }
    if (selectedNews?.sourceCountry) {
      const tzMap: Record<string, string> = {
        CL: 'America/Santiago', AR: 'America/Argentina/Buenos_Aires', BR: 'America/Sao_Paulo',
        MX: 'America/Mexico_City', ES: 'Europe/Madrid', US: 'America/New_York', GB: 'Europe/London',
        FR: 'Europe/Paris', DE: 'Europe/Berlin', JP: 'Asia/Tokyo', CN: 'Asia/Shanghai', IN: 'Asia/Kolkata'
      };
      const code = selectedNews.sourceCountry.trim().toUpperCase().slice(0, 2);
      return {
        city: selectedNews.source ?? undefined,
        country: selectedNews.sourceCountry,
        timezone: tzMap[code]
      };
    }
    return null;
  }, [selectedStory, selectedNews]);

  const storiesForView: StoryPoint[] = useMemo(() => {
    let list = stories;
    if (selectedTopic) {
      const t = normalizeQuery(selectedTopic);
      list = list.filter((s) => storySearchHaystack(s).includes(t));
    }
    if (exploreQuery.trim()) {
      const q = normalizeQuery(exploreQuery);
      list = list.filter((s) => storySearchHaystack(s).includes(q));
    }
    return list;
  }, [stories, selectedTopic, exploreQuery]);

  const filteredNewsItems: NewsItem[] = useMemo(() => {
    if (!exploreQuery.trim()) return newsItems;
    const q = normalizeQuery(exploreQuery);
    return newsItems.filter((item) => normalizeQuery(item.title ?? '').includes(q));
  }, [newsItems, exploreQuery]);

  const fetchNews = useCallback(async (topic: string, signal: AbortSignal): Promise<{ items: NewsItem[]; isFallback?: boolean }> => {
    const url = `/api/world?kind=news&topic=${encodeURIComponent(topic)}&limit=20&lang=es`;
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = (await res.json()) as { items?: unknown[]; isFallback?: boolean; generatedAt?: string };
      const rawItems = Array.isArray(data.items) ? data.items : [];
      // Estructura que devuelve el backend: { generatedAt, items: [{ id, title, url, source, publishedAt, sourceCountry, lat, lng }], isFallback? }
      console.log('[Pulso Global] Respuesta API:', { itemCount: rawItems.length, isFallback: data.isFallback, sample: rawItems[0] });
      const items = rawItems.map((it: unknown) => {
        const i = it as Record<string, unknown>;
        const rawTitle = typeof i.title === 'string' ? i.title : '';
        const rawUrl = typeof i.url === 'string' ? i.url : '';
        const rawSource = i.source != null ? String(i.source) : null;
        const rawPublishedAt = i.publishedAt != null ? String(i.publishedAt) : null;
        const source = getCuratedSourceName(rawUrl || null, rawSource);
        const hasTitle = rawTitle.trim().length > 0;
        const hasSource = source != null && source.trim().length > 0;
        const hasPublishedAt = rawPublishedAt != null && rawPublishedAt.trim().length > 0;
        const hasUrl = rawUrl.trim().length > 0;
        const isPartial = !hasTitle || !hasSource || !hasPublishedAt || !hasUrl;
        return {
          id: typeof i.id === 'string' ? i.id : '',
          title: rawTitle,
          url: rawUrl,
          source,
          publishedAt: rawPublishedAt,
          sourceCountry: i.sourceCountry != null ? String(i.sourceCountry) : null,
          lat: typeof i.lat === 'number' ? i.lat : null,
          lng: typeof i.lng === 'number' ? i.lng : null,
          isPartial,
        } as NewsItem;
      });
      const withCoords = items.map((item) => withFallbackLatLng(item));
      const normalized = withCoords.map(normalizeColorsSafe);
      return { items: normalized, isFallback: Boolean(data.isFallback) };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { items: [] };
      }
      console.error('[Mapa] fetchNews error:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (activeView !== 'actualidad') {
      setNewsLoading(false);
      setNewsError(null);
      setNewsIsFallback(false);
      return;
    }
    setNewsLoading(true);
    setNewsError(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS);
    let cancelled = false;
    fetchNews(newsTopic, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setNewsIsFallback(!!result.isFallback);
        if (result.items.length > 0) {
          setNewsItems(result.items);
          setLastNewsUpdate(Date.now());
          console.log('[Pulso Global] Estado actualizado, items:', result.items.length);
        }
        setNewsLoading(false);
        setNewsError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setNewsLoading(false);
        if (err?.name === 'AbortError') {
          setNewsError(null);
        } else {
          setNewsError(err instanceof Error ? err.message : 'Error al cargar noticias');
        }
      })
      .finally(() => window.clearTimeout(timeoutId));
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeView, newsTopic, fetchNews]);

  const [newsRings, setNewsRings] = useState<NewsRing[]>([]);
  useEffect(() => {
    if (activeView === 'actualidad') return;
    const id = window.setInterval(() => {
      setNewsRings((prev) => {
        const r: NewsRing = {
          lat: (Math.random() - 0.5) * 160,
          lng: (Math.random() - 0.5) * 360,
          maxR: Math.random() * 20 + 3,
          propagationSpeed: (Math.random() - 0.5) * 20 + 1,
          repeatPeriod: Math.random() * 2000 + 200
        };
        const next = [...prev, r];
        if (next.length > 15) next.shift();
        return next;
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, [activeView]);

  const newsPoints: RegionPoint[] = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    return groupNewsByRegion(newsItems, PULSO_WINDOW_MS, PULSO_MAX_REGIONS);
  }, [activeView, newsItems]);

  const pointsData: Array<StoryPoint & { newsId?: string; newsIds?: string[] }> = activeView === 'actualidad' ? newsPoints : storiesForView;
  const ringsData = activeView === 'actualidad' ? [] : newsRings;

  const focusNews = useCallback((item: NewsItem) => {
    setSelectedNews(item);
    if (!globeEl.current || item.lat == null || item.lng == null) return;
    try {
      globeEl.current.pointOfView({ lat: item.lat, lng: item.lng, altitude: 1.8 }, 1200);
    } catch {}
  }, []);

  const focusStory = useCallback((story: StoryPoint) => {
    setSelectedStory(story);
    if (!globeEl.current) return;
    try {
      globeEl.current.pointOfView({ lat: story.lat, lng: story.lng, altitude: 2.0 }, 900);
    } catch {}
  }, []);

  const handlePointClick = useCallback((point: object) => {
    const p = point as StoryPoint & { newsId?: string; newsIds?: string[] };
    if (activeView === 'actualidad') {
      const ids = p.newsIds ?? (p.newsId ? [p.newsId] : []);
      const newsItem = ids.length > 0 ? newsItems.find((i) => i.id === ids[0]) : null;
      if (newsItem) focusNews(newsItem);
      if (ids.length > 0 && !newsItem && globeEl.current) {
        const r = p as RegionPoint;
        try { globeEl.current.pointOfView({ lat: r.lat, lng: r.lng, altitude: 1.8 }, 1200); } catch {}
      }
      return;
    }
    if (activeView === 'historias') {
      focusStory(p);
    }
  }, [activeView, newsItems, focusNews, focusStory]);

  const ringColorFn = useCallback((d: { newsId?: string }) => {
    const baseAlpha = selectedNews?.id === d?.newsId ? 0.8 : 0.25;
    return (t: number) => {
      const u = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
      const alpha = Math.max(0, Math.min(1, baseAlpha * (1 - u)));
      return activeView === 'actualidad' ? `rgba(255,140,0,${alpha})` : `rgba(255,255,255,${alpha})`;
    };
  }, [activeView, selectedNews?.id]);

  const pointColorFn = useCallback((point: object) => {
    const p = point as { newsIds?: string[]; newsId?: string; intensity?: number };
    const ids = p?.newsIds ?? (p?.newsId ? [p.newsId] : []);
    const isSelected = selectedNews && ids.includes(selectedNews.id);
    const intensity = Number.isFinite(p?.intensity) ? Math.min(1, Math.max(0, p.intensity!)) : 1;
    const glowAlpha = 0.5 + 0.5 * intensity;
    const color = isSelected ? `rgba(255,180,80,${glowAlpha})` : `rgba(249,115,22,${glowAlpha})`;
    return safeColor(color, 'rgba(180,220,255,0.85)');
  }, [selectedNews?.id]);

  const toggleAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (isMuted) {
      a.volume = 0.6;
      a.play().catch(() => {});
      setIsMuted(false);
    } else {
      a.pause();
      setIsMuted(true);
    }
  }, [isMuted]);

  const handleGlobeReady = useCallback(() => {
    if (!globeEl.current) return;
    const renderer = globeEl.current.renderer?.();
    if (!renderer) return;

    try {
      const controls = globeEl.current.controls();
      controls.enableZoom = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.12;
      globeEl.current.pointOfView({ lat: -10, lng: -60, altitude: 2.2 }, 0);

      const r = renderer as any;
      if (typeof r.alpha !== 'undefined') r.alpha = true;
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      if (typeof r.toneMapping !== 'undefined') {
        r.toneMapping = 4;
        r.toneMappingExposure = GLOBE_EXPOSURE;
      }
      try {
        const rAny = renderer as any;
        if (typeof rAny.setClearColor === 'function') rAny.setClearColor(0x000000, 0);
        if (typeof rAny.setClearAlpha === 'function') rAny.setClearAlpha(0);
        const canvas = rAny?.domElement as HTMLCanvasElement | undefined;
        if (canvas) {
          canvas.style.background = 'transparent';
        }
      } catch {}

      const scene = globeEl.current.scene?.();
      if (scene) {
        import('three').then((THREE) => {
          try {
            if (r && typeof r.toneMappingExposure !== 'undefined') r.toneMappingExposure = GLOBE_EXPOSURE;
            if (!scene.getObjectByName('AM_LIGHT')) {
              const ambient = new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY);
              ambient.name = 'AM_LIGHT';
              scene.add(ambient);
            }
            if (!scene.getObjectByName('KEY_LIGHT')) {
              const key = new THREE.DirectionalLight(0xffffff, KEY_INTENSITY);
              key.name = 'KEY_LIGHT';
              key.position.set(2.2, 1.2, 2.4);
              scene.add(key);
            }
            if (!scene.getObjectByName('FILL_LIGHT')) {
              const fill = new THREE.DirectionalLight(0x9bdcff, FILL_INTENSITY);
              fill.name = 'FILL_LIGHT';
              fill.position.set(-2.0, 0.5, -1.6);
              scene.add(fill);
            }
            if (!scene.getObjectByName('RIM_LIGHT')) {
              const rim = new THREE.DirectionalLight(0xffffff, RIM_INTENSITY);
              rim.name = 'RIM_LIGHT';
              rim.position.set(0.0, 2.4, -3.2);
              scene.add(rim);
            }
            const maxAnisotropy = (renderer as any)?.capabilities?.maxAnisotropy ?? 1;
            scene.traverse((mesh: import('three').Object3D) => {
              if (mesh instanceof THREE.Mesh) {
                const mat = (mesh as any)?.material;
                if (mat && "opacity" in mat) {
                  const phongMat = mat as import('three').MeshPhongMaterial;
                  if (phongMat?.map) {
                    const tex = phongMat.map;
                    tex.anisotropy = maxAnisotropy;
                    tex.minFilter = THREE.LinearMipmapLinearFilter;
                    tex.magFilter = THREE.LinearFilter;
                    tex.generateMipmaps = true;
                    tex.needsUpdate = true;
                  }
                }
              }
            });
          } catch (err) {
            console.error('handleGlobeReady scene/three failed', err);
          }
        });
      }
    } catch (e) {
      console.error('handleGlobeReady failed', e);
    }
  }, [globeEl]);

  useEffect(() => {
    if (activeView !== 'actualidad') {
      setSelectedNews(null);
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView !== 'historias') {
      setSelectedStory(null);
      setSelectedTopic(null);
    }
  }, [activeView]);

  return (
    <main
      data-build="mapa-v1"
      className="h-screen min-h-0 overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: '420px minmax(0, 1fr)',
        background: GLOBE_PAGE_BG,
        fontFamily: APP_FONT
      }}
    >
      <style jsx global>{globalStyles}</style>
      <audio ref={audioRef} loop src="/universo.mp3" />

      {topicsOpen && (
        <TopicsModal
          open={topicsOpen}
          onClose={() => setTopicsOpen(false)}
          topics={INSPIRATION_TOPICS as Array<{ title: string }>}
          stories={stories as TopicsModalStory[]}
          selectedTopic={selectedTopic}
          onSelectTopic={(topicTitle) => {
            setSelectedTopic(topicTitle);
            setActiveView('historias');
          }}
          onSelectStory={(story) => {
            setSelectedStory(story);
            setSelectedTopic(null);
            setActiveView('historias');
            focusStory(story);
          }}
          onClearTopic={() => setSelectedTopic(null)}
          exploreQuery={exploreQuery}
          onExploreQueryChange={setExploreQuery}
        />
      )}

      {/* Columna 1: franja/sidebar — a la izquierda */}
      <div style={{ gridColumn: 1 }} className="min-w-0 min-h-0 flex flex-col">
        <RightPanel
          topicsOpen={topicsOpen}
          onTopicsToggle={() => setTopicsOpen((v) => !v)}
          topicsButtonRef={topicsButtonRef}
          isMuted={isMuted}
          onToggleAudio={toggleAudio}
          activeView={activeView}
          onActiveViewChange={setActiveView}
          selectedTopic={selectedTopic}
          onClearTopic={() => setSelectedTopic(null)}
          selectedStory={selectedStory}
          onClearStory={() => setSelectedStory(null)}
          newsItems={filteredNewsItems}
          lastNewsUpdate={lastNewsUpdate}
          newsLoading={newsLoading}
          newsError={newsError}
          newsIsFallback={newsIsFallback}
          selectedNews={selectedNews}
          onSelectNews={focusNews}
          onClearSelection={() => setSelectedNews(null)}
          liveOverlay={liveOverlay}
          onCloseLive={() => setLiveOverlay(null)}
          cameraSearchQuery={cameraSearchQuery}
          onCameraSearchQueryChange={setCameraSearchQuery}
          onOpenLive={setLiveOverlay}
        />
      </div>

      {/* Columna 2: globo — a la derecha */}
      <div
        ref={globeWrapRef}
        className="mapLeftStage w-full h-full min-w-0 min-h-0 isolate z-10 cursor-move pointer-events-auto"
        style={{ position: 'relative', overflow: 'hidden', isolation: 'isolate', touchAction: 'none', gridColumn: 2 }}
      >
        <StarfieldCanvas width={globeWrapWidth} height={globeWrapHeight} enabled={true} />
        {activeView === 'actualidad' && <div aria-hidden className="hudOverlayBg" />}
        <div className="relative z-[2] w-full h-full flex items-center justify-center min-w-0 min-h-0 pointer-events-none">
          <div style={{ width: globeSize, height: globeSize }} className="pointer-events-auto">
            <GlobeComp
              ref={globeEl}
              onGlobeReady={handleGlobeReady}
              globeImageUrl={GLOBE_IMAGE_LOCAL}
              {...(globeMaterial != null ? { globeMaterial } : {})}
              showAtmosphere={true}
              atmosphereColor="#3fa9ff"
              atmosphereAltitude={0.18}
              backgroundColor={GLOBE_CANVAS_BG}
              pointsData={pointsData}
              pointLat="lat"
              pointLng="lng"
              pointColor={pointColorFn}
              pointAltitude={(p: object) => (p as { altitude?: number }).altitude ?? 0}
              pointRadius={(p: object) => (p as { radius?: number }).radius ?? 0.06}
              onPointClick={handlePointClick}
              ringsData={ringsData}
              ringColor={ringColorFn}
              ringMaxRadius="maxR"
              ringPropagationSpeed="propagationSpeed"
              ringRepeatPeriod="repeatPeriod"
              height={globeSize}
              width={globeSize}
            />
          </div>
        </div>
        {activeView === 'actualidad' && <div aria-hidden className="hudOverlay" />}
        <div aria-hidden className="vignette" />
        <WorldClock selectedLocation={selectedLocation} />

        {liveOverlay && (
          <div className="liveOverlay" role="dialog" aria-modal aria-label="Reproductor en vivo">
            <div className="liveFrameWrap">
              <button
                type="button"
                className="liveCloseBtn"
                onClick={() => setLiveOverlay(null)}
                aria-label="Cerrar"
              >
                <X size={20} strokeWidth={2} />
              </button>
              <iframe
                src={liveOverlay.embedUrl}
                title={liveOverlay.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

/** Solo renderiza el mapa en el cliente para evitar 500 por SSR (Three/Globe/APIs). */
export default function MapaPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0F172A] text-white">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/90">Cargando mapa…</p>
      </div>
    );
  }
  return <MapaPageContent />;
}
