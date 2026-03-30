'use client';

/**
 * Luna en órbita geocéntrica, trayectoria elíptica (e ≈ 0,055), plano ligeramente inclinado (~5,1°).
 *
 * **Escenario docente (GlobeV2):** resonancia rotación–órbita por acoplamiento de mareas *mutuo*:
 * órbita sidérea ~47 d (véase `MOON_MUTUAL_LOCK_SIDEREAL_DAYS`) frente a ~27,3 d actuales (`MOON_SIDEREAL_ORBIT_DAYS`);
 * la Tierra usa la misma ω y el mismo `clock.elapsedTime` que ν en la elipse; la fase en Y la fija
 * `globeV2TidalLockEarthRotationY` en `GlobeV2` (+ν si `orbitYawRad===0`, π+ν si el yaw es π), con `zOrbit = −r sin ν`.
 */

import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GLOBE_V2_TEXTURE_BASE } from '@/lib/globe/globe-v2-assets';

/** Período sidéreo actual (una vuelta respecto a las estrellas), en días terrestres. */
export const MOON_SIDEREAL_ORBIT_DAYS = 27.321661;

/**
 * Órbita sidérea en el escenario de bloqueo mareal mutuo (Tierra–Luna siempre la misma cara),
 * en días terrestres (~47 d frente a ~27,3 d actuales). Solo referencia narrativa + proporción en GlobeV2.
 */
export const MOON_MUTUAL_LOCK_SIDEREAL_DAYS = 47;

/** Excentricidad media de la órbita lunar (elipse). */
export const MOON_ORBIT_ECCENTRICITY = 0.0549;

/** Inclinación de la órbita respecto a la eclíptica (grados). */
export const MOON_ORBIT_INCLINATION_DEG = 5.145;

/** Ratio radios Luna / Tierra (~0,273). */
export const MOON_RADIUS_RATIO = 0.2725;

const MOON_MAP_URL = `${GLOBE_V2_TEXTURE_BASE}/moon_1024.jpg`;

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
};

export function MoonSatellite({
  earthRadius = 1,
  orbitSemiMajor = 2.32,
  orbitPeriodSeconds = 140,
  moonRadiusScale = 1,
  orbitYawRad = 0,
}: MoonSatelliteProps) {
  const groupRef = useRef<THREE.Group>(null);
  const moonMap = useTexture(MOON_MAP_URL);

  useLayoutEffect(() => {
    moonMap.colorSpace = THREE.SRGBColorSpace;
    moonMap.anisotropy = 8;
    moonMap.needsUpdate = true;
  }, [moonMap]);

  const moonRadius = earthRadius * MOON_RADIUS_RATIO * moonRadiusScale;
  const e = MOON_ORBIT_ECCENTRICITY;
  const inc = (MOON_ORBIT_INCLINATION_DEG * Math.PI) / 180;
  const omega = (2 * Math.PI) / Math.max(orbitPeriodSeconds, 1);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;

    const nu = omega * clock.elapsedTime;
    const r = (orbitSemiMajor * (1 - e * e)) / (1 + e * Math.cos(nu));

    /* −sin ν: órbita prograde (vista desde el norte celeste) coherente con giro terrestre oeste→este en GlobeV2. */
    const xOrbit = r * Math.cos(nu);
    const zOrbit = -r * Math.sin(nu);
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

    g.position.set(x, y, z);
    g.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <mesh renderOrder={6} name="Moon">
        <sphereGeometry args={[moonRadius, 40, 40]} />
        <meshStandardMaterial
          map={moonMap}
          roughness={0.94}
          metalness={0}
          emissive="#0a0a12"
          emissiveIntensity={0.04}
        />
      </mesh>
    </group>
  );
}
