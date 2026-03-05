'use client';

import '@/app/mapa/mapa-ui.css';
import '@/app/mapa/liquid-metal.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Search,
  Filter,
  ChevronDown,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { TopicsModal, type TopicsModalStory } from '@/components/mapa/TopicsModal';
import { StoryViewer } from '@/components/mapa/StoryViewer';
import { TimeBar } from '@/components/map/TimeBar';
import { UniverseBackground } from '@/components/UniverseBackground';
import { AtmosphereOverlay } from '@/components/AtmosphereOverlay';
import { useAtmosphere } from '@/hooks/useAtmosphere';
import { getPulseConfig, getNewsPulseConfig, type PulseConfig } from '@/lib/storyPulse';
import { usePulseAnimation, calcPulseFactor } from '@/hooks/usePulseAnimation';
import { MapCanvas } from '@/components/map/MapCanvas';
import { MapDock, type MapDockMode } from '@/components/map/MapDock';
import { MapDrawer } from '@/components/map/MapDrawer';
import { MapTopControls } from '@/components/map/MapTopControls';
import { StoriesPanel } from '@/components/map/panels/StoriesPanel';
import { NewsPanel } from '@/components/map/panels/NewsPanel';
import { SoundsPanel } from '@/components/map/panels/SoundsPanel';
import { useNewsLayer, type NewsItem } from '@/components/NewsLayer';
import { useAmbientEngine } from '@/components/music/useAmbientEngine';
import { INSPIRATION_TOPICS } from '@/lib/topics';
import { DEFAULT_NEWS_TOPIC_QUERY, NEWS_TOPIC_GROUPS } from '@/lib/news-topics';
import { getMediaByDomain, normalizeDomain } from '@/lib/media-sources';
import type { MapView } from '@/lib/map-data/types';
import { getStoriesReadIds, startSessionTimer } from '@/lib/sessionTracker';
import { getApproxLocation } from '@/lib/userLocation';
import { isNightAtLocation } from '@/lib/sunPosition';
import { useStories } from '@/hooks/useStories';
import { usePulses } from '@/hooks/usePulses';
import type { StoryPoint } from '@/lib/map-data/stories';
import { STORIES_MOCK, SOUND_MOODS, type SoundMood, type StoryMeta } from '@/lib/map-data/story-meta';
import { buildJourney } from '@/lib/music/journey';
import {
  playAmbient as webPlayAmbient,
  stopAmbient as webStopAmbient,
  setAmbientEnabled as webSetAmbientEnabled,
  unlockAmbientAudio,
  duckAmbient,
  getAmbientUnlocked,
  startGenerativeLayer,
  stopGenerativeLayer,
  type AmbientKey,
} from '@/lib/sound/ambient';
import type { Material } from 'three';
import * as THREE from 'three';


/** Error boundary dentro de la página para no depender del error.tsx de Next en dev. */
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.error('[mapa]', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0F172A] text-white p-6">
          <h1 className="text-xl font-semibold text-white/95">Algo salió mal en el mapa</h1>
          <p className="text-white/60 text-sm text-center max-w-md">
            No se pudo cargar esta vista. Recarga la página o vuelve al inicio.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
            >
              Intentar de nuevo
            </button>
            <a
              href="/"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Señal limpia en el globo: núcleo pequeño + dos rings (sin sprites ni texturas) ---
function makeLiveSignalObject(
  point: { lat?: number; lng?: number; id?: string; label?: string }
): THREE.Object3D {
  const group = new THREE.Group();
  group.renderOrder = 999;
  group.userData.pointId = point.id;

  // Núcleo pequeño
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xff6a00,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(nucleus);

  const ringMat = (opacity: number) =>
    new THREE.MeshBasicMaterial({
      color: 0x2a7bff,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

  const ring1 = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.45, 32), ringMat(0.5));
  ring1.rotation.x = Math.PI / 2;
  ring1.userData.phaseOffset = 0;
  ring1.userData.speed = 1.0;
  group.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.6, 32), ringMat(0.4));
  ring2.rotation.x = Math.PI / 2;
  ring2.userData.phaseOffset = 0.5;
  ring2.userData.speed = 1.2;
  group.add(ring2);

  group.userData.rings = [ring1, ring2];

  return group;
}

// ==== NEWS SIGNALS (3D objects layer) ======================================
const NEWS_VIEW_KEY = "actualidad";

function safeStr(s: unknown) {
  return typeof s === "string" ? s : "";
}

/** Retorna el style object del liquid glass naranja de alta calidad */
function glassOrange(active = true, size: 'sm' | 'md' | 'lg' = 'md') {
  if (!active) return {
    background:     'rgba(255,255,255,0.04)',
    border:         '1px solid rgba(255,255,255,0.08)',
    boxShadow:      'none',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  const blur   = size === 'sm' ? '16px' : size === 'lg' ? '40px' : '24px';
  const radius = size === 'sm' ? 999    : size === 'lg' ? 24      : 999;

  return {
    background:     'rgba(249, 115, 22, 0.15)',
    border:         '1px solid rgba(249, 115, 22, 0.40)',
    backdropFilter: `blur(${blur}) saturate(200%)`,
    WebkitBackdropFilter: `blur(${blur}) saturate(200%)`,
    boxShadow: `
      inset 0 1.5px 0 rgba(255, 180, 80, 0.45),
      inset 0 -1px 0 rgba(180, 60, 0, 0.30),
      inset 1px 0 0 rgba(255, 160, 60, 0.15),
      0 0 20px rgba(249, 115, 22, 0.20),
      0 8px 32px rgba(0, 0, 0, 0.40)
    `,
    borderRadius: radius,
  };
}

/** Liquid glass neutro para el panel */
function glassPanel() {
  return {
    background:     'rgba(255, 255, 255, 0.055)',
    border:         '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    boxShadow: `
      inset 0 1.5px 0 rgba(255, 255, 255, 0.18),
      inset 0 -1px 0 rgba(255, 255, 255, 0.04),
      0 24px 48px rgba(0, 0, 0, 0.50),
      0 4px 16px rgba(0, 0, 0, 0.30)
    `,
    borderRadius: 24,
  };
}

/** Estilo liquid glass para chips de temas (activo = naranja con volumen real) */
function chipStyle(active: boolean) {
  if (active) return {
    padding:        '7px 14px',
    borderRadius:    999,
    cursor:         'pointer',
    fontSize:        13,
    whiteSpace:     'nowrap' as const,
    fontFamily:     "'Avenir Light', Avenir, sans-serif",
    outline:        'none',
    WebkitTapHighlightColor: 'transparent',
    transition:     'all 180ms ease',
    color:          '#fff',
    background:     'linear-gradient(180deg, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.16) 100%)',
    border:         '1px solid rgba(255,155,60,0.45)',
    boxShadow: `
      inset 0 1.5px 0 rgba(255,185,70,0.45),
      inset 0 -1px 0 rgba(180,55,0,0.20),
      0 0 12px rgba(249,115,22,0.15),
      0 4px 8px rgba(0,0,0,0.25)
    `,
  };
  return {
    padding:        '7px 14px',
    borderRadius:    999,
    cursor:         'pointer',
    fontSize:        13,
    whiteSpace:     'nowrap' as const,
    fontFamily:     "'Avenir Light', Avenir, sans-serif",
    outline:        'none',
    WebkitTapHighlightColor: 'transparent',
    transition:     'all 180ms ease',
    color:          'rgba(255,255,255,0.45)',
    background:     'rgba(255,255,255,0.06)',
    border:         '1px solid rgba(255,255,255,0.09)',
    boxShadow:      'none',
  };
}

/** Textura canvas de glow suave (reemplaza sprite PNG; funciona sin archivos extra). */
function makeSoftGlowTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.15, "rgba(255,255,255,0.8)");
  grd.addColorStop(0.4, "rgba(255,255,255,0.2)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/** Crea el objeto 3D de una señal de noticia: esfera core + sprite glow + 3 rings animados. */
function makeNewsSignalObject(glowTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xff6a00,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  group.add(core);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffb100,
      transparent: true,
      opacity: 0.35,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  sprite.scale.set(0.8, 0.8, 1);
  group.add(sprite);

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.35, 32),
      new THREE.MeshBasicMaterial({
        color: 0x2a7bff,
        transparent: true,
        opacity: 0.45,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    ring.userData.phaseOffset = i * 0.33;
    ring.userData.speed = 1 + i * 0.2;
    group.add(ring);
  }

  group.renderOrder = 9999;
  return group;
}

const APP_FONT = 'Avenir, sans-serif';
const GLOBE_PAGE_BG = 'linear-gradient(135deg, #0F172A 0%, #1A202C 50%, #0F172A 100%)';

// === GLOBE LIGHTING (liquid glass: más claro, sin quemar) ===
const GLOBE_EXPOSURE = 2.65;
const GLOBE_EMISSIVE_INTENSITY = 0.30;
const GLOBE_SHININESS = 36;
const GLOBE_SPECULAR = 0x4a6a8a;
const GLOBE_BUMP_SCALE = 0.26;
const AMBIENT_INTENSITY = 1.35;
const KEY_INTENSITY = 3.2;
const FILL_INTENSITY = 1.15;
const RIM_INTENSITY = 1.9;

const GLOBE_CANVAS_BG = 'rgba(0,0,0,0)';

/** Textura del globo: local para que cargue siempre (unpkg daba CORS/círculo). */
const GLOBE_IMAGE_LOCAL = '/textures/earth-night.jpg';
const GLOBE_IMAGE_DAY_LOCAL = '/textures/earth-day.png';
/** Fallback día: .png (8k mapa mundi) o .jpg si se sustituye. */
const GLOBE_IMAGE_DAY_OR_FALLBACK = '/textures/earth-day.png';
/** Bump map para relieve del terreno (topología). */
const GLOBE_BUMP_IMAGE = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png';

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
  color: #ff4500;
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

  .globeStage {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .globeStage canvas {
    border: none !important;
    outline: none !important;
    border-radius: 50%;
  }
  .cinemaOverlay {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 5;
    background:
      radial-gradient(80% 70% at 50% 45%,
        rgba(0,0,0,0) 0%,
        rgba(0,0,0,0.08) 55%,
        rgba(0,0,0,0.22) 80%,
        rgba(0,0,0,0.35) 100%);
  }
  .grainOverlay {
    pointer-events: none;
    position: absolute;
    inset: -20%;
    z-index: 6;
    opacity: 0.05;
    mix-blend-mode: overlay;
    background-image:
      repeating-radial-gradient(circle at 20% 30%,
        rgba(255,255,255,0.06) 0 1px,
        rgba(0,0,0,0.06) 1px 2px);
    animation: grainMove 7s ease-in-out infinite;
  }
  @keyframes grainMove {
    0%   { transform: translate3d(-1%, -1%, 0) rotate(7deg); }
    50%  { transform: translate3d(1%, 0.5%, 0) rotate(7deg); }
    100% { transform: translate3d(-0.5%, 1%, 0) rotate(7deg); }
  }
`;

type NewsRing = { lat: number; lng: number; maxR: number; propagationSpeed: number; repeatPeriod: number; newsId?: string; isHover?: boolean; isSelectedNews?: boolean };

type NewsGeo = { lat: number; lng: number; precision?: string; label?: string };

/** Distancia en km entre dos puntos (Haversine). */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Elige hasta max noticias recientes con geo, sin repetir mismo país/medio. */
function buildNowRoute(items: NewsItem[], max = 8): NewsItem[] {
  const withGeo = items.filter((x) => x.geo?.lat != null && x.geo?.lng != null);
  const sorted = [...withGeo].sort(
    (a, b) => (new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())
  );
  const picked: NewsItem[] = [];
  const usedSources = new Set<string>();
  const usedLabels = new Set<string>();

  for (const n of sorted) {
    const keyS = (n.source ?? '').toLowerCase();
    const keyL = (n.geo?.label ?? '').toLowerCase();
    if (usedSources.has(keyS)) continue;
    if (keyL && usedLabels.has(keyL)) continue;
    picked.push(n);
    usedSources.add(keyS);
    if (keyL) usedLabels.add(keyL);
    if (picked.length >= max) break;
  }

  if (picked.length < max) {
    for (const n of sorted) {
      if (picked.includes(n)) continue;
      picked.push(n);
      if (picked.length >= max) break;
    }
  }

  return picked;
}

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

const NEWS_FETCH_TIMEOUT_MS = 10_000;
const NEWS_RING_MAX_R = 14;
const NEWS_RING_SPEED = 10;
const NEWS_RING_PERIOD = 1600;

/** Pulso global: ventana 24h, máximo 50 regiones, un punto por región, intensidad por cantidad */
const PULSO_WINDOW_MS = 24 * 60 * 60 * 1000;
const PULSO_MAX_REGIONS = 50;
/** Radio (km) desde el centro de cámara para filtrar noticias visibles en la lista. */
const VIEW_RADIUS_KM = 3500;
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

const MOOD_LABELS: Record<SoundMood, string> = {
  mar: "Mar",
  ciudad: "Ciudad",
  bosque: "Bosque",
  viento: "Viento",
  animales: "Animales",
  universo: "Universo",
  personas: "Personas",
};

// --- Sonidos del mundo: audio engine (HTMLAudioElement) ---
const AMBIENT_SOURCES: Record<SoundMood, string> = {
  mar: "/audio/mar.m4a",
  ciudad: "/audio/ambients/city.mp3",
  bosque: "/audio/ambients/forest.mp3",
  viento: "/audio/neblina.mp3",
  animales: "/audio/ambients/animals.mp3",
  universo: "/audio/ambients/universe.mp3",
  personas: "/audio/mar.m4a",
};
const AMBIENT_BASE_VOL = 0.6;
const AMBIENT_STORY_VOL = 0.15;

function NewsListCard({
  items,
  index,
  selectedId,
  onSelect,
  now,
}: {
  items: NewsItem[];
  index: number;
  selectedId: string | null;
  onSelect: (item: NewsItem) => void;
  now: number;
}) {
  const item = items[index];
  if (!item) return null;
  const isSelected = selectedId !== null && selectedId !== '' && selectedId === item.id;
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected ? 'bg-white/10 border-orange-500/40 shadow-md shadow-orange-500/10' : 'bg-white/4 border-white/10 hover:bg-white/8 hover:border-white/20 hover:shadow-sm'
      }`}
    >
      <button type="button" onClick={() => onSelect(item)} className="w-full text-left p-4 min-w-0">
        <div className="font-medium text-sm panelCardTitle line-clamp-2 mb-2">
          {item.title.trim() ? item.title : '—'}
        </div>
        <p className="text-xs text-white/70 mb-1">
          <span className="text-white/50">Medio:</span> {item.source || '—'}
        </p>
        <p className="text-xs text-white/70 mb-2">
          {item.publishedAt ? formatTimeAgoFromNow(item.publishedAt, now) : '—'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {item.topic && item.topic.trim().toLowerCase() !== 'actualidad' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-200/90 text-[11px] font-medium">
              {item.topic}
            </span>
          )}
        </div>
      </button>
      <div className="px-4 pb-3 pt-0">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="w-full py-2 rounded-xl bg-white/10 border border-white/15 text-white/90 text-sm font-semibold hover:bg-white/15 transition"
        >
          Abrir
        </button>
      </div>
    </div>
  );
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
  newsLoading = false,
  newsError = null,
  newsIsFallback = false,
  selectedNews,
  onSelectNews,
  onClearSelection,
  liveOverlay = null,
  onCloseLive,
  onOpenLive,
  selectedMood,
  onMoodSelect,
  journey,
  currentChapterIndex,
  isTourRunning,
  isTourPaused,
  onStartTour,
  onPauseResumeTour,
  onStopTour,
  onNextChapter,
  onChapterClick,
  ambientRunning,
  audioBlocked = false,
  onActivateAudio,
  onOpenFromCollection,
  soundEnabled = true,
  onToggleSound,
  tourTimerActive = false,
  filteredStoriesForMusic = [],
  onOpenStoryFromMusic,
  view = 'stories',
  onStartNewsTour,
  onPauseNewsTour,
  newsTourRunning = false,
}: {
  topicsOpen: boolean;
  onTopicsToggle: () => void;
  topicsButtonRef: React.RefObject<HTMLButtonElement | null>;
  isMuted: boolean;
  onToggleAudio: () => void;
  activeView: 'historias' | 'actualidad' | 'musica';
  onActiveViewChange: (view: 'historias' | 'actualidad' | 'musica') => void;
  /** Vista interna del mapa (stories | news | music); para depuración. */
  view?: 'stories' | 'news' | 'music';
  selectedTopic: string | null;
  onClearTopic: () => void;
  selectedStory: StoryPoint | null;
  onClearStory: () => void;
  newsItems: NewsItem[];
  newsLoading?: boolean;
  newsError?: string | null;
  newsIsFallback?: boolean;
  selectedNews: NewsItem | null;
  onSelectNews: (item: NewsItem) => void;
  onClearSelection: () => void;
  liveOverlay?: { embedUrl: string; title: string } | null;
  onCloseLive?: () => void;
  onOpenLive?: (overlay: { embedUrl: string; title: string }) => void;
  selectedMood: SoundMood | null;
  onMoodSelect: (mood: SoundMood) => void;
  journey: StoryMeta[];
  currentChapterIndex: number;
  isTourRunning: boolean;
  isTourPaused: boolean;
  onStartTour: () => void;
  onPauseResumeTour: () => void;
  onStopTour?: () => void;
  onNextChapter: () => void;
  onChapterClick?: (index: number) => void;
  ambientRunning: boolean;
  audioBlocked?: boolean;
  onActivateAudio?: () => void | Promise<void>;
  onOpenFromCollection?: (kind: 'stories' | 'news', id: string) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  /** Debug: true cuando el intervalo del tour está activo (no pausado). */
  tourTimerActive?: boolean;
  filteredStoriesForMusic?: StoryMeta[];
  onOpenStoryFromMusic?: (id: string) => void;
  onStartNewsTour?: () => void;
  onPauseNewsTour?: () => void;
  newsTourRunning?: boolean;
}) {
  const DEBUG = false;
  const newsList = (Array.isArray(newsItems) ? newsItems : []) as NewsItem[];
  const hasLocation = (n: NewsItem) => (n.geo?.lat != null && n.geo?.lng != null) || (n.lat != null && n.lng != null);
  const newsOnMap = useMemo(() => newsList.filter(hasLocation), [newsList]);
  const newsNoLocation = useMemo(() => newsList.filter((n) => !hasLocation(n)), [newsList]);
  const [collectionItems, setCollectionItems] = useState<Array<{ kind: 'stories' | 'news'; id: string; title: string; subtitle: string }>>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('almamundi_coleccion');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown[];
      return (Array.isArray(parsed) ? parsed : [])
        .filter((i): i is { kind: string; id: string; title: string; subtitle: string } => typeof (i as any)?.kind === 'string' && typeof (i as any)?.id === 'string')
        .slice(0, 5)
        .map((i) => ({ kind: i.kind as 'stories' | 'news', id: i.id, title: i.title || '—', subtitle: i.subtitle || '—' }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handler = () => {
      try {
        const raw = window.localStorage.getItem('almamundi_coleccion');
        if (!raw) {
          setCollectionItems([]);
          return;
        }
        const parsed = JSON.parse(raw) as unknown[];
        const list = (Array.isArray(parsed) ? parsed : [])
          .filter((i): i is { kind: string; id: string; title: string; subtitle: string } => typeof (i as any)?.kind === 'string' && typeof (i as any)?.id === 'string')
          .slice(0, 5)
          .map((i) => ({ kind: i.kind as 'stories' | 'news', id: i.id, title: i.title || '—', subtitle: i.subtitle || '—' }));
        setCollectionItems(list);
      } catch {
        setCollectionItems([]);
      }
    };
    window.addEventListener('almamundi-collection-updated', handler);
    return () => window.removeEventListener('almamundi-collection-updated', handler);
  }, []);
  /** Actualización cada minuto del tiempo relativo en Pulso Global; no refetch. */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const [showHowTo, setShowHowTo] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);

  // ===== Tabs / Views (premium segmented control) =====
  const VIEW_LABEL: Record<string, string> = {
    historias: "Historias de personas",
    actualidad: "Noticias en vivo",
    musica: "Sonidos del mundo",
  };
  /** Etiquetas cortas solo para los tabs (1 línea). El título del panel sigue siendo largo. */
  const TAB_LABEL: Record<string, string> = {
    historias: "Historias",
    musica: "Sonidos",
    actualidad: "Noticias",
  };

  const views = ["historias", "musica", "actualidad"] as const;

  return (
    <div
      className="relative z-20 flex flex-col gap-5 min-h-0"
      style={{ fontFamily: APP_FONT, width: '100%' }}
    >
      {DEBUG && activeView === 'musica' && (
        <div
          className="absolute bottom-4 right-4 z-30 px-2.5 py-2 rounded-lg bg-black/60 border border-white/15 backdrop-blur-sm font-mono text-[10px] text-white/80 leading-tight space-y-0.5"
          aria-hidden
        >
          <div>Mood: {selectedMood ?? '—'}</div>
          <div>soundEnabled: {String(soundEnabled)}</div>
          <div>ambient.isRunning: {String(ambientRunning)}</div>
          <div>tour: {String(isTourRunning)} / paused: {String(isTourPaused)}</div>
          <div>timer activo: {tourTimerActive ? 'sí' : 'no'}</div>
        </div>
      )}
      {DEBUG && (
        <p className="text-[10px] font-mono text-white/50 px-1 shrink-0" aria-hidden>
          Vista: {view}
        </p>
      )}
      {/* Sonido del universo: cortar/activar arriba de la franja */}
      <div className="lm-card shrink-0">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onToggleAudio}
            className="lm-btn-ghost flex items-center gap-2"
            style={soundEnabled ? { borderColor: 'rgba(255,106,0,.5)', background: 'rgba(255,106,0,.12)' } : undefined}
            title={soundEnabled ? 'Cortar sonido del universo' : 'Activar sonido del universo'}
            aria-label={soundEnabled ? 'Cortar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>
      {/* Card 1: Header "Explora el mapa" — Liquid Metal */}
      <div className="lm-card shrink-0">
        <h2 className="lm-h1">Explora el mapa</h2>
        <p className="lm-p max-w-[32ch]">
          Tres formas de mirar el mundo. Elige una y haz clic en un punto.
        </p>
      </div>

      {/* Card 2: Buscador (solo Historias / Noticias) */}
      {activeView !== 'musica' && (
        <div className="lm-card shrink-0">
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
      )}

      {/* Card 3: Temas — Liquid Metal */}
      <div className="lm-card shrink-0">
        <div className="flex flex-wrap gap-3">
          <button
            ref={topicsButtonRef}
            type="button"
            onClick={onTopicsToggle}
            className="lm-btn-ghost flex items-center gap-2"
          >
            <Filter size={18} />
            Temas
            <ChevronDown size={16} className={topicsOpen ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>

      {/* ===== Tabs: Historias | Sonidos | Noticias — Liquid Metal / Apple ===== */}
      <div className="lm-tabs shrink-0">
        {views.map((v) => {
          const active = activeView === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onActiveViewChange(v)}
              className={`lm-tab ${active ? 'lm-tab--active' : ''}`}
              aria-pressed={active}
            >
              {TAB_LABEL[v]}
            </button>
          );
        })}
      </div>
      {activeView !== 'musica' && (
        <p className="lm-tip shrink-0">
          Haz clic en un punto para abrir una historia.
        </p>
      )}

      {/* Tarjeta de contenido principal — Liquid Metal */}
      <div className="lm-card flex-1 min-h-[200px] flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col">
          {/* — Historias de personas */}
          {activeView === 'historias' && (
            <>
              <h3 className="panelTitle mb-2">Historias de personas</h3>
              <p className="panelLead mb-4 max-w-[32ch]">
                Relatos personales: audio, texto y video. La vida contada desde adentro.
              </p>
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

          {/* — Noticias en vivo (Apple-level copy) */}
          {activeView === 'actualidad' && (() => {
            const selectedNewsId = selectedNews?.id ?? null;
            return (
            <>
              <h3 className="panelTitle mb-2">Noticias en vivo</h3>
              <p className="panelLead mb-2 max-w-[36ch]">
                Para ver el mundo mientras ocurre. El mapa marca dónde pasa cada titular. Tú decides qué abrir: siempre fuente y hora.
              </p>
              <p className="text-[12px] text-white/60 max-w-[36ch] mb-3">
                No hacemos resúmenes. Te llevamos al enlace oficial.
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {newsTourRunning ? (
                  <button
                    type="button"
                    onClick={onPauseNewsTour}
                    className="panelMeta font-semibold hover:text-white/80 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200/90 transition"
                  >
                    Detener ruta
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onStartNewsTour}
                    className="panelMeta font-semibold hover:text-white/80 px-2.5 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 transition"
                  >
                    Ruta Ahora
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCriteria((v) => !v)}
                  className="panelMeta font-semibold hover:text-white/80 px-2.5 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 transition"
                >
                  ¿Por qué está aquí?
                </button>
              </div>
              {showCriteria && (
                <p className="panelMeta max-w-[36ch] mb-4 pl-0">
                  Las historias muestran la vida por dentro. Las noticias muestran el contexto por fuera. El mapa las une por lugar y tema.
                </p>
              )}
              {selectedNews ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold panelCardTitle leading-snug line-clamp-3 flex-1">
                      {selectedNews.title.trim() ? selectedNews.title : '—'}
                    </h4>
                    <button type="button" onClick={onClearSelection} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0" aria-label="Cerrar"><X size={16} /></button>
                  </div>
                  <p className="text-xs panelCardSubtitle">
                    {selectedNews.source || '—'}
                    {selectedNews.topic && selectedNews.topic.trim().toLowerCase() !== 'actualidad' ? ` · ${selectedNews.topic}` : ''}
                  </p>
                  <p className="text-[11px] text-white/55">
                    {selectedNews.publishedAt ? formatTimeAgoFromNow(selectedNews.publishedAt, now) : '—'}
                  </p>
                  <p className="text-[11px] text-white/55">
                    Por qué aparece: tema y fuente curada del proyecto.
                  </p>
                  {selectedNews.url && (
                    <a href={selectedNews.url} target="_blank" rel="noopener noreferrer" className="lm-btn-primary inline-flex items-center justify-center mt-2">
                      Abrir en la fuente
                    </a>
                  )}
                </div>
              ) : (
                <>
                  {newsLoading && newsList.length === 0 && (
                    <p className="text-white/50 text-sm py-6 text-center">Cargando noticias…</p>
                  )}
                  {newsError && (
                    <p className="text-red-400/80 text-sm py-4 text-center">No se pudo cargar.</p>
                  )}
                  {!newsLoading && !newsError && newsList.length === 0 && (
                    <p className="text-white/40 text-sm py-6 text-center">No hay noticias recientes de los medios autorizados.</p>
                  )}
                  {newsList.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">En el mapa</p>
                      <div className="space-y-2 mb-4">
                        {newsOnMap.length === 0 ? (
                          <p className="text-white/40 text-xs py-2">Ninguna con ubicación.</p>
                        ) : (
                          newsOnMap.map((item, idx) => (
                            <NewsListCard
                              key={`news-map-${idx}-${item.id || 'n'}`}
                              items={newsOnMap}
                              index={idx}
                              selectedId={selectedNewsId}
                              onSelect={onSelectNews}
                              now={now}
                            />
                          ))
                        )}
                      </div>
                      {newsNoLocation.length > 0 && (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Sin ubicación</p>
                          <div className="space-y-2">
                            {newsNoLocation.map((item, idx) => (
                              <NewsListCard
                                key={`news-noloc-${idx}-${item.id || 'n'}`}
                                items={newsNoLocation}
                                index={idx}
                                selectedId={selectedNewsId}
                                onSelect={onSelectNews}
                                now={now}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
            );
          })()}


          {/* — Sonidos del mundo: el mapa manda. Sin capítulos/paradas/viajando. */}
          {activeView === 'musica' && (
            <div className="space-y-4">
              <h3 className="panelTitle">Sonidos del mundo</h3>
              <div className="text-white/85 text-[13.5px] md:text-[14px] leading-relaxed max-w-[36ch] space-y-2">
                <p>Elige un sonido y el mapa muestra solo las historias que van con ese ambiente.</p>
                <p>Haz clic en un punto o en «Abrir» para escuchar o leer la historia. El ambiente se baja al abrir.</p>
              </div>

              {/* 1) Chips de mood — Liquid Metal */}
              <div className="lm-chips">
                {SOUND_MOODS.filter((m) => m !== 'universo').map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onMoodSelect(m)}
                    className={selectedMood === m ? 'lm-chip lm-chip--active' : 'lm-chip'}
                  >
                    {MOOD_LABELS[m]}
                  </button>
                ))}
              </div>

              {/* 2) Toggle Audio ON/OFF — Apple toggle Liquid Metal */}
              <div className="lm-toggle flex items-center justify-between gap-2 flex-wrap">
                <span className="lm-switch-label truncate">
                  {!selectedMood ? 'Elige un sonido.' : `${MOOD_LABELS[selectedMood]} · ${filteredStoriesForMusic?.length ?? 0} historias`}
                </span>
                <button
                  type="button"
                  className={`lm-switch ${soundEnabled ? 'on' : ''}`}
                  onClick={onToggleSound}
                  aria-pressed={soundEnabled}
                  aria-label={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
                >
                  <span className="lm-knob" aria-hidden />
                </button>
              </div>

              {/* 3) Recorrido automático — Liquid Metal ghost buttons */}
              <div className="flex items-center gap-2">
                {!isTourRunning && (
                  <button
                    type="button"
                    disabled={!selectedMood}
                    onClick={selectedMood ? onStartTour : undefined}
                    className="lm-btn-ghost inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Iniciar recorrido automático"
                  >
                    <span aria-hidden>▶</span>
                    Recorrido
                  </button>
                )}
                {isTourRunning && (
                  <>
                    <button type="button" onClick={onNextChapter} className="lm-btn-ghost">
                      Siguiente
                    </button>
                    {onStopTour && (
                      <button type="button" onClick={onStopTour} className="lm-btn-ghost">
                        Detener
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* 4) Lista "Historias para este sonido" — máx 6 visibles, botón Abrir */}
              {selectedMood != null && (
                <div className="space-y-1.5">
                  <p className="text-[12px] font-semibold text-white/80">
                    Historias para este sonido
                  </p>
                  <ul className="space-y-1 max-h-[220px] overflow-y-auto hide-scrollbar">
                    {(filteredStoriesForMusic || []).slice(0, 6).map((s) => (
                      <li key={s.id}>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 flex items-center gap-2 min-w-0">
                          <span className="text-[14px] shrink-0" aria-hidden>
                            {s.hasVideo ? '🎥' : s.hasAudio ? '🎧' : '📝'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium panelCardTitle truncate">{s.title}</p>
                            <p className="text-[11px] panelCardSubtitle truncate">{s.placeLabel ?? [s.city, s.country].filter(Boolean).join(', ')}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenStoryFromMusic?.(s.id)}
                            className="shrink-0 py-1.5 px-3 rounded-lg bg-white/15 border border-white/20 text-white text-xs font-semibold hover:bg-white/25 transition"
                          >
                            Abrir
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {filteredStoriesForMusic?.length === 0 && (
                    <p className="text-[11px] panel-sec">No hay historias para este sonido.</p>
                  )}
                  {(filteredStoriesForMusic?.length ?? 0) > 6 && (
                    <p className="text-[11px] text-white/50">Haz clic en un punto del mapa para ver más.</p>
                  )}
                </div>
              )}

              {/* Tarjeta "Activar audio" solo cuando el usuario quiere sonido pero el navegador lo bloqueó */}
              {soundEnabled && audioBlocked && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 flex flex-col gap-2">
                  <p className="text-[13px] text-white/90">Activa el audio para escuchar el ambiente.</p>
                  <button
                    type="button"
                    onClick={() => onActivateAudio?.()}
                    className="py-2 px-4 rounded-lg bg-amber-500/25 border border-amber-500/40 text-amber-200 text-sm font-semibold hover:bg-amber-500/35 transition w-fit"
                  >
                    Activar audio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PulseIndicator({
  storiesCount,
  newbornCount,
  resonatingCount,
}: {
  storiesCount: number;
  newbornCount: number;
  resonatingCount: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = 72;
    const h = 24;
    canvas.width = w;
    canvas.height = h;

    const ekgPoints = [
      0, 0, 0, 0, 0,
      0.08, 0.15, 0.08,
      0, 0, 0,
      -0.25,
      1.0,
      -0.35,
      0, 0,
      0.2, 0.3, 0.25, 0.15, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
    ];

    const draw = () => {
      timeRef.current += 0.015;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(249, 115, 22, 0.5)';
      ctx.shadowBlur = 4;

      const total = ekgPoints.length;
      const offset = (t * 30) % total;
      const midY = h / 2;

      for (let x = 0; x < w; x++) {
        const idx = (Math.floor((x / w) * total) + Math.floor(offset)) % total;
        const val = ekgPoints[idx];
        const y = midY - val * (h * 0.45);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 4px',
      flexShrink: 0,
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: 72, height: 24, flexShrink: 0 }}
      />
      <div>
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.55)',
          margin: 0,
          fontFamily: "'Avenir Light', Avenir, sans-serif",
        }}>
          {storiesCount > 0
            ? `${storiesCount} historias en el mapa`
            : 'Aún no hay historias'}
        </p>
        {newbornCount > 0 && (
          <p style={{
            fontSize: 11,
            color: '#f97316',
            margin: '2px 0 0',
            fontFamily: "'Avenir Light', Avenir, sans-serif",
          }}>
            {newbornCount} nuevas hoy
          </p>
        )}
      </div>
    </div>
  );
}

function TopicChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...chipStyle(active), whiteSpace: 'nowrap' }}
    >
      {label}
    </button>
  );
}

/** 10 nombres de ejemplo para llenar el espacio cuando no hay historias cargadas */
const ULTIMAS_HISTORIAS_EJEMPLO: { title: string; city: string; country: string }[] = [
  { title: 'La abuela que cruzó el desierto', city: 'Antofagasta', country: 'Chile' },
  { title: 'Primer día en la nueva ciudad', city: 'Buenos Aires', country: 'Argentina' },
  { title: 'El mar que nos une', city: 'Valparaíso', country: 'Chile' },
  { title: 'Cartas desde el exilio', city: 'Madrid', country: 'España' },
  { title: 'La tienda de la esquina', city: 'Ciudad de México', country: 'México' },
  { title: 'Voces del barrio', city: 'Medellín', country: 'Colombia' },
  { title: 'El viaje que cambió todo', city: 'Lima', country: 'Perú' },
  { title: 'Bajo la misma luna', city: 'Santiago', country: 'Chile' },
  { title: 'Memorias del puerto', city: 'Montevideo', country: 'Uruguay' },
  { title: 'Lo que el viento se llevó', city: 'Barcelona', country: 'España' },
];

function StoryRow({ story, isActive, onClick }: { story: StoryPoint; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '15px 16px',
        borderRadius: 14,
        background: isActive ? 'rgba(249,115,22,0.10)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(249,115,22,0.30)' : 'rgba(255,255,255,0.07)'}`,
        borderLeft: isActive ? '3px solid rgba(249,115,22,0.6)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        fontFamily: "'Avenir Light', Avenir, sans-serif",
        width: '100%',
      }}
    >
      <p style={{
        fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.80)',
        margin: '0 0 4px',
        lineHeight: 1.35,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {story.title ?? story.label}
      </p>
      <p style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
        margin: 0,
      }}>
        {[story.city, story.country].filter(Boolean).join(', ')}
      </p>
    </button>
  );
}

function NewsRow({ news, isActive, onClick, dimmed = false }: { news: NewsItem; isActive: boolean; onClick: () => void; dimmed?: boolean }) {
  const timeAgo = (date: string | null) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  const handleClick = () => {
    onClick();
    if (news.url) {
      window.open(news.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 14,
        background: isActive ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderLeft: isActive ? '3px solid rgba(96,165,250,0.6)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        fontFamily: "'Avenir Light', Avenir, sans-serif",
        width: '100%',
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <p style={{
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        margin: '0 0 6px',
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {news.title}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>
          {news.source ?? news.outletName ?? '—'}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }} title={news.publishedAt ?? undefined}>
          {timeAgo(news.publishedAt ?? null)}
        </span>
      </div>
    </button>
  );
}

function HistoriasPanel({
  stories, exploreQuery, onExploreQueryChange, onStoryFocus, highlightedStoryId,
}: {
  stories: StoryPoint[];
  exploreQuery: string;
  onExploreQueryChange: (q: string) => void;
  onStoryFocus: (s: StoryPoint) => void;
  highlightedStoryId: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Solo búsqueda por palabras clave */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
          <input
            type="search"
            value={exploreQuery}
            onChange={(e) => onExploreQueryChange(e.target.value)}
            placeholder="Buscar por palabra clave"
            aria-label="Buscar historias por palabra clave"
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 13,
              fontFamily: "'Avenir Light', Avenir, sans-serif",
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {stories.length > 0 ? (
          stories.map((s, i) => (
            <StoryRow
              key={s.id ?? i}
              story={s}
              isActive={highlightedStoryId === s.id}
              onClick={() => onStoryFocus(s)}
            />
          ))
        ) : (
          <>
            <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '4px 0 8px 4px', fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
              Últimas historias
            </p>
            {ULTIMAS_HISTORIAS_EJEMPLO.map((h, i) => (
              <div
                key={`ejemplo-${i}`}
                style={{
                  textAlign: 'left',
                  padding: '15px 16px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                  width: '100%',
                }}
              >
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.80)', margin: '0 0 4px', lineHeight: 1.35 }}>
                  {h.title}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  {h.city}, {h.country}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function NoticiasPanel({
  news, selectedTopicId, onTopicIdChange, onNewsFocus, selectedNews,
}: {
  news: NewsItem[];
  selectedTopicId: string | null;
  onTopicIdChange: (id: string | null) => void;
  onNewsFocus: (n: NewsItem) => void;
  selectedNews: NewsItem | null;
}) {
  const hasLocation = (n: NewsItem) => (n.geo?.lat != null && n.geo?.lng != null) || (n.lat != null && n.lng != null);
  const withLocation = news.filter(hasLocation);
  const withoutLocation = news.filter((n) => !hasLocation(n));
  /** Etiquetas cortas para los chips (más armónicas en una sola fila) */
  const topicShortLabel: Record<string, string> = {
    'poder-gobernanza': 'Política',
    'tecnologia-innovacion': 'Tecnología',
    'arte-cultura': 'Arte y cultura',
    'finanzas-salud': 'Finanzas y salud',
    'educacion': 'Educación',
    'medio-ambiente': 'Medio ambiente',
    'deportes': 'Deportes',
    'ciencia': 'Ciencia',
    'migracion-derechos': 'Migración',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Temas: texto dentro de los óvalos, sin salirse */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 8,
          alignContent: 'start',
        }}>
          <button
            type="button"
            onClick={() => onTopicIdChange(null)}
            style={{
              ...chipStyle(!selectedTopicId),
              fontSize: 12,
              padding: '8px 12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              minWidth: 0,
            }}
          >
            Todas
          </button>
          {NEWS_TOPIC_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onTopicIdChange(selectedTopicId === g.id ? null : g.id)}
              style={{
                ...chipStyle(selectedTopicId === g.id),
                fontSize: 12,
                padding: '8px 12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                minWidth: 0,
              }}
              title={g.label}
            >
              {topicShortLabel[g.id] ?? (g.label.length > 14 ? g.label.slice(0, 12) + '…' : g.label)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {withLocation.length > 0 && (
          <>
            <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(249,115,22,0.5)', margin: '4px 0 2px 4px', fontFamily: "'Avenir Light', Avenir, sans-serif" }}>◎ En el mapa</p>
            {withLocation.map((n, i) => (
              <NewsRow key={`${n.id ?? 'news'}-${i}`} news={n} isActive={selectedNews?.id === n.id} onClick={() => onNewsFocus(n)} />
            ))}
          </>
        )}
        {withoutLocation.length > 0 && (
          <>
            {withoutLocation.map((n, i) => (
              <NewsRow key={`${n.id ?? 'news'}-${i}`} news={n} isActive={selectedNews?.id === n.id} onClick={() => onNewsFocus(n)} dimmed />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/** Sonidos disponibles en Historias, Noticias y Sonidos (Universo por defecto). */
const AMBIENT_OPTS = [
  { id: 'mar' as const, label: 'Mar', desc: 'Olas, calma' },
  { id: 'ciudad' as const, label: 'Ciudad', desc: 'Urbano, presente' },
  { id: 'viento' as const, label: 'Viento', desc: 'Aire, naturaleza' },
];

function SonidosPanel({
  currentMood, onMoodChange, soundEnabled, onToggleSound,
}: {
  currentMood: string;
  onMoodChange: (m: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {AMBIENT_OPTS.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onMoodChange(m.id)}
          style={{
            textAlign: 'left',
            padding: '14px 16px',
            borderRadius: 12,
            background: currentMood === m.id ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${currentMood === m.id ? 'rgba(249,115,22,0.30)' : 'rgba(255,255,255,0.07)'}`,
            borderLeft: currentMood === m.id ? '3px solid rgba(249,115,22,0.6)' : '3px solid transparent',
            cursor: 'pointer',
            opacity: 1,
            transition: 'all 200ms ease',
            fontFamily: "'Avenir Light', Avenir, sans-serif",
            width: '100%',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <p style={{ fontSize: 15, fontWeight: currentMood === m.id ? 500 : 300, color: currentMood === m.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)', margin: 0, fontFamily: "'Avenir Light', Avenir, sans-serif" }}>
            {m.label}
          </p>
        </button>
      ))}
    </div>
  );
}

type MapaPageContentProps = {
  embedded?: boolean;
  /** Donde empieza el universo (sección oscura) para recortar el drawer */
  sectionTopOffset?: number;
  sectionHeight?: number;
  /** Si el Universo está visible en viewport (home): cuando false, se cierra el drawer y no se puede abrir */
  universeVisible?: boolean;
};

function MapaPageContent({ embedded = false, sectionTopOffset = 0, sectionHeight = 0, universeVisible = true }: MapaPageContentProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  /** Audio del universo: por defecto ON; la persona puede apagarlo con el botón Universo. */
  const [isMuted, setIsMuted] = useState(false);
  const globeEl = useRef<any>(null);
  const cloudMeshRef = useRef<THREE.Mesh | null>(null);
  /** POV base para “return to base” al cerrar historia (shot 1). */
  const basePOVRef = useRef<{ lat: number; lng: number; altitude: number } | null>(null);
  const isUserInteractingRef = useRef(false);
  const panelCanvasRef = useRef<HTMLCanvasElement>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const topicsButtonRef = useRef<HTMLButtonElement | null>(null);
  const [globeMaterial, setGlobeMaterial] = useState<Material | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [atmosphereBreathingOffset, setAtmosphereBreathingOffset] = useState(0);
  const lastBreathingUpdateRef = useRef(0);
  const globeDayTexRef = useRef<import('three').Texture | null>(null);
  const globeNightTexRef = useRef<import('three').Texture | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeView, setActiveView] = useState<'historias' | 'actualidad' | 'musica'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'actualidad') return 'actualidad';
    if (tab === 'sonidos') return 'musica';
    if (tab === 'historias') return 'historias';
    return searchParams.get('view') === 'music' ? 'musica' : 'historias';
  });
  const [view, setView] = useState<MapView>('stories');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<StoryPoint | null>(null);
  /** Centro aproximado de la cámara del globo; para filtrar lista de noticias por lo que se ve. */
  const [viewCenter, setViewCenter] = useState<{ lat: number; lng: number }>({ lat: -10, lng: -60 });
  /** Ruta Ahora: tour de 6–8 noticias con flyTo cada X segundos. */
  const [newsTour, setNewsTour] = useState<{ items: NewsItem[]; idx: number; running: boolean }>({ items: [], idx: 0, running: false });
  /** Por defecto Universo: el sonido del universo suena al entrar (si el audio está ON). */
  const [selectedMood, setSelectedMood] = useState<SoundMood | null>('universo');
  const [journey, setJourney] = useState<StoryMeta[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [isTourPaused, setIsTourPaused] = useState(false);
  /** Visor de historia encima del mapa (sin navegar) */
  const [openStory, setOpenStory] = useState<StoryPoint | null>(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [panelHidden, setPanelHidden] = useState(false);
  /** Dock + Drawer UI: drawer abierto y modo (stories | news | sounds | search). */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<MapDockMode>('stories');
  /** Preferencia de sonido ambiente (music): persistida en localStorage */
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const v = window.localStorage.getItem('almamundi_sound_enabled');
      if (v === null || v === undefined) return true;
      return v === 'true';
    } catch {
      return true;
    }
  });
  const ambient = useAmbientEngine();
  const hourOverride = (() => {
    const h = searchParams.get('hour');
    if (h == null) return undefined;
    const n = parseInt(h, 10);
    return Number.isFinite(n) && n >= 0 && n <= 23 ? n : undefined;
  })();
  const atm = useAtmosphere(hourOverride);
  const lastMouseRef = useRef({ x: 0, y: 0, t: 0 });
  const beatRef = useRef(0);
  const lastBeatUpdateRef = useRef(0);
  const [beatPhase, setBeatPhase] = useState(0);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [ambientUnlocked, setAmbientUnlocked] = useState(false);

  const pulseTimeRef = useRef(0);
  const storyCountRef = useRef(0);
  const [pulseFrame, setPulseFrame] = useState(0);
  usePulseAnimation(({ time }) => {
    pulseTimeRef.current = time;
    if (Math.floor(time * 10) !== Math.floor((time - 0.016) * 10)) {
      setPulseFrame((f) => f + 1);
    }
  });

  const playAmbientDirect = useCallback(async (mood: SoundMood) => {
    try {
      if (!getAmbientUnlocked()) {
        await unlockAmbientAudio();
        setAmbientUnlocked(true);
      }
      await webPlayAmbient(mood as AmbientKey);
      startGenerativeLayer(new Date().getHours(), storyCountRef.current);
      setAudioBlocked(false);
    } catch {
      setAudioBlocked(true);
    }
  }, []);

  const playAmbient = useCallback(async () => {
    if (!soundEnabled || !selectedMood) return;
    await playAmbientDirect(selectedMood);
  }, [soundEnabled, selectedMood, playAmbientDirect]);

  const stopAmbient = useCallback(() => {
    webStopAmbient();
    stopGenerativeLayer();
  }, []);

  const setAmbientVolumeDuringStory = useCallback((isStoryOpen: boolean) => {
    duckAmbient(isStoryOpen);
  }, []);

  useEffect(() => {
    if (!soundEnabled) {
      webSetAmbientEnabled(false);
      return;
    }
    webSetAmbientEnabled(true);
    if (selectedMood && ambientUnlocked) void playAmbient();
  }, [soundEnabled, playAmbient, selectedMood, ambientUnlocked]);

  /** Al abrir una historia se corta el sonido del universo; al cerrarla se reanuda. */
  useEffect(() => {
    if (openStory) {
      stopAmbient();
      return;
    }
    if (soundEnabled && (selectedMood ?? 'universo') && ambientUnlocked) void playAmbient();
  }, [openStory, soundEnabled, selectedMood, ambientUnlocked, stopAmbient, playAmbient]);

  // Desbloquear audio: en home solo cuando ya están en el mapa (universeVisible), así el primer toque en el mapa pone el sonido
  const unlockListenerAddedRef = useRef(false);
  useEffect(() => {
    if (embedded && !universeVisible) return;
    if (embedded && unlockListenerAddedRef.current) return;
    if (embedded) unlockListenerAddedRef.current = true;

    const unlock = async () => {
      try {
        await unlockAmbientAudio();
        setAmbientUnlocked(true);
        await webPlayAmbient('universo');
        startGenerativeLayer(new Date().getHours(), storyCountRef.current);
        setAudioBlocked(false);
      } catch { /* browser blocked */ }
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, [embedded, universeVisible]);

  useEffect(() => {
    startSessionTimer();
  }, []);

  useEffect(() => {
    const handler = () => setStoryModalOpen(true);
    window.addEventListener('almamundi:openModal', handler);
    return () => window.removeEventListener('almamundi:openModal', handler);
  }, []);

  // Animación rings noticias: scene.traverse busca RingGeometry y las orienta a cámara + pulso; rotar nubes
  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      const cam = globeEl.current?.camera?.();
      const scene = globeEl.current?.scene?.();
      if (cam && scene) {
        scene.traverse((o: THREE.Object3D) => {
          const mesh = o as THREE.Mesh;
          if (mesh.geometry && (mesh.geometry as THREE.BufferGeometry).type === 'RingGeometry') {
            mesh.quaternion.copy(cam.quaternion);
            const speed = (mesh.userData.speed as number) ?? 1;
            const offset = (mesh.userData.phaseOffset as number) ?? 0;
            const phase = (t * 0.001 * speed + offset) % 1;
            const s = 0.8 + phase * 2.0;
            mesh.scale.set(s, s, 1);
            (mesh.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - phase);
          }
        });
        if (cloudMeshRef.current) cloudMeshRef.current.rotation.y += 0.00008;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /** true mientras el tour use STORIES_MOCK: no navegar a /historias/[id], solo highlight + pointOfView */
  const tourUsesMockStoriesRef = useRef(true);
  /** Timer de auto-avance del viaje (30s); se limpia al pausar y se reinicia al reanudar. */
  const tourTimerRef = useRef<number | null>(null);
  const nextChapterRef = useRef<() => void>(() => {});
  /** Sonidos: label arriba del globo al ir a una historia (título — lugar), 2.5s */
  const [storyLabel, setStoryLabel] = useState<{ title: string; place: string } | null>(null);
  const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(null);
  const storyLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStoryLabelTemporary = useCallback((title: string, place: string, storyId: string) => {
    if (storyLabelTimeoutRef.current) clearTimeout(storyLabelTimeoutRef.current);
    setStoryLabel({ title, place });
    setHighlightedStoryId(storyId);
    storyLabelTimeoutRef.current = setTimeout(() => {
      setStoryLabel(null);
      setHighlightedStoryId(null);
      storyLabelTimeoutRef.current = null;
    }, 2500);
  }, []);

  /** Hover preview: punto bajo el mouse y posición en pantalla */
  const [hovered, setHovered] = useState<{
    kind: 'stories' | 'music' | 'news';
    id: string;
    title: string;
    subtitle: string;
    lat: number;
    lng: number;
    /** Solo para kind === 'news': URL del artículo */
    url?: string;
    /** Solo para kind === 'stories': disponibilidad de medios */
    hasAudio?: boolean;
    hasVideo?: boolean;
    hasText?: boolean;
  } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const hoverPosRef = useRef<{ x: number; y: number } | null>(null);

  /** Al entrar a Sonidos del mundo, mood por defecto para no mostrar "—" */
  /** music_logic_make_it_obvious_v1: estado inicial sin mood; el usuario elige un chip. */

  /** Historias filtradas por sonido (mood); orden: con audio/video primero, luego por título. */
  const filteredStoriesForMusic = useMemo(() => {
    if (!selectedMood) return [];
    return [...STORIES_MOCK]
      .filter((s) => s.moods.includes(selectedMood))
      .sort((a, b) => {
        const pa = (a.hasAudio || a.hasVideo) ? 0 : 1;
        const pb = (b.hasAudio || b.hasVideo) ? 0 : 1;
        return pa - pb || (a.title || '').localeCompare(b.title || '');
      });
  }, [selectedMood]);

  /** Music: al cambiar mood, enfocar globo al centro del conjunto de historias filtradas (map_is_the_product_v1). */
  useEffect(() => {
    if (view !== 'music' || !selectedMood || !globeEl.current || filteredStoriesForMusic.length === 0) return;
    const list = filteredStoriesForMusic;
    const avgLat = list.reduce((a, s) => a + s.lat, 0) / list.length;
    const avgLng = list.reduce((a, s) => a + s.lng, 0) / list.length;
    try {
      globeEl.current.pointOfView({ lat: avgLat, lng: avgLng, altitude: 1.8 }, 900);
    } catch {}
  }, [view, selectedMood, filteredStoriesForMusic]);

  /** Al volver a /mapa desde una historia: subir volumen del ambiente de nuevo. */
  useEffect(() => {
    if (typeof window === 'undefined' || pathname !== '/mapa') return;
    setAmbientVolumeDuringStory(false);
  }, [pathname, setAmbientVolumeDuringStory]);

  const handleMusicMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (view !== 'music' || !ambient.isRunning) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / Math.max(1, rect.width);
      const yNorm = (e.clientY - rect.top) / Math.max(1, rect.height);
      const now = performance.now();
      const prev = lastMouseRef.current;
      const dt = (now - prev.t) / 1000;
      const speed =
        dt > 0
          ? Math.min(1, (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y)) / (rect.width * 0.5))
          : 0;
      lastMouseRef.current = { x: e.clientX, y: e.clientY, t: now };
      const speedNorm = Math.min(1, speed * 2);
      ambient.setMouse(xNorm, yNorm, speedNorm);
    },
    [view, ambient]
  );

  // En music: RAF loop para zoom → setZoom y beat → setBeatPhase cada 250ms (rings/arcs alpha)
  useEffect(() => {
    if (view !== 'music') return;
    let rafId: number;
    const loop = () => {
      const now = performance.now();
      const cam = globeEl.current?.camera?.();
      if (cam) {
        const dist = cam.position.length();
        const z = Math.max(0, Math.min(1, (dist - 260) / (520 - 260)));
        ambient.setZoom(z);
      }
      const beat = 0.5 + 0.5 * Math.sin(now * 0.004);
      beatRef.current = beat;
      if (now - lastBeatUpdateRef.current >= 250) {
        lastBeatUpdateRef.current = now;
        setBeatPhase(beat);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [view, ambient]);

  useEffect(() => {
    if (searchParams.get('view') === 'music') setActiveView('musica');
  }, [searchParams]);

  // Cerrar drawer cuando el Universo deja de ser visible (usuario scrolleó arriba al hero)
  useEffect(() => {
    if (embedded && !universeVisible) setDrawerOpen(false);
  }, [embedded, universeVisible]);

  // Al bajar al mapa: activar sonido del universo por defecto e intentar reproducir (icono en naranja para poder apagarlo)
  const soundAutoEnabledRef = useRef(false);
  useEffect(() => {
    if (!embedded || !universeVisible) return;
    if (soundAutoEnabledRef.current) return;
    soundAutoEnabledRef.current = true;
    setSoundEnabled(true);
    // Intentar poner el audio del universo al llegar; si el navegador bloquea, se desbloqueará en el primer clic
    void playAmbientDirect('universo');
  }, [embedded, universeVisible, playAmbientDirect]);

  // "El globo viene de atrás y se acerca": al entrar al Universe (scroll), animar POV de lejos a cerca (una sola vez)
  useEffect(() => {
    if (!embedded || !universeVisible || !globeReady || globeEntrancePlayedRef.current || !globeEl.current) return;
    globeEntrancePlayedRef.current = true;
    try {
      globeEl.current.pointOfView({ lat: 0, lng: -30, altitude: 3.0 }, 0);
      globeEl.current.pointOfView({ lat: 0, lng: -30, altitude: 1.2 }, 1400);
    } catch {}
  }, [embedded, universeVisible, globeReady]);

  // Abrir drawer y fijar modo según ?tab= (home dock navega con ?tab=historias|actualidad|sonidos). Solo abrir si el Universo está visible (evitar abrir en hero).
  useEffect(() => {
    if (embedded && !universeVisible) return;
    const tab = searchParams.get('tab');
    if (tab === 'historias') {
      setDrawerMode('stories');
      setDrawerOpen(true);
    } else if (tab === 'actualidad') {
      setDrawerMode('news');
      setDrawerOpen(true);
    } else if (tab === 'sonidos') {
      setDrawerMode('sounds');
      setDrawerOpen(true);
    }
  }, [searchParams, embedded, universeVisible]);

  // Ubicación aproximada del usuario para día/noche según su lugar
  useEffect(() => {
    getApproxLocation().then((loc) => {
      if (loc) setUserLocation({ lat: loc.lat, lng: loc.lng });
    });
  }, []);

  // Modo día/noche: ?hour=12 fuerza día, ?hour=22 fuerza noche; si no, según sol en ubicación del usuario o hora local
  useEffect(() => {
    const updateDayNight = () => {
      if (hourOverride != null) {
        setIsNight(hourOverride < 7 || hourOverride >= 19);
        return;
      }
      const now = new Date();
      if (userLocation) {
        setIsNight(isNightAtLocation(userLocation.lat, userLocation.lng, now));
      } else {
        const hour = now.getHours();
        setIsNight(hour < 7 || hour >= 19);
      }
    };
    updateDayNight();
    const id = setInterval(updateDayNight, 60_000);
    return () => clearInterval(id);
  }, [userLocation, hourOverride]);

  // Movimiento suave: autoRotate solo cuando el usuario NO interactúa; en /mapa sin arrastre (enableRotate = false cada frame)
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      const globe = globeEl.current;
      const controls = globe?.controls?.();
      if (controls) {
        if (!embedded && 'enableRotate' in controls) {
          (controls as { enableRotate: boolean }).enableRotate = false;
        }
        if (isUserInteractingRef.current) {
          controls.autoRotate = false;
        } else {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.22;
        }
      }
      const now = performance.now();
      const breathing = 0.01 * Math.sin(now * 0.002);
      if (now - lastBreathingUpdateRef.current >= 100) {
        lastBreathingUpdateRef.current = now;
        setAtmosphereBreathingOffset(breathing);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [embedded]);

  useEffect(() => {
    const nextView = activeView === 'historias' ? 'stories' : activeView === 'actualidad' ? 'news' : 'music';
    setView(nextView);
    console.log("[MAPA] view =", nextView, "| activeView =", activeView);
    if (activeView === 'musica') setLiveOverlay(null);
  }, [activeView]);

  /* Parallax suave del panel izquierdo (--px, --py en .parallaxBlock) */
  useEffect(() => {
    const el = document.getElementById("parallaxBlock");
    const sc = document.getElementById("leftScroll");
    if (!el || !sc) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const rect = sc.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", `${nx * 8}px`);
        el.style.setProperty("--py", `${ny * 10}px`);
      });
    };

    sc.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      sc.removeEventListener("mousemove", onMove);
    };
  }, []);

  /** Fuente única: globo y panel solo muestran noticias de este tema. null = Todos. */
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const topicQuery =
    selectedTopicId == null
      ? DEFAULT_NEWS_TOPIC_QUERY
      : (NEWS_TOPIC_GROUPS.find((g) => g.id === selectedTopicId)?.query ?? DEFAULT_NEWS_TOPIC_QUERY);
  const [liveOverlay, setLiveOverlay] = useState<{ embedUrl: string; title: string } | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [exploreQuery, setExploreQuery] = useState('');
  const router = useRouter();

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

      Promise.all([
        loadTex(GLOBE_IMAGE_LOCAL),
        loadTex(GLOBE_IMAGE_DAY_LOCAL),
        loadTex(GLOBE_BUMP_IMAGE)
      ]).then(([nightTex, dayTex, bumpTex]) => {
        const night = nightTex ?? null;
        const day = dayTex ?? null;
        globeNightTexRef.current = night;
        globeDayTexRef.current = day;
        for (const t of [night, day]) {
          if (t) {
            (t as any).colorSpace = (THREE as any).SRGBColorSpace ?? (t as any).colorSpace;
            t.needsUpdate = true;
          }
        }

        // Preferir textura día para ver océanos y tierra (estilo mapa mundi / iPhone)
        const mapTex = day ?? night ?? null;
        const mat = new THREE.MeshPhongMaterial({
          map: mapTex ?? undefined,
          bumpMap: bumpTex ?? undefined,
          bumpScale: bumpTex ? GLOBE_BUMP_SCALE : 0,
          emissive: new THREE.Color(0x0d1520),
          emissiveIntensity: 0.12,
          shininess: 18,
          specular: new THREE.Color(0x1a2a3a)
        });

        if (mat && "opacity" in mat) {
          (mat as any).transparent = true;
          (mat as any).opacity = 0.92;
        }
        setGlobeMaterial(mat);
      });
    });
  }, []);

  // Día/noche según hora del usuario: de día textura clara sin luces; de noche textura con luces de ciudades.
  const showDayGlobe = !isNight;

  // Ajustar material del globo según día/noche (textura, emissiveIntensity, shininess)
  useEffect(() => {
    if (!globeMaterial || !('emissiveIntensity' in globeMaterial)) return;
    const phong = globeMaterial as import('three').MeshPhongMaterial;
    const dayTex = globeDayTexRef.current;
    const nightTex = globeNightTexRef.current;
    if (dayTex) phong.map = showDayGlobe ? dayTex : (nightTex ?? dayTex);
    else if (nightTex) phong.map = nightTex;
    phong.needsUpdate = true;
    phong.emissiveIntensity = showDayGlobe ? 0.12 : 0.22;
    phong.shininess = showDayGlobe ? 18 : 14;
  }, [globeMaterial, showDayGlobe]);

  const stories = useStories();
  const pulses = usePulses(activeView === 'historias');

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

  /** Coordenadas = solo lugar donde ocurrió la noticia (geo/lat/lng). Nunca sede del medio. */
  const getNewsCoords = useCallback((item: NewsItem): { lat: number; lng: number } | null => {
    const lat = item.geo?.lat ?? (item as { lat?: number }).lat ?? null;
    const lng = item.geo?.lng ?? (item as { lng?: number }).lng ?? null;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, []);

  /** Panel → globo: al seleccionar historia o noticia, mover globo al país/ciudad de la noticia. */
  useEffect(() => {
    if (selectedStory && activeView === 'historias') {
      const run = () => {
        if (!globeEl.current) return;
        try {
          globeEl.current.pointOfView({ lat: selectedStory.lat, lng: selectedStory.lng, altitude: 1.55 }, 900);
          setViewCenter({ lat: selectedStory.lat, lng: selectedStory.lng });
        } catch {}
      };
      run();
      const t = setTimeout(run, 100);
      return () => clearTimeout(t);
    }
    if (selectedNews && activeView === 'actualidad') {
      const coords = getNewsCoords(selectedNews);
      if (coords) {
        const run = () => {
          if (!globeEl.current) return;
          try {
            globeEl.current.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 1.8 }, 900);
            setViewCenter(coords);
          } catch {}
        };
        run();
        const t = setTimeout(run, 100);
        return () => clearTimeout(t);
      }
    }
  }, [activeView, selectedStory, selectedNews, getNewsCoords]);

  const flyToNews = useCallback((lat: number, lng: number, altitude = 1.9) => {
    try {
      globeEl.current?.pointOfView({ lat, lng, altitude }, 900);
      setViewCenter({ lat, lng });
    } catch {}
  }, []);

  const fetchNews = useCallback(
    async (topic: string, signal: AbortSignal): Promise<{ items: NewsItem[]; isFallback?: boolean }> => {
      const url = `/api/world?kind=news&topic=${encodeURIComponent(topic)}&limit=20&lang=es`;
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
        }
        const data = (await res.json()) as { items?: unknown[]; isFallback?: boolean; generatedAt?: string };
        const rawItems = Array.isArray(data.items) ? data.items : [];
        const topicLabel = selectedTopicId != null ? NEWS_TOPIC_GROUPS.find((g) => g.id === selectedTopicId)?.label ?? null : null;
        const items: NewsItem[] = rawItems.map((it: unknown) => {
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
          const geo = (() => {
            const g = i.geo as { lat?: number; lng?: number; precision?: string; label?: string; isEventLocation?: boolean } | null | undefined;
            if (g && typeof g.lat === 'number' && typeof g.lng === 'number') return { lat: g.lat, lng: g.lng, label: g.label };
            if (typeof i.lat === 'number' && typeof i.lng === 'number') return { lat: i.lat, lng: i.lng };
            return null;
          })();
          return {
            id: typeof i.id === 'string' ? i.id : '',
            title: rawTitle,
            url: rawUrl,
            source,
            publishedAt: rawPublishedAt,
            sourceCountry: i.sourceCountry != null ? String(i.sourceCountry) : null,
            topicId: selectedTopicId,
            topicLabel,
            outletName: source,
            outletId: null,
            geo,
            lat: geo?.lat ?? null,
            lng: geo?.lng ?? null,
            isPartial,
            topic: typeof i.topic === 'string' ? i.topic : topicLabel ?? 'Actualidad',
          } as NewsItem;
        });
        return { items, isFallback: Boolean(data.isFallback) };
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return { items: [] };
        }
        console.error('[Mapa] fetchNews error:', err);
        throw err;
      }
    },
    [selectedTopicId]
  );

  const {
    loading: newsLoading,
    error: newsError,
    effectiveNewsItems,
    isFallback: newsIsFallback,
    newsPoints,
    newsObjectsForGlobe,
  } = useNewsLayer(selectedTopicId, topicQuery, activeView, fetchNews);
  /** Fuente canónica: en vista actualidad effectiveNewsItems ya incluye fallback si loading/error/vacío. */
  const newsItems = effectiveNewsItems;

  const startNewsTour = useCallback(() => {
    const items = buildNowRoute(newsItems, 8);
    if (!items.length) return;
    const first = items[0];
    const geo = first.geo ?? (first.lat != null && first.lng != null ? { lat: first.lat, lng: first.lng } : null);
    if (geo) flyToNews(geo.lat, geo.lng, 1.9);
    setNewsTour({ items, idx: 0, running: true });
  }, [newsItems, flyToNews]);

  const nextNewsTour = useCallback(() => {
    setNewsTour((prev) => {
      const next = Math.min(prev.idx + 1, prev.items.length - 1);
      const it = prev.items[next];
      const geo = it?.geo ?? (it?.lat != null && it?.lng != null ? { lat: it.lat, lng: it.lng } : null);
      if (geo) flyToNews(geo.lat, geo.lng, 1.9);
      return { ...prev, idx: next };
    });
  }, [flyToNews]);

  const pauseNewsTour = useCallback(() => {
    setNewsTour((prev) => ({ ...prev, running: false }));
  }, []);

  useEffect(() => {
    if (!newsTour.running || newsTour.items.length === 0) return;
    const id = window.setInterval(() => {
      setNewsTour((prev) => {
        const next = prev.idx + 1;
        if (next >= prev.items.length) return { ...prev, running: false };
        const it = prev.items[next];
        const geo = it?.geo ?? (it?.lat != null && it?.lng != null ? { lat: it.lat, lng: it.lng } : null);
        if (geo) flyToNews(geo.lat, geo.lng, 1.9);
        return { ...prev, idx: next };
      });
    }, 6000);
    return () => window.clearInterval(id);
  }, [newsTour.running, newsTour.items.length, flyToNews]);

  const storiesForView: StoryPoint[] = useMemo(() => {
    let list = stories;
    if (exploreQuery.trim()) {
      const q = normalizeQuery(exploreQuery);
      list = list.filter((s) => storySearchHaystack(s).includes(q));
    }
    if (!exploreQuery.trim() && atm?.featuredMoods?.length) {
      const listCopy = [...list];
      listCopy.sort((a, b) => {
        const aMeta = STORIES_MOCK.find((m) => m.id === a.id);
        const bMeta = STORIES_MOCK.find((m) => m.id === b.id);
        const aFeatured = atm.featuredMoods.some((m) => aMeta?.moods?.includes(m as SoundMood));
        const bFeatured = atm.featuredMoods.some((m) => bMeta?.moods?.includes(m as SoundMood));
        if (aFeatured && !bFeatured) return -1;
        if (!aFeatured && bFeatured) return 1;
        return 0;
      });
      return listCopy;
    }
    return list;
  }, [stories, exploreQuery, atm]);

  useEffect(() => {
    storyCountRef.current = storiesForView.length;
  }, [storiesForView]);

  // Abrir historia desde home: ?story=id (click en punto en embedded)
  useEffect(() => {
    const storyId = searchParams.get('story');
    if (!storyId || !storiesForView.length) return;
    const story = storiesForView.find((s) => s.id === storyId);
    if (story) setOpenStory(story);
  }, [searchParams, storiesForView]);

  useEffect(() => {
    const canvas = panelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 72;
    const h = 24;
    canvas.width = w;
    canvas.height = h;
    const ekgPoints = [0, 0, 0, 0, 0, 0.08, 0.15, 0.08, 0, 0, 0, -0.25, 1.0, -0.35, 0, 0, 0.2, 0.3, 0.25, 0.15, 0, 0, 0, 0, 0, 0, 0, 0];
    let animId = 0;
    let time = 0;
    const draw = () => {
      time += 0.015;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(249, 115, 22, 0.5)';
      ctx.shadowBlur = 4;
      const total = ekgPoints.length;
      const offset = (time * 30) % total;
      const midY = h / 2;
      for (let x = 0; x < w; x++) {
        const idx = (Math.floor((x / w) * total) + Math.floor(offset)) % total;
        const val = ekgPoints[idx];
        const y = midY - val * (h * 0.45);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  const storyPulseConfigs = useMemo(() => {
    const map = new Map<string, PulseConfig>();
    storiesForView.forEach((s) => {
      if (s.id) {
        map.set(s.id, getPulseConfig(s as Parameters<typeof getPulseConfig>[0]));
      }
    });
    return map;
  }, [storiesForView]);

  const storyPhaseOffsets = useMemo(() => {
    const map = new Map<string, number>();
    storiesForView.forEach((s) => {
      if (s.id) {
        const hash = s.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        map.set(s.id, (hash % 100) / 100);
      }
    });
    return map;
  }, [storiesForView]);

  const newbornCount = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return storiesForView.filter((s) => {
      const t = (s as unknown as { publishedAt?: string }).publishedAt;
      return t && new Date(t).getTime() > dayAgo;
    }).length;
  }, [storiesForView]);

  const resonatingCount = useMemo(() => {
    return storiesForView.filter((s) => {
      const ss = s as unknown as { lettersCount?: number; inspiredCount?: number };
      return (ss.lettersCount ?? 0) > 0 || (ss.inspiredCount ?? 0) > 0;
    }).length;
  }, [storiesForView]);

  const filteredNewsItems: NewsItem[] = useMemo(() => {
    let list = newsItems;
    if (activeView === 'actualidad' && viewCenter) {
      list = newsItems.filter((n) => {
        const g = n.geo ?? (n.lat != null && n.lng != null ? { lat: n.lat, lng: n.lng } : null);
        if (!g) return true;
        return haversineKm(viewCenter.lat, viewCenter.lng, g.lat, g.lng) <= VIEW_RADIUS_KM;
      });
    }
    if (!exploreQuery.trim()) return list;
    const q = normalizeQuery(exploreQuery);
    return list.filter((item) => normalizeQuery(item.title ?? '').includes(q));
  }, [newsItems, exploreQuery, activeView, viewCenter]);

  /** Solo lugar del hecho (geo). No usar país del medio. */
  const hasNewsLocation = (n: NewsItem) => n.geo != null && Number.isFinite(n.geo.lat) && Number.isFinite(n.geo.lng);
  const newsOnMap = useMemo(() => newsItems.filter(hasNewsLocation), [newsItems]);
  const newsNoLocation = useMemo(() => newsItems.filter((n) => !hasNewsLocation(n)), [newsItems]);

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

  /** En vista Noticias: API o fallback (nunca vacío para evitar regresión de “no se ven”). */


  /** Textura de glow memoizada (1 sola para todos los objetos de noticias). */
  const glowTex = useMemo(() => makeSoftGlowTexture(), []);
  /** Constructor de señal 3D memoizado. */
  const newsThreeObject = useCallback(() => makeNewsSignalObject(glowTex), [glowTex]);

  const musicPointsData = useMemo(
    () =>
      filteredStoriesForMusic.map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        label: s.title,
        placeLabel: s.placeLabel ?? [s.city, s.country].filter(Boolean).join(', '),
        hasText: s.hasText ?? true,
        hasAudio: s.hasAudio ?? false,
        hasVideo: s.hasVideo ?? false,
      })),
    [filteredStoriesForMusic]
  );
  const pointsData: (StoryPoint | RegionPoint | { id: string; lat: number; lng: number; kind: 'news'; title: string; source: string | null; publishedAt: string | null; url: string; weight: number; altitude: number; radius?: number })[] =
    view === 'news' || activeView === 'actualidad'
      ? newsPoints
      : view === 'music'
        ? musicPointsData
        : storiesForView;

  /** Rings para viaje (Sintoniza el Mundo): 8 paradas con maxR; active = currentChapterIndex */
  const journeyRings = useMemo(() => {
    if (view !== 'music' || journey.length === 0) return [];
    return journey.map((s, i) => ({
      lat: s.lat,
      lng: s.lng,
      maxR: 12,
      propagationSpeed: 8,
      repeatPeriod: 1800,
      chapterIndex: i,
    }));
  }, [view, journey]);

  const newsRingsForGlobe = useMemo(() => {
    if ((view !== 'news' && activeView !== 'actualidad') || newsPoints.length === 0) return [];
    const withWeight = newsPoints as Array<{ lat: number; lng: number; id?: string; weight?: number }>;
    const sorted = [...withWeight].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).slice(0, 24);
    return sorted.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      maxR: NEWS_RING_MAX_R,
      propagationSpeed: NEWS_RING_SPEED,
      repeatPeriod: NEWS_RING_PERIOD,
      newsId: typeof p.id === 'string' && p.id.startsWith('news:') ? p.id.slice(5) : undefined,
    }));
  }, [view, activeView, newsPoints]);

  const baseRingsData = useMemo(() => {
    if (view === 'music') return []; // Solo puntos de historias filtradas, sin rings
    if (view === 'news' || activeView === 'actualidad') return newsRingsForGlobe;
    return newsRings;
  }, [view, activeView, newsRings, newsRingsForGlobe]);

  const storyPulseRingsData = useMemo(() => {
    if (activeView !== 'historias') return [];
    return storiesForView
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => {
        const cfg = s.id ? storyPulseConfigs.get(s.id) : null;
        return {
          lat: s.lat,
          lng: s.lng,
          maxR: cfg?.pulseRadius ?? 0.4,
          propagationSpeed: cfg?.speed ?? 0.6,
          repeatPeriod: cfg ? 1000 / cfg.speed : 1800,
          color: (t: number) => {
            const opacity = (cfg?.ringOpacity ?? 0.3) * (1 - t);
            const base = cfg?.color ?? 'rgba(249,115,22,1)';
            return base.replace(/[\d.]+\)$/, `${opacity})`);
          },
        };
      });
  }, [storiesForView, storyPulseConfigs, activeView]);

  const newsPulseRingsData = useMemo(() => {
    if (activeView !== 'actualidad') return [];
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    return filteredNewsItems
      .filter((n) => {
        const t = n.publishedAt ?? (n as { date?: string }).date;
        const lat = n.lat ?? n.geo?.lat;
        const lng = n.lng ?? n.geo?.lng;
        return t && new Date(t).getTime() > sixHoursAgo && lat != null && lng != null;
      })
      .slice(0, 15)
      .map((n) => {
        const cfg = getNewsPulseConfig(n);
        const lat = n.lat ?? n.geo?.lat ?? 0;
        const lng = n.lng ?? n.geo?.lng ?? 0;
        return {
          lat,
          lng,
          maxR: cfg.pulseRadius,
          propagationSpeed: cfg.speed,
          repeatPeriod: 800,
          color: (t: number) => `rgba(96, 165, 250, ${(1 - t) * cfg.ringOpacity})`,
        };
      });
  }, [filteredNewsItems, activeView]);

  /** Huellas invisibles: rings dorados que se expanden y desaparecen (últimos 3 min). */
  const pulseRings = useMemo(() => {
    if (activeView !== 'historias') return [];
    const now = Date.now();
    return pulses
      .filter((p) => {
        if (!p.createdAt) return false;
        const age = now - new Date(p.createdAt).getTime();
        return age < 3 * 60 * 1000;
      })
      .map((p) => {
        const age = now - new Date(p.createdAt!).getTime();
        const fresh = Math.max(0, 1 - age / (3 * 60 * 1000));
        return {
          lat: p.lat,
          lng: p.lng,
          maxR: 0.45,
          propagationSpeed: 0.6,
          repeatPeriod: 4000,
          color: (t: number) => `rgba(251, 191, 36, ${(1 - t) * 0.5 * fresh})`,
        };
      });
  }, [pulses, activeView]);

  const ringsData = useMemo(() => {
    let rings = [...baseRingsData, ...storyPulseRingsData, ...newsPulseRingsData, ...pulseRings];
    if (hovered) {
      rings = [
        ...rings,
        { lat: hovered.lat, lng: hovered.lng, maxR: 8, propagationSpeed: 4, repeatPeriod: 1200, isHover: true },
      ];
    }
    if (activeView === 'actualidad' && selectedNews) {
      const coords = getNewsCoords(selectedNews);
      if (coords) {
        rings = [
          ...rings,
          {
            lat: coords.lat,
            lng: coords.lng,
            maxR: 14,
            propagationSpeed: 6,
            repeatPeriod: 1400,
            isSelectedNews: true,
          },
        ];
      }
    }
    return rings;
  }, [baseRingsData, storyPulseRingsData, newsPulseRingsData, pulseRings, hovered, activeView, selectedNews, getNewsCoords]);

  /** En music mostramos solo puntos de historias filtradas, sin arcos. */
  const journeyArcs = useMemo(() => (view === 'music' ? [] : []), [view]);

  /** Puntos que ve el globo: siempre con lat, lng, altitude y radius para que click/hover funcionen (pointsMerge=false). */
  const pointsForGlobe = useMemo(() => {
    if (view === 'music') {
      return musicPointsData.map((p) => ({ ...p, lat: p.lat, lng: p.lng, altitude: 0.01, radius: 0.22 }));
    }
    return pointsData.map((p) => ({
      ...p,
      lat: (p as { lat?: number }).lat ?? 0,
      lng: (p as { lng?: number }).lng ?? 0,
      altitude: (p as { altitude?: number }).altitude ?? 0.01,
      radius: (p as { kind?: string; radius?: number }).kind === 'news' ? 0.3 : 0.22,
    }));
  }, [view, pointsData, musicPointsData]);

  const goToChapter = useCallback((index: number) => {
    const s = journey[index];
    if (!s || !globeEl.current) return;
    try {
      globeEl.current.pointOfView({ lat: s.lat, lng: s.lng, altitude: 1.55 }, 900);
    } catch {}
    const place = (s.placeLabel ?? [s.city, s.country].filter(Boolean).join(', ')) || '—';
    setStoryLabelTemporary(s.title ?? '—', place, s.id);
    setCurrentChapterIndex(index);
  }, [journey, setStoryLabelTemporary]);

  const nextChapter = useCallback(() => {
    if (journey.length === 0) return;
    const next = (currentChapterIndex + 1) % journey.length;
    goToChapter(next);
  }, [journey, currentChapterIndex, goToChapter]);

  nextChapterRef.current = nextChapter;

  const clearTourTimer = useCallback(() => {
    if (tourTimerRef.current != null) {
      window.clearInterval(tourTimerRef.current);
      tourTimerRef.current = null;
    }
  }, []);

  const pauseTour = useCallback(() => {
    setIsTourPaused(true);
    clearTourTimer();
    // Audio no se toca aquí; se controla con el toggle Sonido ON/OFF
  }, [clearTourTimer]);

  const resumeTour = useCallback(() => {
    setIsTourPaused(false);
    clearTourTimer();
    tourTimerRef.current = window.setInterval(() => nextChapterRef.current(), 8000);
  }, [clearTourTimer]);

  const stopTour = useCallback(() => {
    setIsTourRunning(false);
    setIsTourPaused(false);
    clearTourTimer();
  }, [clearTourTimer]);

  const startTour = useCallback(async () => {
    if (!selectedMood) return;
    setAudioBlocked(false);
    tourUsesMockStoriesRef.current = true;
    const nextJourney = buildJourney(selectedMood, STORIES_MOCK, 8);
    setJourney(nextJourney);
    setCurrentChapterIndex(0);
    setIsTourRunning(true);
    setIsTourPaused(false);
    clearTourTimer();
    tourTimerRef.current = window.setInterval(() => nextChapterRef.current(), 8000);
    if (soundEnabled) void playAmbient();
    const first = nextJourney[0];
    if (first && globeEl.current) {
      try {
        globeEl.current.pointOfView({ lat: first.lat, lng: first.lng, altitude: 1.55 }, 900);
      } catch {}
      const place = (first.placeLabel ?? [first.city, first.country].filter(Boolean).join(', ')) || '—';
      setStoryLabelTemporary(first.title ?? '—', place, first.id);
    }
  }, [selectedMood, soundEnabled, playAmbient, clearTourTimer, setStoryLabelTemporary]);

  const activateAudio = useCallback(() => {
    void playAmbient();
  }, [playAmbient]);

  const pauseResumeTour = useCallback(() => {
    if (isTourPaused) resumeTour();
    else pauseTour();
  }, [isTourPaused, pauseTour, resumeTour]);

  useEffect(() => {
    return () => clearTourTimer();
  }, [clearTourTimer]);

  const pushWithTransition = useCallback((url: string) => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // @ts-ignore
      document.startViewTransition(() => router.push(url));
    } else {
      router.push(url);
    }
  }, [router]);

  const focusNews = useCallback((item: NewsItem) => {
    setSelectedNews(item);
    const coords = getNewsCoords(item);
    if (globeEl.current && coords) {
      try {
        globeEl.current.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 1.8 }, 900);
        setViewCenter(coords);
      } catch {}
    }
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  }, [getNewsCoords]);

  /** Abre el visor encima del mapa (sin navegar). Shot 2: dolly in (900–1400ms). */
  const handleStoryClick = useCallback((story: StoryPoint) => {
    if (!story || story.lat == null || story.lng == null || isOpening) return;
    const lat = story.lat ?? 0;
    const lng = story.lng ?? 0;
    setIsOpening(true);
    setSelectedStory(story);

    try {
      globeEl.current?.pointOfView({ lat, lng, altitude: 1.2 }, 1100);
    } catch {}

    setTimeout(() => {
      setPanelHidden(true);
      setOpenStory(story);
      setIsOpening(false);
    }, 900);
  }, [isOpening]);

  /** Shot 3: return to base orbit (900–1400ms). */
  const handleCloseStory = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setOpenStory(null);
      setPanelHidden(false);
      setIsClosing(false);
      try {
        const base = basePOVRef.current;
        if (base) {
          globeEl.current?.pointOfView(base, 1100);
          setViewCenter({ lat: base.lat, lng: base.lng });
        } else {
          globeEl.current?.pointOfView({ lat: -18, lng: -58, altitude: 2.45 }, 1100);
        }
      } catch {}
    }, 400);
  }, []);

  const handleSelectRelated = useCallback((related: StoryPoint) => {
    setOpenStory(related);
    if (related.lat != null && related.lng != null) {
      try {
        globeEl.current?.pointOfView(
          { lat: related.lat, lng: related.lng, altitude: 1.2 },
          800
        );
      } catch {}
    }
  }, []);

  /** La historia que te eligió: hora + leídas en sesión + atmósfera → una historia. Sin explicación (roadmap 1D). */
  const pickStoryForMe = useCallback((): StoryPoint | null => {
    const readIds = getStoriesReadIds();
    const unread = storiesForView.filter((s) => !readIds.includes(s.id));
    const pool = unread.length > 0 ? unread : storiesForView;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }, [storiesForView]);

  const openJourneyStory = useCallback((index: number) => {
    const s = journey[index];
    if (!s) return;
    goToChapter(index);
    if (!tourUsesMockStoriesRef.current && s.id) {
      const full = storiesForView.find((x) => x.id === s.id) ?? (s as unknown as StoryPoint);
      handleStoryClick(full);
    }
  }, [journey, goToChapter, storiesForView, handleStoryClick]);

  const openStoryFromMusic = useCallback(
    (id: string) => {
      const s = filteredStoriesForMusic.find((x) => x.id === id);
      if (!s) return;
      if (isTourRunning || isTourPaused) pauseTour();
      setAmbientVolumeDuringStory(true);
      handleStoryClick(s as unknown as StoryPoint);
    },
    [filteredStoriesForMusic, isTourRunning, isTourPaused, pauseTour, setAmbientVolumeDuringStory, handleStoryClick]
  );

  const handlePointClick = useCallback((point: object) => {
    const p = point as StoryPoint & { id?: string; newsId?: string; newsIds?: string[]; kind?: string; lat?: number; lng?: number; chapterIndex?: number };
    if (view === 'music' && p?.id) {
      openStoryFromMusic(p.id);
      return;
    }
    if (activeView === 'actualidad') {
      const newsId = typeof p.id === 'string' && p.id.startsWith('news:') ? p.id.slice(5) : (p.newsIds?.[0] ?? p.newsId);
      const newsItem = newsId ? newsItems.find((i) => i.id === newsId) : null;
      if (newsItem) {
        focusNews(newsItem);
        if (p.lat != null && p.lng != null) setViewCenter({ lat: p.lat, lng: p.lng });
      } else if (p.lat != null && p.lng != null && globeEl.current) {
        try {
          globeEl.current.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.8 }, 900);
          setViewCenter({ lat: p.lat, lng: p.lng });
        } catch {}
      }
      return;
    }
    if (activeView === 'historias') {
      handleStoryClick(p as StoryPoint);
    }
  }, [activeView, view, newsItems, focusNews, handleStoryClick, openStoryFromMusic]);

  const handlePointHover = useCallback(
    (point: object | null) => {
      if (!point) {
        setHovered(null);
        setHoverPos(null);
        return;
      }
      const p = point as StoryPoint & { newsIds?: string[]; newsId?: string; chapterIndex?: number; lat?: number; lng?: number; label?: string; placeLabel?: string; hasText?: boolean; hasAudio?: boolean; hasVideo?: boolean };
      const lat = p.lat ?? 0;
      const lng = p.lng ?? 0;
      if (view === 'music' && p?.id) {
        setHovered({
          kind: 'music',
          id: p.id,
          title: p.label ?? 'Historia',
          subtitle: p.placeLabel ?? ([p.city, p.country].filter(Boolean).join(', ') || '—'),
          hasAudio: p.hasAudio,
          hasVideo: p.hasVideo,
          hasText: p.hasText,
          lat,
          lng,
        });
      } else if (activeView === 'actualidad') {
        const newsId = typeof p.id === 'string' && p.id.startsWith('news:') ? p.id.slice(5) : (p.newsIds?.[0] ?? p.newsId);
        const item = newsId ? newsItems.find((i) => i.id === newsId) : null;
        setHovered({
          kind: 'news',
          id: item?.id ?? newsId ?? '',
          title: item?.title?.trim()?.slice(0, 60) ?? (p as { title?: string }).title?.slice(0, 60) ?? 'Noticia',
          subtitle: item ? `${item.source ?? '—'} · ${formatTimeAgoFromNow(item.publishedAt ?? null, Date.now())}` : '—',
          lat,
          lng,
          url: item?.url ?? undefined,
        });
      } else {
        const sp = p as StoryPoint;
        setHovered({
          kind: 'stories',
          id: sp.id ?? '',
          title: sp.label ?? 'Historia',
          subtitle: [sp.city, sp.country].filter(Boolean).join(', ') || '—',
          hasAudio: Boolean(sp.audioUrl),
          hasVideo: Boolean(sp.videoUrl),
          hasText: Boolean(sp.body || sp.description),
          lat,
          lng,
        });
      }
      setHoverPos(hoverPosRef.current);
    },
    [activeView, view, newsItems]
  );

  /** Click en objeto 3D de noticia: abre link oficial. */
  const handleObjectClick = useCallback((obj: object) => {
    const item = obj as NewsItem;
    if (item?.url && typeof item.url === 'string') {
      try {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      } catch {}
    }
  }, []);

  /** Hover en objeto 3D de noticia: mismo tooltip que puntos. */
  const handleObjectHover = useCallback(
    (obj: object | null) => {
      if (!obj) {
        setHovered(null);
        setHoverPos(null);
        return;
      }
      const item = obj as NewsItem;
      const lat = item.geo?.lat ?? item.lat ?? 0;
      const lng = item.geo?.lng ?? item.lng ?? 0;
      setHovered({
        kind: 'news',
        id: item.id ?? '',
        title: (item.title ?? '').trim().slice(0, 60) || 'Noticia',
        subtitle: `${item.source ?? '—'} · ${formatTimeAgoFromNow(item.publishedAt ?? null, Date.now())}`,
        lat,
        lng,
        url: item.url ?? undefined,
      });
      setHoverPos(hoverPosRef.current);
    },
    []
  );

  /** Arcos constelación: activo (currentChapterIndex) naranja brillante, resto blanco tenue. Alpha con beatPhase. */
  const arcColorFn = useCallback(
    (d: { startIndex?: number }) => {
      const active = typeof d?.startIndex === 'number' && d.startIndex === currentChapterIndex;
      const alpha = active ? 0.85 + 0.15 * beatPhase : 0.22;
      return active ? `rgba(249,115,22,${alpha})` : `rgba(255,255,255,${alpha})`;
    },
    [currentChapterIndex, beatPhase]
  );

  const ringColorFn = useCallback((d: { newsId?: string; chapterIndex?: number; isHover?: boolean; isSelectedNews?: boolean; color?: (t: number) => string }) => {
    if (d && typeof d.color === 'function') return d.color;
    if ((d as { isHover?: boolean }).isHover) {
      return () => 'rgba(255,200,120,0.35)';
    }
    if ((d as { isSelectedNews?: boolean }).isSelectedNews) {
      return (t: number) => {
        const u = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
        const alpha = Math.max(0.5, 0.95 * (1 - u));
        return `rgba(255,220,120,${alpha})`;
      };
    }
    if (view === 'music' && typeof d?.chapterIndex === 'number') {
      const active = d.chapterIndex === currentChapterIndex;
      const baseAlpha = active ? 0.85 : 0.3;
      const beat = beatPhase;
      const beatMul = 0.88 + 0.12 * beat;
      return (t: number) => {
        const u = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
        const alpha = Math.max(0, Math.min(1, baseAlpha * (1 - u) * beatMul));
        return active ? `rgba(249,115,22,${alpha})` : `rgba(255,255,255,${alpha})`;
      };
    }
    const baseAlpha = selectedNews?.id === d?.newsId ? 0.8 : 0.25;
    return (t: number) => {
      const u = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
      const alpha = Math.max(0, Math.min(1, baseAlpha * (1 - u)));
      return activeView === 'actualidad' ? `rgba(255,140,0,${alpha})` : `rgba(255,255,255,${alpha})`;
    };
  }, [activeView, view, currentChapterIndex, selectedNews?.id, beatPhase]);

  const pointRadiusFn = useCallback((point: object) => {
    const p = point as { id?: string; kind?: string };
    if (view === 'music') return 0.22;
    if (p.kind === 'news' || (typeof p.id === 'string' && p.id.startsWith('news:'))) {
      return 0.18;
    }
    if (p.kind === 'letter') return 0.14;
    if (p.id && storyPulseConfigs.has(p.id)) {
      const cfg = storyPulseConfigs.get(p.id)!;
      const phase = storyPhaseOffsets.get(p.id) ?? 0;
      const pf = calcPulseFactor(pulseTimeRef.current, cfg.speed, phase);
      const pulseAmt = pf * (cfg.pulseRadius - cfg.baseRadius);
      return cfg.baseRadius + pulseAmt * 0.3;
    }
    return 0.2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, storyPulseConfigs, storyPhaseOffsets, pulseFrame]);

  const pointColorFn = useCallback((point: object) => {
    const p = point as { id?: string; kind?: string; newsIds?: string[]; newsId?: string };
    if (view === 'music') {
      if (p.id === highlightedStoryId) return 'rgba(255,200,100,0.98)';
      const active = typeof (p as { chapterIndex?: number }).chapterIndex === 'number' && (p as { chapterIndex?: number }).chapterIndex === currentChapterIndex;
      return active ? 'rgba(249,140,60,0.95)' : 'rgba(249,115,22,0.6)';
    }
    const ids = typeof p?.id === 'string' && p.id.startsWith('news:') ? [p.id.slice(5)] : (p?.newsIds ?? (p?.newsId ? [p.newsId] : []));
    if (ids.length > 0) {
      const isSelected = selectedNews && ids.includes(selectedNews.id);
      if (isSelected) return 'rgba(255,180,80,0.98)';
      return 'rgba(96, 165, 250, 0.75)';
    }
    if (p.kind === 'letter') return 'rgba(251,191,36,0.75)';
    if (p.id && storyPulseConfigs.has(p.id)) {
      const cfg = storyPulseConfigs.get(p.id)!;
      if (p.id === highlightedStoryId) return 'rgba(255, 220, 100, 1.0)';
      return cfg.color;
    }
    return atm?.glowColor ?? 'rgba(249,115,22,0.85)';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentChapterIndex, selectedNews?.id, highlightedStoryId, atm, storyPulseConfigs, pulseFrame]);


  /** Toggle sonido ambiente (vista music): persiste en localStorage. OFF corta audio al instante; ON inicia ambient con el mood actual. */
  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      window.localStorage.setItem('almamundi_sound_enabled', String(next));
    } catch {}
    if (!next) {
      setAudioBlocked(false);
      stopAmbient();
      return;
    }
    if (selectedMood) void playAmbient();
    else void playAmbientDirect('universo');
  }, [soundEnabled, selectedMood, stopAmbient, playAmbient, playAmbientDirect]);

  /** En home: animación "el globo viene de atrás" solo una vez al entrar al Universe */
  const globeEntrancePlayedRef = useRef(false);

  const handleGlobeReady = useCallback((initialPOV: { lat: number; lng: number; altitude: number }) => {
    if (!globeEl.current) return;
    setGlobeReady(true);
    try {
      const controls = globeEl.current.controls();
      controls.enableZoom = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.22;
      if ('enableRotate' in controls) {
        (controls as { enableRotate: boolean }).enableRotate = embedded;
      }
      const nearPOV = { lat: 0, lng: -30, altitude: 1.2 };
      basePOVRef.current = embedded ? { ...nearPOV } : { ...initialPOV };
      setViewCenter({ lat: nearPOV.lat, lng: nearPOV.lng });

      if (embedded) {
        globeEl.current.pointOfView({ lat: 0, lng: -30, altitude: 3.0 }, 0);
      } else {
        globeEl.current.pointOfView(initialPOV, 0);
      }
      if (embedded) {
        controls.addEventListener('start', () => {
          isUserInteractingRef.current = true;
          controls.autoRotate = false;
          window.clearTimeout((window as unknown as { __cineResumeTimeout?: number }).__cineResumeTimeout);
          (window as unknown as { __cineResumeTimeout?: number }).__cineResumeTimeout = window.setTimeout(() => {
            if (globeEl.current) {
              try {
                globeEl.current.controls().autoRotate = true;
              } catch {}
            }
          }, 15000);
        });
        controls.addEventListener('end', () => {
          setTimeout(() => {
            isUserInteractingRef.current = false;
          }, 800);
        });
      }

      // Reemplazar luces y agregar capa de nubes (después de que MapCanvas haya montado la escena)
      setTimeout(() => {
        const scene = globeEl.current?.scene?.() as THREE.Scene | undefined;
        if (!scene) return;
        try {
          scene.background = null;
          const renderer = globeEl.current?.renderer?.() as THREE.WebGLRenderer | undefined;
          if (renderer) {
            renderer.setClearColor(0x000000, 0);
            if (typeof renderer.setClearAlpha === 'function') renderer.setClearAlpha(0);
            const canvas = renderer.domElement as HTMLCanvasElement;
            if (canvas) canvas.style.background = 'transparent';
          }
          // Reemplazar luces existentes por la nueva iluminación
          ['AM_LIGHT', 'KEY_LIGHT', 'FILL_LIGHT', 'RIM_LIGHT'].forEach((name) => {
            const obj = scene.getObjectByName(name);
            if (obj) scene.remove(obj);
          });
          const ambientLight = new THREE.AmbientLight(0x446644, 0.5);
          ambientLight.name = 'AM_LIGHT';
          scene.add(ambientLight);
          const sunLight = new THREE.DirectionalLight(0xffeed8, 0.95);
          sunLight.name = 'KEY_LIGHT';
          sunLight.position.set(-2, 1.5, 1);
          scene.add(sunLight);
          const fillLight = new THREE.DirectionalLight(0x2244aa, 0.12);
          fillLight.name = 'FILL_LIGHT';
          fillLight.position.set(2, -1, -1);
          scene.add(fillLight);
          const rimLight = new THREE.DirectionalLight(0x80b0dd, 0.14);
          rimLight.name = 'RIM_LIGHT';
          rimLight.position.set(0, 0, -3);
          scene.add(rimLight);

          // Capa de nubes (estilo mapa mundi / iPhone)
          const cloudGeo = new THREE.SphereGeometry(1.004, 64, 64);
          const cloudLoader = new THREE.TextureLoader();
          cloudLoader.load(
            '/textures/earth-clouds.png',
            (cloudTex) => {
              if (cloudTex && cloudMeshRef.current === null) {
                (cloudTex as any).colorSpace = (THREE as any).SRGBColorSpace ?? (cloudTex as any).colorSpace;
                const cloudMat = new THREE.MeshPhongMaterial({
                  map: cloudTex,
                  transparent: true,
                  opacity: 0.68,
                  depthWrite: false,
                });
                const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
                scene.add(cloudMesh);
                cloudMeshRef.current = cloudMesh;
              }
            },
            undefined,
            () => { /* fallback silencioso si no hay textura */ }
          );
        } catch (err) {
          console.error('handleGlobeReady lights/clouds failed', err);
        }
      }, 200);
    } catch (e) {
      console.error('handleGlobeReady failed', e);
    }
  }, [globeEl, embedded]);

  const handleResetView = useCallback(() => {
    const base = basePOVRef.current;
    if (base && globeEl.current) {
      try {
        globeEl.current.pointOfView(base, 1200);
        setViewCenter({ lat: base.lat, lng: base.lng });
      } catch {}
    }
  }, []);

  const handleDockModeChange = useCallback((mode: MapDockMode) => {
    if (embedded && !universeVisible) return; // no abrir drawer cuando el usuario está arriba (hero)
    if (mode === 'stories' || mode === 'search') setActiveView('historias');
    else if (mode === 'news') setActiveView('actualidad');
    else if (mode === 'sounds') setActiveView('musica');
    setDrawerMode(mode);
    setDrawerOpen((prev) => (prev && drawerMode === mode ? false : true));
  }, [drawerMode, embedded, universeVisible]);

  /** Centrar el globo en la ubicación del usuario (ej. Tunquén). Actualiza base orbit para return-to-base. */
  useEffect(() => {
    if (!globeReady || !globeEl.current) return;
    getApproxLocation().then((loc) => {
      if (!loc || !globeEl.current) return;
      try {
        const pov = { lat: loc.lat, lng: loc.lng, altitude: 1.8 };
        globeEl.current.pointOfView(pov, 1200);
        basePOVRef.current = pov;
        setViewCenter({ lat: loc.lat, lng: loc.lng });
      } catch {}
    });
  }, [globeReady]);

  useEffect(() => {
    if (activeView !== 'actualidad') {
      setSelectedNews(null);
      setNewsTour((prev) => (prev.running ? { ...prev, running: false } : prev));
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView !== 'historias') {
      setSelectedStory(null);
      setSelectedTopic(null);
    }
  }, [activeView]);

  /* Responsive */
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const historiasProps = {
    stories: storiesForView,
    exploreQuery,
    onExploreQueryChange: setExploreQuery,
    onStoryFocus: handleStoryClick,
    highlightedStoryId,
  };
  const noticiasProps = {
    news: filteredNewsItems,
    selectedTopicId,
    onTopicIdChange: setSelectedTopicId,
    onNewsFocus: focusNews,
    selectedNews,
  };
  const sonidosProps = {
    currentMood: selectedMood ?? 'universo',
    onMoodChange: (m: string) => {
      setSelectedMood(m as SoundMood);
      setSoundEnabled(true);
      void playAmbientDirect(m as SoundMood);
    },
    soundEnabled,
    onToggleSound: () => setSoundEnabled((v) => !v),
  };

  /** Altura reservada arriba en /mapa: barra con logo + frase (y safe-area). El globo no cubre esta franja. */
  const MAP_TOP_BAR_PX = 96;

  return (
    <div
      data-build="mapa-v1"
      style={{
        ...(embedded
          ? { position: 'relative', width: '100%', height: '100%', minHeight: 0, overflow: 'hidden', background: '#0F172A', fontFamily: APP_FONT, paddingRight: 32, paddingTop: 0, paddingBottom: '120px' }
          : { position: 'fixed', inset: 0, width: '100vw', height: '100dvh', maxHeight: '100vh', overflow: 'hidden', background: '#0F172A', fontFamily: APP_FONT, paddingBottom: '120px' }),
      }}
    >
      {!embedded && (
        <header
          className="flex items-center justify-between px-4 md:px-6 w-full z-[60] border-b border-white/10"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            minHeight: 72,
            paddingTop: 'env(safe-area-inset-top, 16px)',
            paddingBottom: 12,
            background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(15,23,42,0.92) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <a href="/" className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="AlmaMundi" className="h-12 md:h-14 w-auto object-contain select-none flex-shrink-0" />
            <span className="text-white/95 font-semibold text-lg md:text-xl truncate">
              Mapa de AlmaMundi
            </span>
          </a>
          <a
            href="/"
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            Inicio
          </a>
        </header>
      )}
      <style jsx global>{globalStyles}</style>
      <style jsx global>{`
  :root{
    --glass-bg: rgba(255,255,255,0.06);
    --glass-bg-strong: rgba(255,255,255,0.10);
    --glass-border: rgba(255,255,255,0.14);
    --glass-border-strong: rgba(255,255,255,0.22);
    --glass-text: rgba(255,255,255,0.92);
    --glass-text-dim: rgba(255,255,255,0.70);
    --glass-shadow: 0 16px 40px rgba(0,0,0,0.35);
  }

  .lg-card{
    background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-radius: 22px;
  }

  .lg-card-inner{
    border-radius: 18px;
    background: radial-gradient(120% 140% at 10% 10%, rgba(255,255,255,0.08), transparent 55%),
                radial-gradient(120% 140% at 90% 30%, rgba(90,160,255,0.10), transparent 55%),
                radial-gradient(120% 140% at 35% 110%, rgba(255,140,70,0.10), transparent 55%);
  }

  /* ===== Liquid Glass Pill (small, harmonic) ===== */
  .lg-pill{
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    /* tamaño tipo referencia */
    height: 44px;
    padding: 0 18px;
    border-radius: 999px;

    color: rgba(255,255,255,0.92);
    font-weight: 600;
    letter-spacing: 0.2px;

    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);

    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);

    box-shadow:
      0 10px 22px rgba(0,0,0,0.22),
      inset 0 1px 0 rgba(255,255,255,0.22),
      inset 0 -10px 18px rgba(0,0,0,0.25);

    transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
    user-select: none;
  }

  /* borde iridiscente fino */
  .lg-pill::before{
    content:"";
    position:absolute;
    inset:-1px;
    border-radius: 999px;
    padding: 1px;
    background: linear-gradient(135deg,
      rgba(255,255,255,0.26),
      rgba(130,210,255,0.20),
      rgba(255,170,120,0.18),
      rgba(255,255,255,0.18)
    );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events:none;
    opacity: 0.85;
  }

  /* highlight superior (bisel vidrio) */
  .lg-pill::after{
    content:"";
    position:absolute;
    left: 10px;
    right: 10px;
    top: 6px;
    height: 44%;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(255,255,255,0.30), rgba(255,255,255,0.02));
    pointer-events:none;
    opacity: 0.75;
  }

  .lg-pill:hover{
    transform: translateY(-1px);
    background: rgba(255,255,255,0.11);
    border-color: rgba(255,255,255,0.22);
    box-shadow:
      0 14px 30px rgba(0,0,0,0.26),
      inset 0 1px 0 rgba(255,255,255,0.26),
      inset 0 -10px 18px rgba(0,0,0,0.22);
  }

  .lg-pill:active{
    transform: translateY(0px) scale(0.99);
  }

  /* ===== Primary (naranja vivo, sombra limpia, menos neumo) ===== */
  .lg-pill-primary{
    color: #fff;
    background: linear-gradient(180deg,
      color-mix(in srgb, var(--accent2) 95%, white),
      color-mix(in srgb, var(--accent) 88%, white)
    );
    border: 1px solid color-mix(in srgb, var(--accent2) 90%, white);
    box-shadow:
      0 10px 28px rgba(0,0,0,0.22),
      0 0 40px color-mix(in srgb, var(--accent) 35%, transparent),
      inset 0 1px 0 rgba(255,255,255,0.4);
  }

  .lg-pill-primary:hover{
    background: linear-gradient(180deg,
      color-mix(in srgb, var(--accent2) 98%, white),
      color-mix(in srgb, var(--accent) 92%, white)
    );
    border-color: #fff;
    box-shadow:
      0 12px 32px rgba(0,0,0,0.26),
      0 0 48px color-mix(in srgb, var(--accent) 45%, transparent),
      inset 0 1px 0 rgba(255,255,255,0.5);
  }

  .lg-input{
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    color: var(--glass-text);
    border-radius: 999px;
    padding: 12px 14px;
    outline: none;
    box-shadow: 0 10px 26px rgba(0,0,0,0.22);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .lg-input::placeholder{
    color: rgba(255,255,255,0.45);
  }

  /* ===== layout card camera: title + CTA inline ===== */
  .lg-card-titleRow{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 14px;
  }

  .lg-title{
    color: rgba(255,255,255,0.95);
    font-size: 16px;
    font-weight: 650;
    line-height: 1.15;
    letter-spacing: 0.2px;
  }

  .lg-sub{
    color: rgba(255,255,255,0.70);
    font-size: 13px;
    line-height: 1.25;
  }

  .lg-sub-dim{
    color: rgba(255,255,255,0.55);
    font-size: 13px;
    line-height: 1.25;
  }

  /* ===== search: sin placeholder visible ===== */
  .lg-input.no-placeholder::placeholder{
    color: transparent;
  }
`}</style>

      {!embedded && <UniverseBackground />}
      <AtmosphereOverlay soundEnabled={soundEnabled} hourOverride={hourOverride} embedded={embedded} />

      {/* Overlay oscuro sobre el globo — clic cierra el visor (absolute en home dentro del Universe) */}
      <div
        aria-hidden
        style={{
          position: embedded ? 'absolute' : 'fixed',
          inset: 0,
          zIndex: 20,
          background: 'rgba(5, 8, 18, 0.75)',
          backdropFilter: 'blur(4px)',
          pointerEvents: openStory ? 'auto' : 'none',
          opacity: openStory ? 1 : 0,
          transition: 'opacity 600ms ease',
        }}
        onClick={handleCloseStory}
      />

      {/* Botón flotante "La historia que te eligió" (absolute en home dentro del Universe) */}
      {activeView === 'historias' && storiesForView.length > 0 && !openStory && (
        <div
          style={{
            position: embedded ? 'absolute' : 'fixed',
            bottom: 24,
            right: isMobile ? 20 : 28,
            zIndex: 15,
          }}
        >
          <button
            type="button"
            onClick={() => {
              const picked = pickStoryForMe();
              if (picked) handleStoryClick(picked);
            }}
            className="px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white/95 font-medium text-sm hover:bg-white/15 hover:border-white/30 transition shadow-lg backdrop-blur-md"
          >
            Déjame sorprender
          </button>
        </div>
      )}

      {/* ── BOTÓN FLOTANTE — liquid glass naranja (absolute en home dentro del Universe) ═════ */}
      {!openStory && (
        <button
          type="button"
          onClick={() => router.push('/#historias')}
          style={{
            position: embedded ? 'absolute' : 'fixed',
            bottom: 28,
            right: isMobile ? 20 : 28,
            zIndex: 15,
            padding: '15px 32px',
            fontSize: 15,
            fontFamily: "'Avenir Light', Avenir, sans-serif",
            color: '#fff',
            cursor: 'pointer',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            letterSpacing: '0.01em',
            transition: 'all 250ms ease',
            borderRadius: 999,
            background: 'linear-gradient(180deg, rgba(249,115,22,0.30) 0%, rgba(249,115,22,0.20) 100%)',
            backdropFilter: 'blur(24px) saturate(220%)',
            WebkitBackdropFilter: 'blur(24px) saturate(220%)',
            border: '1px solid rgba(255,155,60,0.50)',
            boxShadow: `
              inset 0 2px 0 rgba(255,200,80,0.55),
              inset 0 -1.5px 0 rgba(180,55,0,0.35),
              inset 1px 0 0 rgba(255,165,60,0.15),
              0 0 28px rgba(249,115,22,0.30),
              0 12px 40px rgba(0,0,0,0.45),
              0 4px 12px rgba(249,115,22,0.20)
            `,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, rgba(249,115,22,0.40) 0%, rgba(249,115,22,0.28) 100%)';
            e.currentTarget.style.boxShadow = `
              inset 0 2px 0 rgba(255,210,90,0.65),
              inset 0 -1.5px 0 rgba(180,55,0,0.35),
              0 0 40px rgba(249,115,22,0.45),
              0 12px 40px rgba(0,0,0,0.45)
            `;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, rgba(249,115,22,0.30) 0%, rgba(249,115,22,0.20) 100%)';
            e.currentTarget.style.boxShadow = `
              inset 0 2px 0 rgba(255,200,80,0.55),
              inset 0 -1.5px 0 rgba(180,55,0,0.35),
              0 0 28px rgba(249,115,22,0.30),
              0 12px 40px rgba(0,0,0,0.45)
            `;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Anímate a contar tu historia
        </button>
      )}

      {/* Drawer: inline dentro del Universe (absolute, no fixed). Full page: navbar flotante transparente (z-50), globo a pantalla completa */}
      {!embedded && (
          <>
            <MapTopControls soundEnabled={soundEnabled} onToggleSound={toggleSound} topOffset={MAP_TOP_BAR_PX + 8} navbarZIndex={50} />
            <MapDock
              activeMode={drawerMode === 'search' ? 'search' : activeView === 'historias' ? 'stories' : activeView === 'actualidad' ? 'news' : 'sounds'}
              onModeChange={handleDockModeChange}
              onResetView={handleResetView}
              drawerOpen={drawerOpen}
              topOffset={MAP_TOP_BAR_PX + 8}
              navbarZIndex={50}
            />
            <MapDrawer
              open={drawerOpen}
              mode={drawerMode}
              onClose={() => setDrawerOpen(false)}
              isMobile={isMobile}
            >
              {drawerMode === 'stories' || drawerMode === 'search' ? (
                <StoriesPanel
                  {...historiasProps}
                  onContarMiHistoria={() => {
                    setDrawerOpen(false);
                    router.push('/#historias');
                  }}
                />
              ) : drawerMode === 'news' ? (
                <NewsPanel {...noticiasProps} />
              ) : (
                <SoundsPanel {...sonidosProps} />
              )}
            </MapDrawer>
          </>
        )}

      {/* Panel izquierdo oculto (lógica intacta; UI reemplazada por Dock + Drawer) */}
      {false && (
      <aside style={{
        position:             'fixed',
        top:                   20,
        left:                  20,
        bottom:                20,
        width:                'clamp(300px, 26vw, 360px)',
        zIndex:                10,
        display:              'flex',
        flexDirection:        'column',
        padding:              '24px 18px',
        gap:                   14,
        overflowY:            'auto',
        overflowX:            'hidden',
        scrollbarWidth:       'none',
        borderRadius:          24,
        background:           'rgba(15, 25, 60, 0.55)',
        backdropFilter:       'blur(48px) saturate(180%)',
        WebkitBackdropFilter: 'blur(48px) saturate(180%)',
        border:               '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: `
          inset 0 1.5px 0 rgba(255, 255, 255, 0.28),
          inset 1px 0 0 rgba(255, 255, 255, 0.08),
          0 32px 64px rgba(0, 0, 0, 0.60),
          0 8px 24px rgba(0, 0, 0, 0.40)
        `,
      }}>

        {/* Reflejo diagonal — como la imagen roja */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, left: 0,
          width: '75%', height: '40%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%)',
          borderRadius: '28px 0 0 0',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Línea de luz superior — el highlight más importante */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, left: '6%', right: '6%', height: 1.5,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0.55) 65%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Contenido encima */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '26px 20px 20px',
          gap: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}>

          {/* ── SONIDO DEL UNIVERSO: cortar/activar arriba de la franja ─── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, flexShrink: 0 }}>
            <button
              type="button"
              onClick={toggleSound}
              title={soundEnabled ? 'Cortar sonido del universo' : 'Activar sonido del universo'}
              aria-label={soundEnabled ? 'Cortar sonido' : 'Activar sonido'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                background: soundEnabled ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.06)',
                color: soundEnabled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 200ms ease',
              }}
            >
              {soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
          </div>

          {/* ── LOGO ──────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 20, flexShrink: 0 }}>
            <p style={{
              fontSize: 28,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.97)',
              margin: '0 0 3px',
              letterSpacing: '-0.025em',
              fontFamily: "'Avenir Light', Avenir, sans-serif",
              lineHeight: 1,
            }}>
              AlmaMundi
            </p>
            <p style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.32)',
              margin: 0,
              fontFamily: "'Avenir Light', Avenir, sans-serif",
              letterSpacing: '0.05em',
            }}>
              Historias que importan
            </p>
          </div>

          {/* ── SEPARADOR ────────────────────────────────────────────── */}
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)',
            marginBottom: 20,
            flexShrink: 0,
          }} />

          {/* ── TABS — liquid glass naranja de alta calidad ───────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 4,
            marginBottom: 20,
            padding: '4px',
            borderRadius: 16,
            background: 'rgba(0,0,0,0.28)',
            border: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}>
            {[
              { id: 'historias',  label: 'Historias' },
              { id: 'musica',     label: 'Sonidos'   },
              { id: 'actualidad', label: 'Noticias'  },
            ].map(tab => {
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id as typeof activeView)}
                  style={isActive ? {
                    padding:        '11px 6px',
                    borderRadius:    12,
                    cursor:         'pointer',
                    fontSize:        14,
                    fontFamily:     "'Avenir Light', Avenir, sans-serif",
                    outline:        'none',
                    WebkitTapHighlightColor: 'transparent',
                    transition:     'all 220ms ease',
                    color:          '#ffffff',
                    background:     'linear-gradient(180deg, rgba(249,115,22,0.32) 0%, rgba(249,115,22,0.18) 100%)',
                    border:         '1px solid rgba(255, 150, 50, 0.50)',
                    boxShadow: `
                      inset 0 1.5px 0 rgba(255, 190, 80, 0.50),
                      inset 0 -1px 0 rgba(160, 50, 0, 0.30),
                      0 0 16px rgba(249, 115, 22, 0.20),
                      0 4px 12px rgba(0, 0, 0, 0.30)
                    `,
                  } : {
                    padding:        '11px 6px',
                    borderRadius:    12,
                    cursor:         'pointer',
                    fontSize:        14,
                    fontFamily:     "'Avenir Light', Avenir, sans-serif",
                    outline:        'none',
                    WebkitTapHighlightColor: 'transparent',
                    transition:     'all 220ms ease',
                    color:          'rgba(255,255,255,0.38)',
                    background:     'transparent',
                    border:         '1px solid transparent',
                    boxShadow:      'none',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── DESCRIPCIÓN SEGÚN VISTA — explica qué hace el mapa ───── */}
          <div style={{ marginBottom: 16, flexShrink: 0 }}>
            {activeView === 'historias' && (
              <>
                <p style={{
                  fontSize: 18,
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.90)',
                  margin: '0 0 5px',
                  lineHeight: 1.3,
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}>
                  Alguien, en algún lugar, vivió esto.
                </p>
                <p style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.38)',
                  margin: 0,
                  lineHeight: 1.55,
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}>
                  En video, audio, texto o fotos. Toca un punto para conocer la historia.
                </p>
              </>
            )}
            {activeView === 'actualidad' && (
              <>
                <p style={{
                  fontSize: 18,
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.90)',
                  margin: '0 0 5px',
                  lineHeight: 1.3,
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}>
                  El mundo no para.
                </p>
                <p style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.38)',
                  margin: 0,
                  lineHeight: 1.55,
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}>
                  Toca una noticia y el mapa te lleva ahí.
                </p>
              </>
            )}
            {activeView === 'musica' && (
              <>
                <p style={{
                  fontSize: 18,
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.90)',
                  margin: '0 0 5px',
                  lineHeight: 1.3,
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}>
                  Otra forma de encontrar historias.
                </p>
                <p style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.38)',
                  margin: 0,
                  lineHeight: 1.55,
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}>
                  Elige un sonido y el mapa te muestra las historias que viven en él.
                </p>
              </>
            )}
          </div>

          {/* ── CONTENIDO ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {activeView === 'historias' && <HistoriasPanel {...historiasProps} />}
            {activeView === 'actualidad' && <NoticiasPanel {...noticiasProps} />}
            {activeView === 'musica' && <SonidosPanel {...sonidosProps} />}
          </div>

        </div>
      </aside>
      )}

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
            setSelectedStory(story as StoryPoint);
            setSelectedTopic(null);
            setActiveView('historias');
            handleStoryClick(story as StoryPoint);
          }}
          onClearTopic={() => setSelectedTopic(null)}
          exploreQuery={exploreQuery}
          onExploreQueryChange={setExploreQuery}
        />
      )}

      {openStory && (
        <StoryViewer
          story={openStory}
          onClose={handleCloseStory}
          isClosing={isClosing}
          onSelectRelated={handleSelectRelated}
        />
      )}

      {storyModalOpen && (
        <div
          style={{
            position: embedded ? 'absolute' : 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(10px)',
          }}
          onClick={() => setStoryModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(400px, 90vw)',
              padding: '28px 24px',
              borderRadius: 22,
              background: 'rgba(8,12,25,0.95)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(40px)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
            }}
          >
            <p
              style={{
                fontSize: 18,
                fontWeight: 300,
                color: 'rgba(255,255,255,0.90)',
                margin: '0 0 8px',
                fontFamily: "'Avenir Light', Avenir, sans-serif",
              }}
            >
              Escribe. Anímate. Cuenta una historia.
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.40)',
                margin: '0 0 20px',
                fontFamily: "'Avenir Light', Avenir, sans-serif",
                lineHeight: 1.5,
              }}
            >
              Elige cómo quieres contarla: video, audio, texto o foto.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStoryModalOpen(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoryModalOpen(false);
                  router.push('/#historias');
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: 999,
                  background: 'rgba(249,115,22,0.18)',
                  border: '1px solid rgba(249,115,22,0.35)',
                  color: '#fdba74',
                  cursor: 'pointer',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: "'Avenir Light', Avenir, sans-serif",
                }}
              >
                Ir a las 4 formas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UniverseStage (CAPA C): contenedor único, fondo oscuro; globo a full; Dock/controles/drawer DENTRO como overlay */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 0,
          zIndex: 10,
          background: embedded ? '#0f172a' : undefined,
        }}
      >
        {/* DOCK MUST LIVE INSIDE UNIVERSE STAGE (never in the gradient/transition area) */}
        {embedded && (
          <>
            <div className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 z-30 flex justify-center w-full [&>*]:pointer-events-auto pointer-events-none">
              <div className="max-w-[980px] w-[min(980px,calc(100vw-48px))]">
                <MapDock
                activeMode={drawerMode === 'search' ? 'search' : activeView === 'historias' ? 'stories' : activeView === 'actualidad' ? 'news' : 'sounds'}
                onModeChange={handleDockModeChange}
                onResetView={handleResetView}
                drawerOpen={drawerOpen}
                embedded
              />
              </div>
            </div>
            <div className="absolute top-6 md:top-8 right-6 z-30">
              <MapTopControls soundEnabled={soundEnabled} onToggleSound={toggleSound} embedded />
            </div>
            <MapDrawer
              open={drawerOpen}
              mode={drawerMode}
              onClose={() => setDrawerOpen(false)}
              isMobile={isMobile}
            >
              {drawerMode === 'stories' || drawerMode === 'search' ? (
                <StoriesPanel
                  {...historiasProps}
                  onContarMiHistoria={() => {
                    setDrawerOpen(false);
                    router.push('/#historias');
                  }}
                />
              ) : drawerMode === 'news' ? (
                <NewsPanel {...noticiasProps} />
              ) : (
                <SoundsPanel {...sonidosProps} />
              )}
            </MapDrawer>
          </>
        )}

      {/* Globo: full page usa GlobeView con bottomReservePx para no tapar la frase y no cortar la esfera arriba */}
      <div
        style={
          embedded
            ? { position: 'absolute', inset: 0, zIndex: 10 }
            : { position: 'absolute', top: 0, left: 24, right: 24, bottom: 0, zIndex: 10 }
        }
      >
      <MapCanvas
        panelWidth={0}
        embedded={embedded}
        bottomReservePx={embedded ? undefined : 200}
        topReservePx={embedded ? undefined : MAP_TOP_BAR_PX}
        globeRef={globeEl}
        onGlobeReady={handleGlobeReady}
        stageClassName="globeStage mapLeftStage w-full h-full min-w-0 min-h-0 isolate z-10 cursor-move pointer-events-auto"
        onStageMouseMove={(e) => {
          hoverPosRef.current = { x: e.clientX, y: e.clientY };
          if (view === 'music') handleMusicMouseMove(e);
        }}
        globeImageUrl={GLOBE_IMAGE_LOCAL}
        globeMaterial={globeMaterial}
        showAtmosphere={false}
        isNight={!showDayGlobe}
        atmosphereColor={showDayGlobe ? '#7eb8e8' : '#1a2d4a'}
        atmosphereAltitude={0}
        backgroundColor={GLOBE_CANVAS_BG}
        pointsData={activeView === 'actualidad' ? [] : pointsForGlobe}
        pointLat="lat"
        pointLng="lng"
        pointColor={pointColorFn}
        pointAltitude={(p: object) => (p as { altitude?: number }).altitude ?? 0.01}
        pointRadius={pointRadiusFn}
        pointsMerge={false}
        objectsData={activeView === 'actualidad' ? newsObjectsForGlobe : []}
        objectLat={(d: object) => (d as NewsItem).geo?.lat ?? (d as NewsItem).lat ?? 0}
        objectLng={(d: object) => (d as NewsItem).geo?.lng ?? (d as NewsItem).lng ?? 0}
        objectAltitude={() => 0.12}
        objectThreeObject={newsThreeObject}
        onObjectClick={handleObjectClick}
        onObjectHover={handleObjectHover}
        onPointClick={handlePointClick}
        onPointHover={handlePointHover}
        ringsData={ringsData}
        ringColor={ringColorFn}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        arcsData={view === 'music' ? journeyArcs : []}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={view === 'music' ? arcColorFn : undefined}
        arcAltitude={0.15}
        arcDashLength={0.12}
        arcDashGap={0.08}
        arcDashAnimateTime={2200}
        arcsTransitionDuration={600}
      >
        {activeView === 'actualidad' && <div aria-hidden className="hudOverlayBg" />}
        {activeView === 'musica' && (
          <div className="absolute top-3 right-3 z-[15] px-3 py-2 rounded-xl glassPanel text-right min-w-[160px] max-w-[min(90vw,320px)] pointer-events-none">
            {storyLabel ? (
              <p className="text-[13px] font-medium text-white/95 truncate" title={`${storyLabel.title} — ${storyLabel.place}`}>
                {storyLabel.title} — {storyLabel.place}
              </p>
            ) : !selectedMood ? (
              <p className="text-xs font-medium text-white/90">Elige un sonido</p>
            ) : (
              <p className="text-xs font-medium text-white/80">{filteredStoriesForMusic.length} historias</p>
            )}
          </div>
        )}
        {activeView === 'actualidad' && newsTour.running && newsTour.items.length > 0 && (() => {
          const cur = newsTour.items[newsTour.idx];
          if (!cur) return null;
          const n = newsTour.idx + 1;
          const total = newsTour.items.length;
          const timeStr = cur.publishedAt ? formatTimeAgoFromNow(cur.publishedAt, Date.now()) : '—';
          return (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[15] px-4 py-3 rounded-xl glassPanel text-center min-w-[200px] max-w-[min(90vw,340px)] pointer-events-auto">
              <p className="text-[11px] text-white/60 mb-1">
                #{n}/{total} · {cur.source ?? '—'} · {timeStr}
              </p>
              <p className="text-sm font-semibold text-white/95 truncate mb-2" title={cur.title}>{cur.title?.trim() || '—'}</p>
              <div className="flex items-center justify-center gap-2">
                <a href={cur.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-semibold hover:bg-amber-500/35 transition">
                  Abrir
                </a>
                <button type="button" onClick={pauseNewsTour} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-semibold hover:bg-white/15 transition">
                  Detener
                </button>
              </div>
            </div>
          );
        })()}
        <div className="cinemaOverlay" aria-hidden="true" />
        <div className="grainOverlay" aria-hidden="true" />
        {hovered && hoverPos && (
          <div
            className={`glassPanel fixed z-[100] max-w-[260px] px-3 py-2 rounded-xl shadow-lg ${hovered.kind === 'news' && hovered.url ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{
              left: typeof window !== 'undefined' ? Math.min(hoverPos.x + 14, window.innerWidth - 280) : hoverPos.x + 14,
              top: hoverPos.y + 14,
            }}
            aria-hidden={hovered.kind !== 'news' || !hovered.url}
          >
            {hovered.kind === 'news' ? (
              <>
                <p className="text-[11px] text-white/70 truncate">{hovered.subtitle}</p>
                <p className="text-sm font-semibold text-white truncate mt-0.5">{hovered.title}</p>
                {hovered.url && (
                  <a
                    href={hovered.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-semibold hover:bg-amber-500/35 transition"
                  >
                    Abrir enlace
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white truncate">{hovered.title} — {hovered.subtitle}</p>
                {(hovered.hasAudio || hovered.hasVideo || hovered.hasText) && (
                  <p className="text-[12px] mt-1 flex items-center gap-2 flex-wrap">
                    {hovered.hasText && <span title="Texto">📝</span>}
                    {hovered.hasAudio && <span title="Audio">🎧</span>}
                    {hovered.hasVideo && <span title="Video">🎥</span>}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {activeView === 'actualidad' && <div aria-hidden className="hudOverlay" />}
        <div aria-hidden className="vignette" />

        {/* liveOverlay: solo en Historias / Noticias */}
        {(() => {
          const overlayEnabled = view !== "music";
          return overlayEnabled && liveOverlay && (
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
          );
        })()}
      </MapCanvas>
      </div>
      {/* HUD: Fecha/Hora/Ciudad — fixed al viewport en la franja reservada (200px); z-[100] siempre por encima del globo (z-0) */}
      <div
        className="pointer-events-none left-0 right-0 z-[100] flex justify-center"
        style={embedded ? { position: 'absolute', bottom: '48px' } : { position: 'fixed', bottom: '56px', left: 0, right: 0 }}
      >
        <TimeBar
          selectedLocation={selectedLocation}
          className="text-[11px] md:text-[12px] tracking-[0.32em] text-slate-300/70 drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
        />
      </div>
      </div>
    </div>
  );
}

/**
 * Mapa con todas las funcionalidades: una sola fuente de verdad para / (home) y /mapa.
 * - /mapa: MapFullPage() a pantalla completa.
 * - Home: HomeMapSection → MapFullPage(embedded) con las mismas funciones (dock, drawer, historias, noticias, sonidos, buscar, controles, tours).
 * Solo renderiza en el cliente (Three/Globe/APIs).
 */
export default function MapFullPage({
  embedded = false,
  sectionTopOffset,
  sectionHeight,
  universeVisible = true,
}: {
  embedded?: boolean;
  sectionTopOffset?: number;
  sectionHeight?: number;
  /** Solo en home: false cuando el usuario está en el hero (Universe no visible) */
  universeVisible?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-black text-white">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/90">Cargando mapa…</p>
      </div>
    );
  }
  return (
    <MapErrorBoundary>
      <MapaPageContent
        embedded={embedded}
        sectionTopOffset={sectionTopOffset}
        sectionHeight={sectionHeight}
        universeVisible={universeVisible}
      />
    </MapErrorBoundary>
  );
}
