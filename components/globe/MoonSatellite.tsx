'use client';

/**
 * Luna en órbita geocéntrica: elipse (e ≈ 0,055), plano con inclinación ~5,145°.
 * Posición: anomalía media M con n = 2π/T y Kepler → coords perifocales.
 *
 * Realismo perceptivo (GlobeV2 home):
 * - Siempre detrás del planeta respecto a la cámara (sin tránsitos frontales).
 * - Acoplamiento de marea: `lookAt(Tierra)` fija la misma cara; sin spin hijo extra.
 * - Fase = misma luz direccional de escena que ilumina la Tierra.
 * - Radio ≈ 0,27 R⊕ (ajustable con `moonRadiusScale`).
 */

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  GLOBE_V2_CLOUD_OUTER_RADIUS_DELTA,
  GLOBE_V2_CLOUD_ROOT_SCALE,
  GLOBE_V2_TEXTURE_BASE,
} from '@/lib/globe/globe-v2-assets';

/**
 * ¿El segmento cámara → centro lunar atraviesa la esfera terrestre antes de llegar a la Luna?
 * Evita “agujeros” del z-buffer (nubes/atmósfera sin depthWrite o descartes en tierra/océano).
 */
function isLunarCenterOccludedByEarthSphere(
  cam: THREE.Vector3,
  moonCenter: THREE.Vector3,
  earthCenter: THREE.Vector3,
  earthRadius: number,
  scratchDir: THREE.Vector3,
  scratchOc: THREE.Vector3,
  eps = 0.04
): boolean {
  scratchDir.subVectors(moonCenter, cam);
  const distMoon = scratchDir.length();
  if (distMoon < 1e-8) return false;
  scratchDir.multiplyScalar(1 / distMoon);

  scratchOc.subVectors(cam, earthCenter);
  const halfB = scratchDir.dot(scratchOc);
  const c = scratchOc.lengthSq() - earthRadius * earthRadius;
  const disc = halfB * halfB - c;
  if (disc < 0) return false;
  const s = Math.sqrt(disc);
  const t0 = -halfB - s;
  const t1 = -halfB + s;
  const tNear = t0 > eps ? t0 : t1 > eps ? t1 : -1;
  if (tNear < 0) return false;
  return tNear < distMoon - eps;
}

/** Período sidéreo lunar (una órbita respecto a las estrellas), en días solares medios. */
export const MOON_SIDEREAL_ORBIT_DAYS = 27.321661;

/** Día sideral terrestre: 23 h 56 min 4 s (referencia para proporciones con la órbita lunar). */
export const EARTH_SIDEREAL_DAY_S = 23 * 3600 + 56 * 60 + 4;

/**
 * Rotaciones siderales de la Tierra durante una órbita sidereal completa de la Luna.
 * Tiempo transcurrido ≈ MOON_SIDEREAL_ORBIT_DAYS × 86400 s; cada rotación sideral dura EARTH_SIDEREAL_DAY_S.
 */
export const EARTH_SIDEREAL_ROTATIONS_PER_LUNAR_ORBIT =
  (MOON_SIDEREAL_ORBIT_DAYS * 86400) / EARTH_SIDEREAL_DAY_S;

/** Excentricidad media de la órbita lunar (elipse). */
export const MOON_ORBIT_ECCENTRICITY = 0.0549;

/** Inclinación de la órbita respecto a la eclíptica (grados). */
export const MOON_ORBIT_INCLINATION_DEG = 5.145;

/** Ratio radios Luna / Tierra (~0,273). */
export const MOON_RADIUS_RATIO = 0.2725;

const MOON_MAP_URL = `${GLOBE_V2_TEXTURE_BASE}/moon_1024.jpg`;

/** Precarga la textura en el bundle cliente para reducir el hueco hasta que la Luna aparezca al montar el Canvas. */
if (typeof window !== 'undefined') {
  try {
    useTexture.preload(MOON_MAP_URL);
  } catch {
    /* noop: preload es best-effort */
  }
}

export type MoonSatelliteProps = {
  /** Radio terrestre en unidades de escena (GlobeV2 ≈ 1). */
  earthRadius?: number;
  /** Semieje mayor de la órbita en las mismas unidades (visual; no escala real ~60 R⊕). */
  orbitSemiMajor?: number;
  /**
   * Escala solo del disco (no de la órbita): 1 = proporción real ~0,27 R⊕.
   */
  moonRadiusScale?: number;
  /**
   * Segundos de reloj para completar una órbita en la escena.
   * El valor real sería ~27,3 × 86400 s; aquí se acelera para ver el movimiento.
   */
  orbitPeriodSeconds?: number;
  /**
   * Giro del plano orbital alrededor del eje Y (radianes). Con cámara en +Z, π suele acercar
   * la Luna al lado izquierdo del encuadre respecto a la fase inicial de la elipse.
   */
  orbitYawRad?: number;
  /** Inclinación del plano orbital (grados); ~5,145° real. */
  orbitInclinationDeg?: number;
  /** Lectura de cráteres / terminador (home cinematográfica). */
  roughness?: number;
  emissiveIntensity?: number;
  /** Home embebida: ocultar la Luna si proyectada fuera del canvas negro. */
  clipToViewport?: boolean;
  /**
   * Si true, la Luna nunca queda entre la cámara y la Tierra: se refleja al hemisferio lejano.
   * Evita tránsitos frontales (lectura de error a ~3,6 R⊕ de cámara).
   */
  keepBehindEarth?: boolean;
  /**
   * Yaw fijo del mapa lunar en el frame que mira a la Tierra (mares / cara conocida).
   * El acoplamiento de marea lo da solo `lookAt`; este offset no gira con la órbita.
   */
  nearSideYawRad?: number;
};

export function MoonSatellite({
  earthRadius = 1,
  orbitSemiMajor = 2.32,
  orbitPeriodSeconds = 140,
  moonRadiusScale = 1,
  orbitYawRad = 0,
  orbitInclinationDeg = MOON_ORBIT_INCLINATION_DEG,
  roughness = 0.94,
  emissiveIntensity = 0.04,
  clipToViewport = false,
  keepBehindEarth = true,
  nearSideYawRad = Math.PI,
}: MoonSatelliteProps) {
  const { camera } = useThree();
  const moonOrbitRootRef = useRef<THREE.Group>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);
  /** Anomalía media M (rad): dM/dt = n = 2π/T; ν y r vía Kepler. */
  const meanAnomalyRef = useRef(0);
  const moonMap = useTexture(MOON_MAP_URL);

  const aux = useMemo(
    () => ({
      worldY: new THREE.Vector3(0, 1, 0),
      worldX: new THREE.Vector3(1, 0, 0),
      radial: new THREE.Vector3(),
      moonWorld: new THREE.Vector3(),
      camWorld: new THREE.Vector3(),
      earthWorld: new THREE.Vector3(),
      camLocal: new THREE.Vector3(),
      toCam: new THREE.Vector3(),
      scratchDir: new THREE.Vector3(),
      scratchOc: new THREE.Vector3(),
      worldScale: new THREE.Vector3(),
      ndc: new THREE.Vector3(),
      invParent: new THREE.Matrix4(),
    }),
    []
  );

  useLayoutEffect(() => {
    moonMap.colorSpace = THREE.SRGBColorSpace;
    moonMap.anisotropy = 8;
    moonMap.needsUpdate = true;
  }, [moonMap]);

  const moonRadius = earthRadius * MOON_RADIUS_RATIO * moonRadiusScale;
  const e = MOON_ORBIT_ECCENTRICITY;
  const inc = (orbitInclinationDeg * Math.PI) / 180;
  const meanMotion = (2 * Math.PI) / Math.max(orbitPeriodSeconds, 1);
  const a = orbitSemiMajor;
  const sqrt1me2 = Math.sqrt(Math.max(0, 1 - e * e));

  useFrame((_state, dt) => {
    const root = moonOrbitRootRef.current;
    if (!root) return;

    meanAnomalyRef.current -= meanMotion * dt;
    let M = meanAnomalyRef.current;
    const twoPi = 2 * Math.PI;
    M = ((M % twoPi) + twoPi) % twoPi;

    /* E - e sin E = M (Newton); plano orbital: eje x hacia periapsis, progrado. */
    let E = M;
    for (let i = 0; i < 14; i++) {
      const f = E - e * Math.sin(E) - M;
      const fp = 1 - e * Math.cos(E);
      E -= f / fp;
    }

    const xOrbit = a * (Math.cos(E) - e);
    const zOrbit = a * sqrt1me2 * Math.sin(E);
    let x = xOrbit;
    let y = zOrbit * Math.sin(inc);
    let z = zOrbit * Math.cos(inc);

    if (orbitYawRad !== 0) {
      const c = Math.cos(orbitYawRad);
      const s = Math.sin(orbitYawRad);
      const xr = x * c + z * s;
      const zr = -x * s + z * c;
      x = xr;
      z = zr;
    }

    const parent = root.parent;
    if (keepBehindEarth && parent) {
      /*
       * Hemisferio lejano respecto a la cámara: si la Luna quedaría entre cámara y Tierra,
       * se refleja al otro lado del plano que pasa por la Tierra ⊥ (cámara→Tierra).
       */
      parent.getWorldPosition(aux.earthWorld);
      camera.getWorldPosition(aux.camWorld);
      aux.invParent.copy(parent.matrixWorld).invert();
      aux.camLocal.copy(aux.camWorld).applyMatrix4(aux.invParent);
      aux.toCam.copy(aux.camLocal).normalize();
      const along = x * aux.toCam.x + y * aux.toCam.y + z * aux.toCam.z;
      if (along > 0) {
        x -= 2 * along * aux.toCam.x;
        y -= 2 * along * aux.toCam.y;
        z -= 2 * along * aux.toCam.z;
      }
    }

    const lenSq = x * x + y * y + z * z;
    if (lenSq < 1e-24) return;

    root.position.set(x, y, z);
    aux.radial.set(-x, -y, -z).normalize();
    /* Evita singularidad de lookAt cuando el radio ≈ paralelo a worldY. */
    if (Math.abs(aux.radial.dot(aux.worldY)) > 0.995) {
      root.up.copy(aux.worldX);
    } else {
      root.up.copy(aux.worldY);
    }
    /* Acoplamiento de marea: una sola cara a la Tierra (sin spin inercial extra). */
    root.lookAt(0, 0, 0);

    const mesh = moonMeshRef.current;
    if (mesh && parent) {
      parent.getWorldPosition(aux.earthWorld);
      parent.getWorldScale(aux.worldScale);
      const worldUniform = Math.max(aux.worldScale.x, aux.worldScale.y, aux.worldScale.z);
      const earthOcclusionRadius =
        (GLOBE_V2_CLOUD_ROOT_SCALE + GLOBE_V2_CLOUD_OUTER_RADIUS_DELTA) * worldUniform * 1.015;

      root.getWorldPosition(aux.moonWorld);
      camera.getWorldPosition(aux.camWorld);

      const occluded = isLunarCenterOccludedByEarthSphere(
        aux.camWorld,
        aux.moonWorld,
        aux.earthWorld,
        earthOcclusionRadius,
        aux.scratchDir,
        aux.scratchOc
      );
      let inViewport = true;
      if (clipToViewport) {
        aux.ndc.copy(aux.moonWorld).project(camera);
        const margin = 0.08;
        inViewport =
          aux.ndc.z > 0 &&
          aux.ndc.z < 1 &&
          aux.ndc.x >= -1 + margin &&
          aux.ndc.x <= 1 - margin &&
          aux.ndc.y >= -1 + margin &&
          aux.ndc.y <= 1 - margin;
      }
      mesh.visible = !occluded && inViewport;
    }
  });

  return (
    <group ref={moonOrbitRootRef} name="AM_moonOrbitRoot">
      {/*
        La Luna debe dibujarse después de la capa opaca (tierra + océano, renderOrder 0 y 1 en EarthGroup).
        Si va antes (p. ej. -20), escribe profundidad y las nubes (transparentes, sin depthWrite) no la
        actualizan: el z-buffer puede seguir “en la Luna” y se ven fragmentos al pasar detrás del disco.
        Fase: MeshStandardMaterial recibe el mismo directionalLight (sol) que la Tierra.
      */}
      <mesh
        ref={(m) => {
          moonMeshRef.current = m;
          if (m) m.raycast = () => {};
        }}
        name="AM_moonMesh"
        renderOrder={2}
        rotation={[0, nearSideYawRad, 0]}
      >
        <sphereGeometry args={[moonRadius, 52, 52]} />
        <meshStandardMaterial
          map={moonMap}
          roughness={roughness}
          metalness={0}
          emissive="#0a0a12"
          emissiveIntensity={emissiveIntensity}
          depthTest
          depthWrite
        />
      </mesh>
    </group>
  );
}
