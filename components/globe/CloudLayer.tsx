'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type CloudLayerProps = {
  radius: number;
  map: THREE.Texture;
  autoRotate?: boolean;
  /** Velocidad relativa respecto a la superficie (rad/s). */
  cloudRotationSpeed?: number;
  quality?: 'high' | 'medium' | 'low';
};

export function CloudLayer({
  radius,
  map,
  autoRotate = true,
  cloudRotationSpeed = 0.018,
  quality = 'high',
}: CloudLayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const seg = quality === 'high' ? 80 : quality === 'medium' ? 56 : 36;

  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.anisotropy = Math.min(8, map.anisotropy || 8);
    map.needsUpdate = true;
  }, [map]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        /* Mate: sin IBL fuerte las nubes no “desaparecen” */
        roughness: 1,
        metalness: 0,
        color: new THREE.Color(0xffffff),
        emissive: new THREE.Color(0xd8e2ee),
        emissiveIntensity: 0.08,
        side: THREE.DoubleSide,
      }),
    [map]
  );

  useLayoutEffect(() => {
    return () => material.dispose();
  }, [material]);

  useFrame((_, dt) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += cloudRotationSpeed * dt;
    }
  });

  return (
    <group ref={groupRef} scale={radius}>
      <mesh renderOrder={3}>
        <sphereGeometry args={[1, seg, seg]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}
