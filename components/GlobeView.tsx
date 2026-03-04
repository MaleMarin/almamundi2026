'use client';

import type { ReactNode } from 'react';

const POV_BASE = { lat: -8, lng: -28, altitude: 2.2 } as const;
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
  children: (injected: GlobeViewInjected) => ReactNode;
};

/**
 * Contenedor del globo: a la derecha del panel izquierdo con un hueco; composición vía POV (cámara).
 */
export function GlobeView({ panelWidth, onGlobeReady, children }: GlobeViewProps) {
  const injectedOnGlobeReady = () => {
    const initialPOV = computeInitialPOV(panelWidth);
    onGlobeReady(initialPOV);
  };

  const hasPanel = panelWidth > 0;
  const leftOffset = hasPanel ? panelWidth + GAP_PANEL_GLOBE_PX : 0;

  return (
    <main
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: leftOffset,
        width: hasPanel ? `calc(100vw - ${leftOffset}px)` : '100vw',
        height: '100dvh',
        maxHeight: '100vh',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="relative" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {children({ onGlobeReady: injectedOnGlobeReady })}
        </div>
      </div>
    </main>
  );
}
