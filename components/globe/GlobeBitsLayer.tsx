'use client';

/**
 * Bits en el globo R3F: lat/lon (BITS_DATA / HuellaPunto).
 * Visual: puntitos amarillos luminosos (núcleo + halo aditivo); hit area invisible más grande.
 */

import { useMemo, useState } from 'react';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { latLngToCartesianThreeJS } from '@/lib/globe-coords';

export type GlobeBitMarker = {
  id: number;
  lat: number;
  lon: number;
  color?: string;
};

const BIT_SURFACE_RADIUS = 1.017;

/** Núcleo pequeño (punto “estrella” sobre el globo). */
const CORE_SCALE = 0.00205;
/** Destello central aditivo (más brillante que el núcleo sólido). */
const SPARK_SCALE = CORE_SCALE * 0.5;
/** Halos: doble capa additive = más brillo sin agrandar el punto percibido. */
const GLOW_INNER_SCALE = CORE_SCALE * 4.1;
const GLOW_OUTER_SCALE = CORE_SCALE * 7.2;
/** Radio lógico para clic / hover (invisible; un poco mayor en móvil). */
const HIT_SCALE = 0.015;

/** Amarillo brillante uniforme para todos los bits (sin tinte por categoría). */
const GLOW_YELLOW = '#ffea00';
const GLOW_YELLOW_SOFT = '#fff176';
const CORE_YELLOW = '#fffde7';
const SELECTED_GLOW = '#fff59d';
const SELECTED_SPARK = '#ffffff';

function BitDot({
  bit,
  selected,
  onSelect,
  onHoverChange,
}: {
  bit: GlobeBitMarker;
  selected: boolean;
  onSelect?: (id: number) => void;
  onHoverChange: (id: number | null) => void;
}) {
  const pos = useMemo(() => {
    const p = latLngToCartesianThreeJS(bit.lat, bit.lon, BIT_SURFACE_RADIUS);
    return new THREE.Vector3(p.x, p.y, p.z);
  }, [bit.lat, bit.lon]);

  const sel = selected ? 1.38 : 1;
  const coreScale = CORE_SCALE * sel;
  const sparkScale = SPARK_SCALE * sel;
  const innerGlowScale = GLOW_INNER_SCALE * sel;
  const outerGlowScale = GLOW_OUTER_SCALE * sel;
  const coreColor = selected ? SELECTED_SPARK : CORE_YELLOW;
  const glowColor = selected ? SELECTED_GLOW : GLOW_YELLOW_SOFT;
  const haloCoreColor = selected ? SELECTED_GLOW : GLOW_YELLOW;

  return (
    <group position={pos}>
      {/* Zona de interacción: invisible pero clickeable */}
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

      {/* Halo exterior suave (additive) */}
      <mesh scale={outerGlowScale} renderOrder={1}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={selected ? 0.22 : 0.16}
          depthWrite={false}
          depthTest={true}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Halo interior más intenso */}
      <mesh scale={innerGlowScale} renderOrder={2}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial
          color={haloCoreColor}
          transparent
          opacity={selected ? 0.55 : 0.42}
          depthWrite={false}
          depthTest={true}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Núcleo sólido legible */}
      <mesh scale={coreScale} renderOrder={3}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={coreColor} toneMapped={false} />
      </mesh>

      {/* Pincho de luz blanca (máximo brillo percibido) */}
      <mesh scale={sparkScale} renderOrder={4}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          color={selected ? SELECTED_SPARK : '#fffef0'}
          transparent
          opacity={1}
          depthWrite={false}
          depthTest={true}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function GlobeBitsLayer({
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

  if (!bits.length) return null;

  return (
    <group name="globe-bits">
      {bits.map((bit) => (
        <BitDot
          key={bit.id}
          bit={bit}
          selected={selectedBitId === bit.id}
          onSelect={onBitClick}
          onHoverChange={(id) => setHoveredId(id)}
        />
      ))}
    </group>
  );
}
