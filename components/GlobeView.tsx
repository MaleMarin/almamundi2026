'use client';

import type { ReactNode } from 'react';

/** Vista inicial: estilo iPhone wallpaper — Sudamérica al centro, océanos azules, nubes, halo sutil. */
const POV_BASE = { lat: -18, lng: -58, altitude: 2.45 } as const;
const POV_LNG_OFFSET_DEG_PER_PANEL = 50;
/** Espacio entre el panel izquierdo y el globo (solo escritorio). */
const GAP_PANEL_GLOBE_PX = 24;

/**
 * Calcula POV inicial para compensar el panel izquierdo (globo más a la derecha visualmente).
 * Usa panelWidth y viewport, sin porcentajes mágicos.
 */
export function computeInitialPOV(panelWidth: number): { lat: number; lng: number; altitude: number } {
  if (typeof window === 'undefined' || panelWidth <= 0)
    return { ...POV_BASE };
  const vw = window.innerWidth;
  const lngOffset = (panelWidth / vw) * POV_LNG_OFFSET_DEG_PER_PANEL;
  return {
    lat: POV_BASE.lat,
    lng: POV_BASE.lng + lngOffset,
    altitude: POV_BASE.altitude,
  };
}

export type GlobeViewInjected = {
  onGlobeReady: () => void;
};

type GlobeViewProps = {
  panelWidth: number;
  onGlobeReady: (initialPOV: { lat: number; lng: number; altitude: number }) => void;
  /** Reservar px en la parte inferior del viewport para no tapar HUD (ej. fecha/hora). El área fixed del globo no cubre esa franja. */
  bottomReservePx?: number;
  /** Reservar px en la parte superior (barra con logo/frase). El globo no cubre esa franja y no se corta arriba. */
  topReservePx?: number;
  children: (injected: GlobeViewInjected) => ReactNode;
};

/**
 * Contenedor del globo: a la derecha del panel izquierdo con un hueco; composición vía POV (cámara).
 * Si bottomReservePx está definido, el bloque fixed no llega al borde inferior (para dejar espacio al HUD).
 * Si topReservePx está definido, el bloque fixed no empieza en 0 (espacio para barra superior y que no se corte la esfera).
 */
export function GlobeView({ panelWidth, onGlobeReady, bottomReservePx, topReservePx, children }: GlobeViewProps) {
  const injectedOnGlobeReady = () => {
    const initialPOV = computeInitialPOV(panelWidth);
    onGlobeReady(initialPOV);
  };

  const hasPanel = panelWidth > 0;
  const leftOffset = hasPanel ? panelWidth + GAP_PANEL_GLOBE_PX : 0;
  const bottomReserve = bottomReservePx ?? 0;
  const topReserve = topReservePx ?? 0;
  const totalVerticalReserve = topReserve + bottomReserve;

  return (
    <main
      style={{
        position: 'fixed',
        top: topReserve,
        right: 0,
        bottom: bottomReserve > 0 ? bottomReserve : 0,
        left: leftOffset,
        width: hasPanel ? `calc(100vw - ${leftOffset}px)` : '100vw',
        height: totalVerticalReserve > 0 ? `calc(100dvh - ${totalVerticalReserve}px)` : '100dvh',
        maxHeight: totalVerticalReserve > 0 ? `calc(100vh - ${totalVerticalReserve}px)` : '100vh',
        minHeight: 620,
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: totalVerticalReserve > 0 ? '8vh' : 0,
        }}
      >
        <div className="relative" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {children({ onGlobeReady: injectedOnGlobeReady })}
        </div>
      </div>
    </main>
  );
}
