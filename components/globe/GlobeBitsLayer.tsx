'use client';

/**
 * Bits en el globo R3F: lat/lon (BITS_DATA / HuellaPunto).
 * Visual: destello tipo estrella / lens flare (shader billboard + núcleo), inspirado en luz cálida de alta intensidad.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { latLngToCartesianThreeJS } from '@/lib/globe-coords';
import { GLOBE_V2_BIT_SURFACE_RADIUS } from '@/lib/globe/globe-v2-assets';
import { createBitStarBurstMaterial } from '@/components/globe/bitStarBurstMaterial';

export type GlobeBitMarker = {
  id: number;
  lat: number;
  lon: number;
  color?: string;
};

const BIT_SURFACE_RADIUS = GLOBE_V2_BIT_SURFACE_RADIUS;

/** Escala: puntos tipo lucernas / luces de ciudad vistas desde órbita. */
const STAR_PLANE_SCALE = 0.0068;
const STAR_PLANE_SCALE_OUTER = 0.0088;
const CORE_SCALE = 0.00022;
const HIT_SCALE = 0.0056;

function disableMeshRaycast(obj: THREE.Object3D | null) {
  if (obj instanceof THREE.Mesh) obj.raycast = () => {};
}

function BitDot({
  bit,
  selected,
  starMatNormal,
  starMatSelected,
  onSelect,
  onHoverChange,
}: {
  bit: GlobeBitMarker;
  selected: boolean;
  starMatNormal: THREE.ShaderMaterial;
  starMatSelected: THREE.ShaderMaterial;
  onSelect?: (id: number) => void;
  onHoverChange: (id: number | null) => void;
}) {
  const { surfacePos, flareBump } = useMemo(() => {
    const p = latLngToCartesianThreeJS(bit.lat, bit.lon, BIT_SURFACE_RADIUS);
    const s = new THREE.Vector3(p.x, p.y, p.z);
    const b = s.clone().normalize().multiplyScalar(0.0019);
    return { surfacePos: s, flareBump: b };
  }, [bit.lat, bit.lon]);

  const faceCamRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => {
    const g = faceCamRef.current;
    if (g) g.quaternion.copy(camera.quaternion);
  });

  const starMat = selected ? starMatSelected : starMatNormal;
  const sel = selected ? 1.08 : 1.0;

  return (
    <group position={surfacePos}>
      <mesh
        scale={HIT_SCALE}
        onClick={
          onSelect
            ? (e) => {
                e.stopPropagation();
                onSelect(bit.id);
              }
            : undefined
        }
        onPointerDown={onSelect ? (e) => e.stopPropagation() : undefined}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverChange(bit.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHoverChange(null);
        }}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={true} />
      </mesh>

      <group position={flareBump}>
        <group ref={faceCamRef}>
          <mesh
            ref={(m) => disableMeshRaycast(m)}
            material={starMat}
            scale={[STAR_PLANE_SCALE * sel, STAR_PLANE_SCALE * sel, 1]}
            renderOrder={10}
          >
            <planeGeometry args={[1, 1]} />
          </mesh>
          <mesh
            ref={(m) => disableMeshRaycast(m)}
            material={starMat}
            rotation={[0, 0, Math.PI / 4]}
            scale={[STAR_PLANE_SCALE_OUTER * sel, STAR_PLANE_SCALE_OUTER * sel, 1]}
            renderOrder={9}
          >
            <planeGeometry args={[1, 1]} />
          </mesh>
        </group>

        <mesh
          ref={(m) => disableMeshRaycast(m)}
          scale={CORE_SCALE * sel}
          renderOrder={11}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial
            color="#f2f4f8"
            transparent
            opacity={0.72}
            depthWrite={false}
            depthTest={true}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Sin bits no montamos el subárbol con ShaderMaterials — evita compilar GlobeBitStarBurst* en etapas A/B.
 */
export function GlobeBitsLayer({
  bits,
  selectedBitId,
  onBitClick,
}: {
  bits: GlobeBitMarker[];
  selectedBitId: number | null;
  onBitClick?: (id: number) => void;
}) {
  if (!bits.length) return null;
  return (
    <GlobeBitsLayerMounted bits={bits} selectedBitId={selectedBitId} onBitClick={onBitClick} />
  );
}

function GlobeBitsLayerMounted({
  bits,
  selectedBitId,
  onBitClick,
}: {
  bits: GlobeBitMarker[];
  selectedBitId: number | null;
  onBitClick?: (id: number) => void;
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  useCursor(!!hoveredId && Boolean(onBitClick));

  const starMatNormal = useMemo(() => createBitStarBurstMaterial(1.05, 'GlobeBitStarBurst'), []);
  const starMatSelected = useMemo(() => createBitStarBurstMaterial(1.38, 'GlobeBitStarBurstSelected'), []);

  useEffect(() => {
    return () => {
      starMatNormal.dispose();
      starMatSelected.dispose();
    };
  }, [starMatNormal, starMatSelected]);

  return (
    <group name="globe-bits">
      {bits.map((bit) => (
        <BitDot
          key={bit.id}
          bit={bit}
          selected={selectedBitId === bit.id}
          starMatNormal={starMatNormal}
          starMatSelected={starMatSelected}
          onSelect={onBitClick}
          onHoverChange={(id) => setHoveredId(id)}
        />
      ))}
    </group>
  );
}
