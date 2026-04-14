'use client';

/**
 * Bits en el globo R3F: lat/lon (BITS_DATA / HuellaPunto).
 *
 * - Picking: esfera invisible por bit (`PICKING_SPHERE_RADIUS`), independiente del tamaño visual.
 * - Hover magnético: proyección pantalla + radio px + histéresis (`GlobeBitInteractionStore`).
 * - Cerca del centro del canvas (disco del globo): el giro terrestre se ralentiza; encima de un marcador, casi pausa (`GlobeV2` + `pointerGlobeCenterDist`).
 * - Clic: si hay candidato magnético y el arrastre es corto, abre ese bit (no exige acierto en el mesh).
 * - Visibilidad: filtro hemisferio (normal tierra→bit · dir bit→cámara).
 *
 * El giro terrestre (reloj de escena) se modula en GlobeV2 leyendo `interactionStoreRef`.
 */

import type { MutableRefObject, RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { latLngToCartesianThreeJS } from '@/lib/globe-coords';
import { GLOBE_V2_BIT_SURFACE_RADIUS } from '@/lib/globe/globe-v2-assets';
import {
  ACTIVE_BIT_SCALE,
  CLICK_MAX_DRAG_PX,
  FRONT_HEMISPHERE_MIN_DOT,
  HOVER_HYSTERESIS_PX,
  PICK_RADIUS_PX,
  PICKING_SPHERE_RADIUS,
  type GlobeBitInteractionStore,
} from '@/lib/globe/globe-bits-magnetic-config';
import {
  createBitStarBurstMaterial,
  createStoryStarBurstMaterial,
} from '@/components/globe/bitStarBurstMaterial';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export type GlobeBitMarker = {
  id: number;
  lat: number;
  lon: number;
  color?: string;
  /** Historias en el mapa vs bits curados (color distinto en el globo). */
  markerKind?: 'bit' | 'story';
};

const BIT_SURFACE_RADIUS = GLOBE_V2_BIT_SURFACE_RADIUS;

const STAR_PLANE_SCALE = 0.0127;
const STAR_PLANE_SCALE_OUTER = 0.0165;
const CORE_SCALE = 0.00043;

function disableMeshRaycast(obj: THREE.Object3D | null) {
  if (obj instanceof THREE.Mesh) obj.raycast = () => {};
}

/**
 * Histéresis: mantener `prevId` salvo que otro sea claramente más cercano o se salga del radio extendido.
 */
function resolveMagneticHover(
  prevId: number | null,
  distById: Map<number, number>,
  pickRadiusPx: number,
  hysteresisPx: number
): number | null {
  let bestId: number | null = null;
  let bestD = Infinity;
  distById.forEach((d, id) => {
    if (d < bestD) {
      bestD = d;
      bestId = id;
    }
  });

  const R = pickRadiusPx;
  const H = hysteresisPx;

  if (bestId == null || bestD > R) {
    if (prevId == null) return null;
    const dPrev = distById.get(prevId);
    if (dPrev === undefined || dPrev > R + H) return null;
    return prevId;
  }

  if (prevId == null || prevId === bestId) return bestId;
  const dPrev = distById.get(prevId);
  if (dPrev === undefined) return bestId;
  if (bestD < dPrev - H) return bestId;
  return prevId;
}

function BitDot({
  bit,
  selected,
  magneticActive,
  starMatNormal,
  starMatSelected,
  storyMatNormal,
  storyMatSelected,
}: {
  bit: GlobeBitMarker;
  selected: boolean;
  magneticActive: boolean;
  starMatNormal: THREE.ShaderMaterial;
  starMatSelected: THREE.ShaderMaterial;
  storyMatNormal: THREE.ShaderMaterial;
  storyMatSelected: THREE.ShaderMaterial;
}) {
  const { surfacePos, flareBump } = useMemo(() => {
    const p = latLngToCartesianThreeJS(bit.lat, bit.lon, BIT_SURFACE_RADIUS);
    const s = new THREE.Vector3(p.x, p.y, p.z);
    const b = s.clone().normalize().multiplyScalar(0.0019);
    return { surfacePos: s, flareBump: b };
  }, [bit.lat, bit.lon]);

  const rootRef = useRef<THREE.Group>(null);
  const faceCamRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const bitWorld = useMemo(() => new THREE.Vector3(), []);
  const camWorld = useMemo(() => new THREE.Vector3(), []);
  const earthCenterW = useMemo(() => new THREE.Vector3(), []);
  const toCam = useMemo(() => new THREE.Vector3(), []);
  const outRadial = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const face = faceCamRef.current;
    if (face) face.quaternion.copy(camera.quaternion);
    const root = rootRef.current;
    if (root) root.userData.bitId = bit.id;
    if (!root) return;
    const bitsRoot = root.parent;
    const spin = bitsRoot?.parent ?? null;
    if (!spin) {
      root.visible = false;
      return;
    }
    spin.updateMatrixWorld(true);
    earthCenterW.setFromMatrixPosition(spin.matrixWorld);
    root.getWorldPosition(bitWorld);
    camera.getWorldPosition(camWorld);
    toCam.subVectors(camWorld, bitWorld);
    const len = toCam.length();
    if (len < 1e-8) {
      root.visible = false;
      return;
    }
    toCam.multiplyScalar(1 / len);
    outRadial.subVectors(bitWorld, earthCenterW);
    if (outRadial.lengthSq() < 1e-12) {
      root.visible = false;
      return;
    }
    outRadial.normalize();
    root.visible = outRadial.dot(toCam) > FRONT_HEMISPHERE_MIN_DOT;
  });

  const isStory = bit.markerKind === 'story';
  /** Historias: más visibles que los bits (misma capa magnética en pantalla). */
  const storyVis = isStory ? 1.38 : 1;
  const starMat = selected
    ? isStory
      ? storyMatSelected
      : starMatSelected
    : isStory
      ? storyMatNormal
      : starMatNormal;
  const sel = selected ? 1.08 : 1.0;
  const mag = magneticActive && !selected ? ACTIVE_BIT_SCALE : 1;
  const planeScale = STAR_PLANE_SCALE * storyVis;
  const planeScaleOuter = STAR_PLANE_SCALE_OUTER * storyVis;
  const coreScale = CORE_SCALE * storyVis;

  return (
    <group ref={rootRef} position={surfacePos}>
      {/*
        Zona de picking lógica = PICK_RADIUS_PX en pantalla (no escala 3D del dibujo).
        Esfera invisible opcional (mismo radio que config) por si en el futuro se reactiva raycast.
      */}
      <mesh scale={PICKING_SPHERE_RADIUS * (isStory ? 1.25 : 1)} raycast={() => {}} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
      </mesh>

      <group position={flareBump}>
        <group ref={faceCamRef}>
          <mesh
            ref={(m) => disableMeshRaycast(m)}
            material={starMat}
            scale={[planeScale * sel * mag, planeScale * sel * mag, 1]}
            renderOrder={isStory ? 14 : 10}
          >
            <planeGeometry args={[1, 1]} />
          </mesh>
          <mesh
            ref={(m) => disableMeshRaycast(m)}
            material={starMat}
            rotation={[0, 0, Math.PI / 4]}
            scale={[planeScaleOuter * sel * mag, planeScaleOuter * sel * mag, 1]}
            renderOrder={isStory ? 13 : 9}
          >
            <planeGeometry args={[1, 1]} />
          </mesh>
        </group>

        <mesh
          ref={(m) => disableMeshRaycast(m)}
          scale={coreScale * sel * mag}
          renderOrder={isStory ? 15 : 11}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial
            color={isStory ? '#ffd4c4' : '#f2f4f8'}
            transparent
            opacity={magneticActive && !selected ? 0.88 : 0.72}
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

export function GlobeBitsLayer({
  bits,
  selectedBitId,
  onBitClick,
  orbitControlsRef,
  interactionStoreRef,
  earthSpinGroupRef,
}: {
  bits: GlobeBitMarker[];
  selectedBitId: number | null;
  onBitClick?: (id: number) => void;
  orbitControlsRef?: RefObject<OrbitControlsImpl | null>;
  interactionStoreRef: MutableRefObject<GlobeBitInteractionStore>;
  /** Mismo ref que `planetSpinRef` en GlobeV2 (origen Tierra en el subárbol que rota). */
  earthSpinGroupRef: RefObject<THREE.Group | null>;
}) {
  if (!bits.length) return null;
  return (
    <GlobeBitsLayerMounted
      bits={bits}
      selectedBitId={selectedBitId}
      onBitClick={onBitClick}
      orbitControlsRef={orbitControlsRef}
      interactionStoreRef={interactionStoreRef}
      earthSpinGroupRef={earthSpinGroupRef}
    />
  );
}

function GlobeBitsLayerMounted({
  bits,
  selectedBitId,
  onBitClick,
  orbitControlsRef,
  interactionStoreRef,
  earthSpinGroupRef,
}: {
  bits: GlobeBitMarker[];
  selectedBitId: number | null;
  onBitClick?: (id: number) => void;
  orbitControlsRef?: RefObject<OrbitControlsImpl | null>;
  interactionStoreRef: MutableRefObject<GlobeBitInteractionStore>;
  earthSpinGroupRef: RefObject<THREE.Group | null>;
}) {
  const bitsRootRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();

  const [hoverCandidateId, setHoverCandidateId] = useState<number | null>(null);
  useCursor(!!hoverCandidateId && Boolean(onBitClick));

  const magneticPrevRef = useRef<number | null>(null);
  const rafMoveRef = useRef(0);
  const downPosRef = useRef<{ x: number; y: number } | null>(null);
  const savedOrbitRotateRef = useRef(true);
  const orbitPausedForBitRef = useRef(false);
  const capturedPointerIdRef = useRef<number | null>(null);

  const aux = useMemo(
    () => ({
      earthCenter: new THREE.Vector3(),
      bitWorld: new THREE.Vector3(),
      camWorld: new THREE.Vector3(),
      ndc: new THREE.Vector3(),
      distById: new Map<number, number>(),
    }),
    []
  );

  const starMatNormal = useMemo(() => createBitStarBurstMaterial(1.05, 'GlobeBitStarBurst'), []);
  const starMatSelected = useMemo(() => createBitStarBurstMaterial(1.38, 'GlobeBitStarBurstSelected'), []);
  const storyMatNormal = useMemo(() => createStoryStarBurstMaterial(1.05, 'GlobeStoryStarBurst'), []);
  const storyMatSelected = useMemo(() => createStoryStarBurstMaterial(1.38, 'GlobeStoryStarBurstSelected'), []);

  useEffect(() => {
    return () => {
      starMatNormal.dispose();
      starMatSelected.dispose();
      storyMatNormal.dispose();
      storyMatSelected.dispose();
    };
  }, [starMatNormal, starMatSelected, storyMatNormal, storyMatSelected]);

  const updateMagneticFromPointer = (clientX: number, clientY: number) => {
    const spin = earthSpinGroupRef.current;
    const bitsRoot = bitsRootRef.current;
    const store = interactionStoreRef.current;
    if (!spin || !bitsRoot) {
      store.magneticHoverId = null;
      magneticPrevRef.current = null;
      setHoverCandidateId((p) => (p !== null ? null : p));
      return;
    }

    spin.updateMatrixWorld(true);
    bitsRoot.updateMatrixWorld(true);
    aux.earthCenter.set(0, 0, 0).applyMatrix4(spin.matrixWorld);
    camera.getWorldPosition(aux.camWorld);

    const rect = gl.domElement.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const w = rect.width || 1;
    const h = rect.height || 1;

    aux.distById.clear();
    for (let i = 0; i < bitsRoot.children.length; i++) {
      const ch = bitsRoot.children[i];
      const id = ch.userData.bitId as number | undefined;
      if (id === undefined) continue;
      ch.getWorldPosition(aux.bitWorld);
      const n = aux.bitWorld.clone().sub(aux.earthCenter).normalize();
      const vCam = aux.camWorld.clone().sub(aux.bitWorld).normalize();
      if (n.dot(vCam) < FRONT_HEMISPHERE_MIN_DOT) continue;

      aux.ndc.copy(aux.bitWorld).project(camera);
      const sx = (aux.ndc.x * 0.5 + 0.5) * w;
      const sy = (-aux.ndc.y * 0.5 + 0.5) * h;
      const d = Math.hypot(sx - px, sy - py);
      aux.distById.set(id, d);
    }

    const next = resolveMagneticHover(magneticPrevRef.current, aux.distById, PICK_RADIUS_PX, HOVER_HYSTERESIS_PX);
    magneticPrevRef.current = next;
    store.magneticHoverId = next;
    const nx = (px / w - 0.5) * 2;
    const ny = (py / h - 0.5) * 2;
    store.pointerGlobeCenterDist = Math.hypot(nx, ny);
    setHoverCandidateId((prev) => (prev === next ? prev : next));
  };

  useEffect(() => {
    const el = gl.domElement;

    const clearMagnetic = () => {
      interactionStoreRef.current.pointerOnCanvas = false;
      interactionStoreRef.current.magneticHoverId = null;
      interactionStoreRef.current.pointerGlobeCenterDist = 1;
      magneticPrevRef.current = null;
      setHoverCandidateId(null);
    };

    const onEnter = () => {
      interactionStoreRef.current.pointerOnCanvas = true;
      interactionStoreRef.current.pointerGlobeCenterDist = 1;
    };

    const onLeave = () => {
      clearMagnetic();
    };

    const onMove = (e: PointerEvent) => {
      if (!interactionStoreRef.current.pointerOnCanvas) interactionStoreRef.current.pointerOnCanvas = true;
      if (rafMoveRef.current) return;
      rafMoveRef.current = window.requestAnimationFrame(() => {
        rafMoveRef.current = 0;
        updateMagneticFromPointer(e.clientX, e.clientY);
      });
    };

    const onDown = (e: PointerEvent) => {
      updateMagneticFromPointer(e.clientX, e.clientY);
      downPosRef.current = { x: e.clientX, y: e.clientY };
      const ctrl = orbitControlsRef?.current;
      const id = interactionStoreRef.current.magneticHoverId;
      orbitPausedForBitRef.current = false;
      capturedPointerIdRef.current = null;
      if (id != null && ctrl) {
        orbitPausedForBitRef.current = true;
        savedOrbitRotateRef.current = ctrl.enableRotate;
        ctrl.enableRotate = false;
        capturedPointerIdRef.current = e.pointerId;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
      }
    };

    const finishPointer = (e: PointerEvent) => {
      const ctrl = orbitControlsRef?.current;
      const down = downPosRef.current;
      downPosRef.current = null;

      if (orbitPausedForBitRef.current && ctrl) {
        ctrl.enableRotate = savedOrbitRotateRef.current;
        orbitPausedForBitRef.current = false;
      }
      const capId = capturedPointerIdRef.current;
      if (capId != null) {
        try {
          el.releasePointerCapture(capId);
        } catch {
          /* noop */
        }
        capturedPointerIdRef.current = null;
      }

      if (!onBitClick || !down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (dx * dx + dy * dy > CLICK_MAX_DRAG_PX * CLICK_MAX_DRAG_PX) return;

      updateMagneticFromPointer(e.clientX, e.clientY);
      const openId = interactionStoreRef.current.magneticHoverId;
      if (openId != null) {
        e.preventDefault();
        e.stopImmediatePropagation();
        onBitClick(openId);
      }
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', finishPointer);
    el.addEventListener('pointercancel', finishPointer);

    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', finishPointer);
      el.removeEventListener('pointercancel', finishPointer);
      if (rafMoveRef.current) cancelAnimationFrame(rafMoveRef.current);
      clearMagnetic();
    };
  }, [gl, camera, bits, onBitClick, orbitControlsRef, interactionStoreRef, earthSpinGroupRef, aux]);

  return (
    <group ref={bitsRootRef} name="globe-bits">
      {bits.map((bit) => (
        <BitDot
          key={bit.id}
          bit={bit}
          selected={selectedBitId === bit.id}
          magneticActive={hoverCandidateId === bit.id}
          starMatNormal={starMatNormal}
          starMatSelected={starMatSelected}
          storyMatNormal={storyMatNormal}
          storyMatSelected={storyMatSelected}
        />
      ))}
    </group>
  );
}
