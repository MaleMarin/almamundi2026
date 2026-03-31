'use client';

/**
 * Luna en órbita geocéntrica: elipse (e ≈ 0,055), plano con inclinación ~5,145° (eclíptica) y yaw opcional.
 * Posición: anomalía media M con n = 2π/T y ecuación de Kepler → E → coords perifocales (mismo `dt` que la Tierra).
 * Traslación en sentido progrado (antihorario visto desde el polo norte / +Y).
 * Orientación: +Z local hacia la Tierra → misma cara visible (1 giro propio por órbita sideral, sin spin libre).
 * `makeBasis` + eje mundial estable evita twist; `setFromUnitVectors` dejaba roll arbitrario sobre el radial.
 */

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GLOBE_V2_TEXTURE_BASE } from '@/lib/globe/globe-v2-assets';

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
};

export function MoonSatellite({
  earthRadius = 1,
  orbitSemiMajor = 2.32,
  orbitPeriodSeconds = 140,
  moonRadiusScale = 1,
  orbitYawRad = 0,
  orbitInclinationDeg = MOON_ORBIT_INCLINATION_DEG,
}: MoonSatelliteProps) {
  const moonOrbitRootRef = useRef<THREE.Group>(null);
  /** Anomalía media M (rad): dM/dt = n = 2π/T; ν y r vía Kepler (elipse coherente con el período sidereal). */
  const meanAnomalyRef = useRef(0);
  const moonMap = useTexture(MOON_MAP_URL);

  const aux = useMemo(
    () => ({
      dirToEarth: new THREE.Vector3(),
      side: new THREE.Vector3(),
      moonUp: new THREE.Vector3(),
      mat: new THREE.Matrix4(),
      worldY: new THREE.Vector3(0, 1, 0),
      worldX: new THREE.Vector3(1, 0, 0),
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

    meanAnomalyRef.current += meanMotion * dt;
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

    root.position.set(x, y, z);

    /* Luna → Tierra (normalizado); +Z local del grupo apunta a la Tierra. */
    aux.dirToEarth.set(-x, -y, -z);
    const lenSq = aux.dirToEarth.lengthSq();
    if (lenSq < 1e-24) return;
    aux.dirToEarth.multiplyScalar(1 / Math.sqrt(lenSq));

    /*
     * Base ortonormal estable: “side” ⟂ dirToEarth usando world Y (o X si el radio ≈ paralelo al polo).
     * Así no hay grado de libertad de roll arbitrario frame a frame (problema de setFromUnitVectors).
     */
    aux.side.crossVectors(aux.worldY, aux.dirToEarth);
    if (aux.side.lengthSq() < 1e-12) {
      aux.side.crossVectors(aux.worldX, aux.dirToEarth);
    }
    aux.side.normalize();
    aux.moonUp.crossVectors(aux.dirToEarth, aux.side).normalize();

    aux.mat.makeBasis(aux.side, aux.moonUp, aux.dirToEarth);
    root.quaternion.setFromRotationMatrix(aux.mat);
  });

  return (
    <group ref={moonOrbitRootRef} name="AM_moonOrbitRoot">
      {/*
        renderOrder bajo: la Luna se dibuja antes que la Tierra (órdenes ≥ 0 en EarthGroup).
        Así el z-buffer de océano/tierra tapa la Luna cuando va detrás del disco; si se pintara
        después, capas transparentes (nubes sin depthWrite) podían dejar ver la Luna a través del globo.
      */}
      <mesh
        ref={(m) => {
          if (m) m.raycast = () => {};
        }}
        name="AM_moonMesh"
        renderOrder={-20}
      >
        <sphereGeometry args={[moonRadius, 40, 40]} />
        <meshStandardMaterial
          map={moonMap}
          roughness={0.94}
          metalness={0}
          emissive="#0a0a12"
          emissiveIntensity={0.04}
          depthTest
          depthWrite
        />
      </mesh>
    </group>
  );
}
