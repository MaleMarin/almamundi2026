'use client';

/**
 * BINARIO DEBUG (temporal): una sola esfera + MeshBasicMaterial.
 * Sin Atmosphere, sin CloudLayer, sin texturas, sin ShaderMaterial.
 * Tras diagnosticar, restaurar versión con EarthSurface + CloudLayer (+ Atmosphere si aplica).
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type EarthGlobeQuality = 'high' | 'medium' | 'low';

export type EarthGlobeProps = {
  radius?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  quality?: EarthGlobeQuality;
  /** Sin uso mientras dure el modo binario mínimo. */
  sunDirection: THREE.Vector3;
};

export function EarthGlobe({
  radius = 1,
  autoRotate = true,
  rotationSpeed = 0.052,
}: EarthGlobeProps) {
  const spinRef = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (autoRotate && spinRef.current) {
      spinRef.current.rotation.y += rotationSpeed * dt;
    }
  });

  return (
    <group ref={spinRef}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>
    </group>
  );
}
