'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

export type SunLightProps = {
  direction: THREE.Vector3;
  /** Distancia de la luz (solo afecta sombras si se activan). */
  distance?: number;
  intensity?: number;
  color?: THREE.ColorRepresentation;
  /** Relleno muy suave para leer el terminador nocturno. */
  enableFill?: boolean;
  fillSky?: THREE.ColorRepresentation;
  fillGround?: THREE.ColorRepresentation;
  hemisphereIntensity?: number;
  ambientIntensity?: number;
  ambientColor?: THREE.ColorRepresentation;
};

export function SunLight({
  direction,
  distance = 24,
  intensity = 2.05,
  color = '#fff4e8',
  enableFill = true,
  fillSky = '#b9c6d4',
  fillGround = '#08080a',
  hemisphereIntensity = 0.28,
  ambientIntensity = 0.055,
  ambientColor = '#5c6572',
}: SunLightProps) {
  const position = useMemo(
    () =>
      [
        direction.x * distance,
        direction.y * distance,
        direction.z * distance,
      ] as [number, number, number],
    [direction.x, direction.y, direction.z, distance]
  );

  return (
    <>
      <directionalLight
        position={position}
        intensity={intensity}
        color={color}
        castShadow={false}
      />
      {enableFill ? (
        <>
          <hemisphereLight args={[fillSky, fillGround, hemisphereIntensity]} />
          <ambientLight intensity={ambientIntensity} color={ambientColor} />
        </>
      ) : null}
    </>
  );
}
