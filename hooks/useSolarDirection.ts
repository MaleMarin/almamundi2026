'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getSolarDirectionUnit } from '@/lib/globe/solar';

/** Convierte vector solar del dominio numérico a Three.js (Tierra → Sol). */
export function solarUnitToThreeVector(u: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(u.x, u.y, u.z).normalize();
}

/**
 * Dirección solar en el instante de primer montaje (fecha/hora reales del usuario).
 * Estable entre re-renders; no avanza el reloj en vivo.
 */
export function useSolarDirection(): THREE.Vector3 {
  const anchor = useRef<Date | null>(null);
  if (anchor.current === null) anchor.current = new Date();

  return useMemo(
    () => solarUnitToThreeVector(getSolarDirectionUnit(anchor.current!)),
    []
  );
}
