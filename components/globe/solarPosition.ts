/**
 * Punto subsolar y dirección del sol para shaders del globo.
 * Delega en `lib/sunPosition.ts` (Meeus / GMST, convención ECEF del globo).
 */

import * as THREE from 'three';
import {
  subsolarGeographicDegrees,
  sunUnitVectorTowardSunEcef,
  type SunVector3,
} from '@/lib/sunPosition';

export type SubsolarPoint = { lat: number; lng: number };

/** Lat/lng (grados) donde el sol está en el cenit en el instante dado. */
export function getSubsolarPoint(date: Date): SubsolarPoint {
  return subsolarGeographicDegrees(date);
}

/** Vector unitario Tierra → Sol (marco ECEF / textura del globo). */
export function getSunDirection(date: Date, target?: THREE.Vector3): THREE.Vector3 {
  const ecef: SunVector3 = sunUnitVectorTowardSunEcef(date);
  const v = target ?? new THREE.Vector3();
  return v.set(ecef.x, ecef.y, ecef.z);
}
