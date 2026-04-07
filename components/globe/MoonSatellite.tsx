'use client';

/**
 * Luna en órbita geocéntrica: elipse (e ≈ 0,055), plano con inclinación ~5,145° (eclíptica) y yaw opcional.
 * Posición: anomalía media M con n = 2π/T y ecuación de Kepler → E → coords perifocales (mismo `dt` que la Tierra).
 * Traslación en sentido progrado respecto a la Tierra (coherente con el giro del globo en escena).
 * Orientación: el grupo raíz traslada + `lookAt(0,0,0)` (eje +Z hacia la Tierra). Hijo con giro en Y a velocidad n = 2π/T:
 * bloqueo mareal (misma cara a la Tierra) y a la vez se percibe rotación sobre el eje local como en la Tierra.
 * Si el radio casi alinea con `up`, se usa un eje auxiliar estable (misma idea que el antiguo `makeBasis`).
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
   * Escala solo del disco (no de la órbita): valores &lt;1 hacen la Luna más pequeña en pantalla
   * sin acercar la Tierra; útil porque una órbita “corta” agranda mucho el ángulo aparente.
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
  /** Inclinación del plano orbital (grados); más grados = más barrido en Y y lectura 3D frente a cámara en +Z. */
  orbitInclinationDeg?: number;
  /** Lectura de cráteres / terminador (home cinematográfica). */
  roughness?: number;
  emissiveIntensity?: number;
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
}: MoonSatelliteProps) {
  const { camera } = useThree();
  const moonOrbitRootRef = useRef<THREE.Group>(null);
  /** Giro propio sobre Y local (polos), hijo del grupo que ya mira a la Tierra. */
  const moonSpinAboutAxisRef = useRef<THREE.Group>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);
  /** Anomalía media M (rad): dM/dt = n = 2π/T; ν y r vía Kepler (elipse coherente con el período sidereal). */
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
      scratchDir: new THREE.Vector3(),
      scratchOc: new THREE.Vector3(),
      worldScale: new THREE.Vector3(),
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
    const y = zOrbit * Math.sin(inc);
    let z = zOrbit * Math.cos(inc);

    if (orbitYawRad !== 0) {
      const c = Math.cos(orbitYawRad);
      const s = Math.sin(orbitYawRad);
      const xr = x * c + z * s;
      const zr = -x * s + z * c;
      x = xr;
      z = zr;
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
    root.lookAt(0, 0, 0);

    const spin = moonSpinAboutAxisRef.current;
    if (spin) {
      spin.rotation.y -= meanMotion * dt;
    }

    const mesh = moonMeshRef.current;
    const parent = root.parent;
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
      mesh.visible = !occluded;
    }
  });

  return (
    <group ref={moonOrbitRootRef} name="AM_moonOrbitRoot">
      {/*
        La Luna debe dibujarse después de la capa opaca (tierra + océano, renderOrder 0 y 1 en EarthGroup).
        Si va antes (p. ej. -20), escribe profundidad y las nubes (transparentes, sin depthWrite) no la
        actualizan: el z-buffer puede seguir “en la Luna” y se ven fragmentos al pasar detrás del disco.
      */}
      <group ref={moonSpinAboutAxisRef} name="AM_moonAxisSpin">
        <mesh
          ref={(m) => {
            moonMeshRef.current = m;
            if (m) m.raycast = () => {};
          }}
          name="AM_moonMesh"
          renderOrder={2}
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
    </group>
  );
}
