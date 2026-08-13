'use client';

/**
 * GlobeV2 — R3F + drei: Tierra + Luna, tiempo real UTC.
 *
 * Tierra: inclinación axial ~23,44° (eje Z, marco inercial); `planetSpinRef.rotation.y` = GMST (giro diario sobre el eje inclinado).
 * Reloj Tierra+Sol: `getEarthSceneDate()` (UTC acelerado con `GLOBE_V2_EARTH_VISUAL_TIME_SCALE` / prop). Luna en tiempo real.
 *
 * Luna: órbita geocéntrica fuera del grupo inclinado; plano ~5,145°; traslación prograda; cara fija a Tierra.
 *
 * `embedded`: home `#mapa` — `forceDaylight` por defecto salvo `forceDaylight={false}` (terminador UTC + halo tipo referencia órbita). Página completa: /globo-v2 sin `embedded`.
 */

import type { RefObject } from 'react';
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GlobeBitsLayer, type GlobeBitMarker } from '@/components/globe/GlobeBitsLayer';
import { MoonSatellite, MOON_ORBIT_INCLINATION_DEG } from '@/components/globe/MoonSatellite';
import { ProceduralStarfield } from '@/components/globe/ProceduralStarfield';
import {
  computeSunDirection,
  createAtmosphereGlowMaterial,
  createCityLightsOverlayMaterial,
} from '@/components/globe/dayNightMaterial';
import {
  createLandSphereMaterial,
  createOceanSphereMaterial,
} from '@/components/globe/globeOceanLandMaterials';
import {
  applyGlobeV2CameraPreset,
  createGlobeV2NeutralHeightTexture,
  GLOBE_V2_ATMOSPHERE_SCALE,
  GLOBE_V2_CITY_LIGHTS_SCALE,
  GLOBE_V2_CITY_LIGHTS_STRENGTH_DAY,
  GLOBE_V2_CITY_LIGHTS_STRENGTH_NIGHT,
  GLOBE_V2_CLOUD_DRIFT_RAD_PER_SEC,
  GLOBE_V2_CLOUD_OPACITY_DAY,
  GLOBE_V2_CLOUD_OPACITY_NIGHT,
  GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_DAY,
  GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_NIGHT,
  GLOBE_V2_CLOUD_OUTER_RADIUS_DELTA,
  GLOBE_V2_CLOUD_OUTER_Y_ROT_RAD,
  GLOBE_V2_CLOUD_ROOT_SCALE,
  GLOBE_V2_CLOUD_SPHERE_SEGMENTS,
  GLOBE_V2_CLOUD_UNDERLAY_OPACITY_FACTOR,
  GLOBE_V2_CLOUD_UNDERLAY_RADIUS_DELTA,
  GLOBE_V2_DISPLACEMENT_SCALE_DEFAULT,
  GLOBE_V2_LAND_RADIUS,
  GLOBE_V2_OCEAN_RADIUS,
  GLOBE_V2_TEXTURE_URLS,
  type GlobeV2CameraPreset,
  type GlobeV2LayerBuildStage,
  type GlobeV2OceanSunDebug,
  type GlobeV2TextureUrls,
} from '@/lib/globe/globe-v2-assets';
import { useViewerSolarNight } from '@/hooks/useViewerSolarNight';
import { latLngToCartesianThetaLon } from '@/lib/globe-coords';
import { earthGreenwichSpinYRadFromUtc, sunDayFactorAtLocation } from '@/lib/sunPosition';
import {
  AUTO_ROTATE_HOVER_SPEED,
  AUTO_ROTATE_IDLE_SPEED,
  AUTO_ROTATE_NEAR_GLOBE_CENTER_SPEED,
  AUTO_ROTATE_PANEL_SPEED,
  AUTO_ROTATE_POINTER_SPEED,
  AUTO_ROTATE_PROXIMITY_BLEND_DIST,
  MAGNETIC_SPIN_RATE_SMOOTH,
  type GlobeBitInteractionStore,
} from '@/lib/globe/globe-bits-magnetic-config';
import earthNightStyles from '@/components/globe/globe-earth-night.module.css';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/**
 * El raycaster de R3F elige el impacto más cercano; océano/tierra/nubes están delante de los bits
 * en el mismo rayo y se comían el clic. OrbitControls usa eventos DOM: con Tierra girando, desactivamos
 * `enableRotate` al pasar sobre un bit y capturamos el puntero en `pointerdown` (ver `GlobeBitsLayer`).
 */
function stripGlobeMeshRaycast(mesh: THREE.Mesh | null) {
  if (mesh) mesh.raycast = () => {};
}

/**
 * Home embebida: escala Tierra + Luna + bits a la vez (1 = tamaño de referencia).
 * &gt;1 acerca el disco al encuadre del mapa en `#mapa`.
 */
const GLOBE_V2_EMBEDDED_GEO_SCALE = 1.06;

/** Inclinación axial terrestre (oblicuidad eclíptica). Eje Z = convención NASA / MapFullPage (~0,41 rad). */
const EARTH_AXIAL_TILT_DEG = 23.44;
const EARTH_AXIAL_TILT_RAD = THREE.MathUtils.degToRad(EARTH_AXIAL_TILT_DEG);
/** @deprecated alias interno */
const GLOBE_V2_EARTH_OBLIQUITY_RAD = EARTH_AXIAL_TILT_RAD;

/**
 * Desfase opcional si el meridiano 0 de la textura no coincide con el astronómico (casi siempre 0).
 * Validación Chile: `isNightAtLocation(-33.45, -70.67, new Date())` vs. cielo real en America/Santiago.
 */
const GLOBE_V2_GMST_TEXTURE_OFFSET_RAD = 0;

/**
 * Reloj acelerado solo para Tierra + dirección solar (terminador coherente).
 * `1` = tiempo real; valores altos = giro más visible (86164 s sidéreos / scale ≈ segundos reales por vuelta).
 * La Luna sigue en tiempo real (`Date.now()` en MoonSatellite).
 */
const GLOBE_V2_EARTH_VISUAL_TIME_SCALE = 1050;

/**
 * Segundos de escena para 1 órbita sidereal lunar (solo `MoonSatellite`).
 * Home: ~7 min — contemplativo, aún legible. Antes: 218 s (~3,6 min).
 */
const GLOBE_V2_MOON_ORBIT_BASE_S = { embedded: 420, full: 300 } as const;

/** Semieje mayor orbital (Tierra R⊕ ≈ 1). Más lejos = menos “juguete” y cabe detrás del disco. */
const GLOBE_V2_MOON_ORBIT_SEMI_MAJOR = { embedded: 2.55, full: 3.58 } as const;

/**
 * Escala del disco: 1 = ~0,27 R⊕ real. Home 0,92 ≈ proporción creíble sin puntito.
 * (Antes 0,42 con órbita 1,52 → disco cercano y “de juguete”.)
 */
const GLOBE_V2_MOON_DISC_SCALE = { embedded: 0.92, full: 0.85 } as const;

/** Inclinación del plano orbital respecto a la eclíptica (~5,145°). */
const GLOBE_V2_MOON_ORBIT_INCLINATION_DEG = MOON_ORBIT_INCLINATION_DEG;

/** Fase inicial del plano en Y (solo encuadre: home ≈ Luna arriba-izquierda respecto al disco). */
const GLOBE_V2_MOON_ORBIT_YAW_RAD = { embedded: Math.PI * 0.82, full: 0 } as const;

/** Home: misma inclinación realista ~5° (antes 2,85° para no salir del recorte). */
const GLOBE_V2_MOON_INCLINATION_EMBEDDED_DEG = MOON_ORBIT_INCLINATION_DEG;

/** Cámara / target en home: Tierra más abajo-derecha (offset pantalla). Target menos bajo para no recortar el disco por arriba en el canvas. */
const GLOBE_V2_EMBEDDED_CAM_POSITION: [number, number, number] = [0.14, 0.18, 0];
const GLOBE_V2_EMBEDDED_ORBIT_TARGET: [number, number, number] = [0, -0.02, 0];
const GLOBE_V2_FULL_ORBIT_TARGET: [number, number, number] = [0, 0, 0];

export type { GlobeBitMarker };
export type { GlobeV2CameraPreset };
export type { GlobeV2LayerBuildStage, GlobeV2OceanSunDebug } from '@/lib/globe/globe-v2-assets';

/** Blue Marble coherente (Three r182): día 4k, nubes y luces emparejadas, normal 2k. */
export const GLOBE_V2_DEFAULT_TEXTURES = GLOBE_V2_TEXTURE_URLS;

export type { GlobeV2TextureUrls };

/**
 * Validación visual desacoplada (/globo-validacion, test binario A/B/C):
 * - `surface` (A): solo GlobeDayNightSurface + nubes Standard; sin GlobeAtmosphereGlow, sin luces overlay, sin bits.
 * - `nightLights` (B): A + GlobeCityLightsOverlay.
 * - `full` (C): B + GlobeAtmosphereGlow + GlobeBitsLayer (GlobeBitStarBurst / Selected).
 */
export type GlobeV2VisualStage = 'surface' | 'nightLights' | 'full';

function ExposureSync({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  useLayoutEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

/**
 * Encuadre fijo para validación: aplica lat/lon sobre la esfera (misma convención que bits).
 * Con preset activo, `GlobeScene` no incrementa `planetSpinRef` (corteza fija).
 */
function CameraPresetRig({
  preset,
  distance,
}: {
  preset: GlobeV2CameraPreset;
  distance: number;
}) {
  const { camera, controls } = useThree();
  /* makeDefault en drei registra `controls` en un useEffect; aplicar después de que exista. */
  useEffect(() => {
    if (!controls) return;
    applyGlobeV2CameraPreset(
      camera as THREE.PerspectiveCamera,
      controls as unknown as OrbitControlsImpl,
      preset,
      distance
    );
  }, [camera, controls, preset, distance]);
  return null;
}

/**
 * Encuadre inicial hacia lat/lng.
 * `alignToSun`: si true, sesga la cámara hacia/contra el sol (modo astronómico).
 * En home embedded va en false: LatAm de frente, sin sesgo.
 */
function InitialViewRig({
  lat,
  lng,
  distance,
  orbitTarget,
  alignToSun = true,
}: {
  lat: number;
  lng: number;
  distance: number;
  orbitTarget: [number, number, number];
  alignToSun?: boolean;
}) {
  const { camera, controls } = useThree();
  const sunScratch = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    if (!controls) return;
    const p = latLngToCartesianThetaLon(lat, lng, 1);
    const surfaceN = new THREE.Vector3(p.x, p.y, p.z).normalize();
    const camDir = surfaceN.clone();
    if (alignToSun) {
      const now = new Date();
      computeSunDirection(now, EARTH_AXIAL_TILT_RAD, sunScratch);
      const dayFactor = sunDayFactorAtLocation(lat, lng, now);
      if (dayFactor > 0.2) {
        camDir.addScaledVector(sunScratch, 0.72).normalize();
      } else {
        camDir.addScaledVector(sunScratch, -0.38).normalize();
      }
    }
    camera.position.copy(camDir.multiplyScalar(distance));
    const c = controls as unknown as OrbitControlsImpl;
    c.target.set(orbitTarget[0], orbitTarget[1], orbitTarget[2]);
    c.update();
  }, [camera, controls, lat, lng, distance, orbitTarget, sunScratch, alignToSun]);
  return null;
}

/**
 * Sol editorial: arriba-izquierda respecto a la cámara (~30–40° del eje cámara→globo).
 * Desacoplado del reloj acelerado; la cara visible permanece lit al orbitar.
 */
function aestheticSunDirFromCamera(
  camera: THREE.Camera,
  orbitTarget: THREE.Vector3,
  out: THREE.Vector3,
  rightScratch: THREE.Vector3,
  upScratch: THREE.Vector3
): THREE.Vector3 {
  camera.updateMatrixWorld();
  camera.getWorldPosition(out);
  out.sub(orbitTarget).normalize(); // desde el globo hacia la cámara
  rightScratch.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  upScratch.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  // Mezcla: cara a cámara + arriba − derecha ≈ 35° hacia arriba-izquierda
  out.addScaledVector(upScratch, 0.52).addScaledVector(rightScratch, -0.42).normalize();
  return out;
}

/** Más segmentos = relieve del mapa normal más suave (sigue razonable en home). */
/** Más segmentos = displacement + normales más suaves (coste GPU mayor). */
const EARTH_SEGMENTS = 240;

function setTextureQuality(t: THREE.Texture, colorSpace: THREE.ColorSpace, anisotropy: number) {
  t.colorSpace = colorSpace;
  t.anisotropy = anisotropy;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
}

/**
 * Clon del mapa de luces sin mipmaps → menos manchas cuadradas y “focos” falsos en mar abierto.
 * La textura original sigue igual para el material de día (emissive).
 */
function cloneLightsMapLinear(src: THREE.Texture): THREE.Texture {
  const c = src.clone();
  c.generateMipmaps = false;
  c.minFilter = THREE.LinearFilter;
  c.magFilter = THREE.LinearFilter;
  c.wrapS = THREE.ClampToEdgeWrapping;
  c.wrapT = THREE.ClampToEdgeWrapping;
  c.needsUpdate = true;
  return c;
}

/** Sincroniza sol, cámara y tiempo con OceanSphere / LandSphere / luces. */
function SyncSunToGlobe({
  oceanMat,
  landMat,
  cityLightsMat,
  sunLightRef,
  syncLand,
  syncCityLights,
  oceanSunDebug,
  obliquityXRad,
  getEarthSceneDate,
  cameraRelativeSun = false,
  orbitTarget,
}: {
  oceanMat: THREE.ShaderMaterial;
  landMat: THREE.ShaderMaterial | null;
  cityLightsMat: THREE.ShaderMaterial | null;
  sunLightRef: RefObject<THREE.DirectionalLight | null>;
  syncLand: boolean;
  syncCityLights: boolean;
  oceanSunDebug: GlobeV2OceanSunDebug;
  obliquityXRad: number;
  getEarthSceneDate: () => Date;
  /** Home: sol editorial fijo respecto a la cámara (no usa reloj acelerado). */
  cameraRelativeSun?: boolean;
  orbitTarget: [number, number, number];
}) {
  const { camera } = useThree();
  const camWorld = useMemo(() => new THREE.Vector3(), []);
  const sunScratch = useMemo(() => new THREE.Vector3(), []);
  const rightScratch = useMemo(() => new THREE.Vector3(), []);
  const upScratch = useMemo(() => new THREE.Vector3(), []);
  const targetScratch = useMemo(
    () => new THREE.Vector3(orbitTarget[0], orbitTarget[1], orbitTarget[2]),
    [orbitTarget]
  );

  useFrame(() => {
    camera.getWorldPosition(camWorld);
    const s = cameraRelativeSun
      ? aestheticSunDirFromCamera(camera, targetScratch, sunScratch, rightScratch, upScratch)
      : computeSunDirection(getEarthSceneDate(), obliquityXRad, sunScratch);
    const uSunO = oceanMat.uniforms.uSunDir as { value: THREE.Vector3 };
    uSunO.value.copy(s);
    const uUseOv = oceanMat.uniforms.uUseSunOverride as { value: number } | undefined;
    const uOvDir = oceanMat.uniforms.uSunDirOverride as { value: THREE.Vector3 } | undefined;
    if (uUseOv && uOvDir) {
      if (oceanSunDebug === 'front') {
        uUseOv.value = 1;
        uOvDir.value.set(1, 0, 0);
      } else if (oceanSunDebug === 'side') {
        uUseOv.value = 1;
        uOvDir.value.set(0, 1, 0);
      } else {
        uUseOv.value = 0;
      }
    }
    const uCamO = oceanMat.uniforms.uCamPos as { value: THREE.Vector3 };
    uCamO.value.copy(camWorld);

    if (syncLand && landMat) {
      const uSunL = landMat.uniforms.uSunDir as { value: THREE.Vector3 };
      uSunL.value.copy(s);
      const uCamL = landMat.uniforms.uCamPos as { value: THREE.Vector3 };
      uCamL.value.copy(camWorld);
    }

    if (syncCityLights && cityLightsMat) {
      const uCity = cityLightsMat.uniforms.uSunDir as { value: THREE.Vector3 };
      uCity.value.copy(s);
    }

    const L = sunLightRef.current;
    if (L) {
      const k = 14;
      L.position.set(s.x * k, s.y * k, s.z * k);
    }
  });
  return null;
}

/** Limbo muy suave ~light blue (referencia satélite); fondo de la página sigue negro. */
function AtmosphereGlow({
  scale,
  fullDay,
  obliquityXRad,
  getEarthSceneDate,
  homeCinematic,
  cameraRelativeSun = false,
  orbitTarget,
}: {
  scale: number;
  fullDay: boolean;
  obliquityXRad: number;
  getEarthSceneDate: () => Date;
  /** Home `#mapa`: halo azul más legible (foto órbita / NASA). */
  homeCinematic?: boolean;
  cameraRelativeSun?: boolean;
  orbitTarget: [number, number, number];
}) {
  const { camera } = useThree();
  const mat = useMemo(
    () =>
      createAtmosphereGlowMaterial(
        homeCinematic
          ? {
              // Halo tipo foto orbital: limbo intenso + soft outer; cálido leve al sol.
              // Intento 2 ISS: scale 1.022, power 5.8, alpha máx ~0.16.
              intensity: 0.075,
              power: 5.8,
              innerColor: 0x5aa8ff,
              outerColor: 0x081828,
              warmColor: 0xffd0b0,
            }
          : undefined
      ),
    [homeCinematic]
  );
  const camWorld = useMemo(() => new THREE.Vector3(), []);
  const sunScratch = useMemo(() => new THREE.Vector3(), []);
  const rightScratch = useMemo(() => new THREE.Vector3(), []);
  const upScratch = useMemo(() => new THREE.Vector3(), []);
  const targetScratch = useMemo(
    () => new THREE.Vector3(orbitTarget[0], orbitTarget[1], orbitTarget[2]),
    [orbitTarget]
  );

  useFrame(() => {
    camera.getWorldPosition(camWorld);
    (mat.uniforms.uCamPos as { value: THREE.Vector3 }).value.copy(camWorld);
    if (cameraRelativeSun) {
      aestheticSunDirFromCamera(camera, targetScratch, sunScratch, rightScratch, upScratch);
    } else {
      computeSunDirection(getEarthSceneDate(), obliquityXRad, sunScratch);
    }
    (mat.uniforms.uSunDir as { value: THREE.Vector3 }).value.copy(sunScratch);
    (mat.uniforms.uFullDay as { value: number }).value = fullDay ? 1 : 0;
  });

  useLayoutEffect(() => {
    return () => mat.dispose();
  }, [mat]);

  /* Tras nubes (3–6). depthTest false: ver createAtmosphereGlowMaterial. */
  return (
    <mesh ref={stripGlobeMeshRaycast} scale={scale} renderOrder={8}>
      <sphereGeometry args={[1, 72, 72]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function setHeightTextureParams(t: THREE.Texture, maxAniso: number) {
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = maxAniso;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
}

function EarthGroup({
  urls,
  viewerNight,
  sunLightRef,
  visualStage,
  displacementScale,
  layerBuildStage,
  oceanSunDebug,
  fullDaySurface,
  obliquityXRad,
  getEarthSceneDate,
  embedded,
  cameraRelativeSun = false,
  orbitTarget,
  spinRateRef,
}: {
  urls: GlobeV2TextureUrls;
  viewerNight: boolean;
  sunLightRef: RefObject<THREE.DirectionalLight | null>;
  visualStage: GlobeV2VisualStage;
  displacementScale: number;
  layerBuildStage: GlobeV2LayerBuildStage;
  oceanSunDebug: GlobeV2OceanSunDebug;
  /** Terminador UTC apagado: disco completo con albedo/luz de día (`forceDaylight`). */
  fullDaySurface: boolean;
  obliquityXRad: number;
  getEarthSceneDate: () => Date;
  embedded?: boolean;
  cameraRelativeSun?: boolean;
  orbitTarget: [number, number, number];
  /** Mismo factor que modula GMST en GlobeScene (hover/proximidad). */
  spinRateRef: RefObject<number>;
}) {
  const { gl } = useThree();
  const allowVertexTextureFetch = useMemo(() => {
    const ctx = gl.getContext();
    if (!ctx) return false;
    try {
      return (ctx.getParameter(ctx.MAX_VERTEX_TEXTURE_IMAGE_UNITS) as number) > 0;
    } catch {
      return false;
    }
  }, [gl]);

  const showLand =
    layerBuildStage === 'land' ||
    layerBuildStage === 'ocean_land' ||
    layerBuildStage === 'ocean_land_clouds' ||
    layerBuildStage === 'ocean_land_clouds_atmosphere' ||
    layerBuildStage === 'full';
  const showOcean =
    layerBuildStage === 'ocean' ||
    layerBuildStage === 'ocean_land' ||
    layerBuildStage === 'ocean_land_clouds' ||
    layerBuildStage === 'ocean_land_clouds_atmosphere' ||
    layerBuildStage === 'full';
  const showClouds =
    layerBuildStage === 'ocean_land_clouds' ||
    layerBuildStage === 'ocean_land_clouds_atmosphere' ||
    layerBuildStage === 'full';
  const showAtmosphere =
    layerBuildStage === 'ocean_land_clouds_atmosphere' || layerBuildStage === 'full';
  const showNightLightsLayer =
    layerBuildStage === 'full' && visualStage !== 'surface' && !fullDaySurface;

  /** Path crítico: day + luces + normal (sin nubes 4K, ~1.2 MB diferidas). */
  const [dayMap, lightsMap, normalMap] = useTexture([urls.day, urls.nightLights, urls.normal]);

  const [cloudMap, setCloudMap] = useState<THREE.Texture | null>(null);
  const cloudDriftRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!showClouds) {
      setCloudMap((prev) => {
        if (prev) prev.dispose();
        return null;
      });
      return;
    }
    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;
    const maxA = Math.min(16, gl.capabilities.getMaxAnisotropy?.() ?? 16);

    const startLoad = () => {
      new THREE.TextureLoader().load(
        urls.clouds,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          setTextureQuality(tex, THREE.SRGBColorSpace, maxA);
          setCloudMap((prev) => {
            if (prev) prev.dispose();
            return tex;
          });
        },
        undefined,
        () => {
          /* fallido: globo sigue sin nubes */
        }
      );
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(startLoad, { timeout: 2200 });
    } else {
      timeoutId = window.setTimeout(startLoad, 450);
    }

    return () => {
      cancelled = true;
      if (idleId && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [showClouds, urls.clouds, gl]);

  useFrame((_, dt) => {
    if (!cloudDriftRef.current) return;
    /* Mismo frenado que planetSpin (hover/proximidad); si no, las nubes siguen a velocidad idle sobre el mar. */
    const rate = spinRateRef.current ?? 1;
    cloudDriftRef.current.rotation.y += GLOBE_V2_CLOUD_DRIFT_RAD_PER_SEC * dt * rate;
  });

  const neutralHeightTex = useMemo(() => createGlobeV2NeutralHeightTexture(), []);
  const remoteHeightRef = useRef<THREE.Texture | null>(null);
  const [heightTex, setHeightTex] = useState<THREE.Texture>(() => neutralHeightTex);

  useEffect(() => {
    if (!urls.heightMap) {
      if (remoteHeightRef.current) {
        remoteHeightRef.current.dispose();
        remoteHeightRef.current = null;
      }
      setHeightTex(neutralHeightTex);
      return;
    }
    let cancelled = false;
    const maxA = Math.min(16, gl.capabilities.getMaxAnisotropy?.() ?? 16);
    new THREE.TextureLoader().load(
      urls.heightMap,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        if (remoteHeightRef.current) remoteHeightRef.current.dispose();
        remoteHeightRef.current = tex;
        setHeightTextureParams(tex, maxA);
        setHeightTex(tex);
      },
      undefined,
      () => {
        if (!cancelled) setHeightTex(neutralHeightTex);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [urls.heightMap, gl, neutralHeightTex]);

  const oceanGeometry = useMemo(() => {
    const g = new THREE.SphereGeometry(GLOBE_V2_OCEAN_RADIUS, EARTH_SEGMENTS, EARTH_SEGMENTS);
    return g;
  }, []);

  const landGeometry = useMemo(() => {
    const g = new THREE.SphereGeometry(GLOBE_V2_LAND_RADIUS, EARTH_SEGMENTS, EARTH_SEGMENTS);
    g.computeTangents();
    return g;
  }, []);

  useLayoutEffect(() => {
    const maxA = Math.min(16, gl.capabilities.getMaxAnisotropy?.() ?? 16);
    setTextureQuality(dayMap, THREE.SRGBColorSpace, maxA);
    setTextureQuality(lightsMap, THREE.SRGBColorSpace, maxA);
    normalMap.colorSpace = THREE.NoColorSpace;
    normalMap.anisotropy = maxA;
    normalMap.generateMipmaps = true;
    normalMap.minFilter = THREE.LinearMipmapLinearFilter;
    normalMap.magFilter = THREE.LinearFilter;
    normalMap.wrapS = THREE.ClampToEdgeWrapping;
    normalMap.wrapT = THREE.ClampToEdgeWrapping;
    normalMap.needsUpdate = true;
  }, [gl, dayMap, lightsMap, normalMap]);

  const cloudOpacity = viewerNight ? GLOBE_V2_CLOUD_OPACITY_NIGHT : GLOBE_V2_CLOUD_OPACITY_DAY;
  const cloudOuterOpacityFactor = viewerNight
    ? GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_NIGHT
    : GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_DAY;

  const cloudMaterial = useMemo(() => {
    if (!cloudMap) return null;
    return new THREE.MeshStandardMaterial({
      map: cloudMap,
      transparent: true,
      opacity: cloudOpacity,
      depthWrite: false,
      blending: THREE.NormalBlending,
      premultipliedAlpha: false,
      roughness: 1,
      metalness: 0,
      color: viewerNight ? new THREE.Color(0.88, 0.9, 0.94) : new THREE.Color(0xffffff),
      emissive: new THREE.Color(0xb8c8dc),
      emissiveIntensity: viewerNight ? 0.01 : 0.035,
    });
  }, [cloudMap, cloudOpacity, viewerNight]);

  const cloudUnderlayMaterial = useMemo(() => {
    if (!cloudMap) return null;
    return new THREE.MeshStandardMaterial({
      map: cloudMap,
      transparent: true,
      opacity: cloudOpacity * GLOBE_V2_CLOUD_UNDERLAY_OPACITY_FACTOR,
      depthWrite: false,
      blending: THREE.NormalBlending,
      premultipliedAlpha: false,
      roughness: 1,
      metalness: 0,
      color: viewerNight ? new THREE.Color(0.88, 0.9, 0.94) : new THREE.Color(0xffffff),
      emissive: new THREE.Color(0xb8c8dc),
      emissiveIntensity: viewerNight ? 0.008 : 0.02,
    });
  }, [cloudMap, cloudOpacity, viewerNight]);

  const cloudOuterMaterial = useMemo(() => {
    if (!cloudMap) return null;
    return new THREE.MeshStandardMaterial({
      map: cloudMap,
      transparent: true,
      opacity: cloudOpacity * cloudOuterOpacityFactor,
      depthWrite: false,
      blending: THREE.NormalBlending,
      premultipliedAlpha: false,
      roughness: 1,
      metalness: 0,
      color: viewerNight ? new THREE.Color(0.88, 0.9, 0.94) : new THREE.Color(0xffffff),
      emissive: new THREE.Color(0xb8c8dc),
      emissiveIntensity: viewerNight ? 0.01 : 0.025,
    });
  }, [cloudMap, cloudOpacity, cloudOuterOpacityFactor, viewerNight]);

  useLayoutEffect(() => {
    if (!cloudMaterial) return;
    cloudMaterial.opacity = cloudOpacity;
    cloudMaterial.color.set(viewerNight ? '#e0e6ee' : '#ffffff');
    cloudMaterial.roughness = 1;
    cloudMaterial.metalness = 0;
    cloudMaterial.emissive.set('#b8c8dc');
    cloudMaterial.emissiveIntensity = viewerNight ? 0.01 : fullDaySurface && embedded ? 0.05 : 0.035;
    cloudMaterial.needsUpdate = true;
  }, [cloudMaterial, cloudOpacity, viewerNight, fullDaySurface, embedded]);

  useLayoutEffect(() => {
    if (!cloudUnderlayMaterial) return;
    const uo = cloudOpacity * GLOBE_V2_CLOUD_UNDERLAY_OPACITY_FACTOR;
    cloudUnderlayMaterial.opacity = uo;
    cloudUnderlayMaterial.color.set(viewerNight ? '#e0e6ee' : '#ffffff');
    cloudUnderlayMaterial.roughness = 1;
    cloudUnderlayMaterial.metalness = 0;
    cloudUnderlayMaterial.emissive.set('#b8c8dc');
    cloudUnderlayMaterial.emissiveIntensity = viewerNight ? 0.008 : 0.02;
    cloudUnderlayMaterial.needsUpdate = true;
  }, [cloudUnderlayMaterial, cloudOpacity, viewerNight]);

  useLayoutEffect(() => {
    if (!cloudOuterMaterial) return;
    cloudOuterMaterial.opacity = cloudOpacity * cloudOuterOpacityFactor;
    cloudOuterMaterial.color.set(viewerNight ? '#e0e6ee' : '#ffffff');
    cloudOuterMaterial.roughness = 1;
    cloudOuterMaterial.metalness = 0;
    cloudOuterMaterial.emissive.set('#b8c8dc');
    cloudOuterMaterial.emissiveIntensity = viewerNight ? 0.01 : 0.025;
    cloudOuterMaterial.needsUpdate = true;
  }, [cloudOuterMaterial, cloudOpacity, cloudOuterOpacityFactor, viewerNight]);

  useLayoutEffect(() => {
    return () => {
      cloudMaterial?.dispose();
      cloudUnderlayMaterial?.dispose();
      cloudOuterMaterial?.dispose();
    };
  }, [cloudMaterial, cloudUnderlayMaterial, cloudOuterMaterial]);

  const cityLightsMapLinear = useMemo(() => cloneLightsMapLinear(lightsMap), [lightsMap]);

  const oceanMat = useMemo(
    () => createOceanSphereMaterial(heightTex, dayMap),
    [heightTex, dayMap]
  );

  /** Océano: en `ocean_land`+ tapar UV de tierra (no color/profundidad de mar bajo continentes). En `ocean` solo, esfera completa para QA. */
  useLayoutEffect(() => {
    const u = oceanMat.uniforms.uOceanMaskLand as { value: number } | undefined;
    if (!u) return;
    u.value = layerBuildStage === 'ocean' ? 0 : 1;
  }, [oceanMat, layerBuildStage]);

  useLayoutEffect(() => {
    const u = oceanMat.uniforms.uFullDay as { value: number } | undefined;
    if (u) u.value = fullDaySurface ? 1 : 0;
  }, [oceanMat, fullDaySurface]);

  const landMat = useMemo(() => {
    if (!showLand) return null;
    return createLandSphereMaterial(
      dayMap,
      normalMap,
      heightTex,
      heightTex,
      displacementScale,
      allowVertexTextureFetch
    );
  }, [showLand, dayMap, normalMap, heightTex, displacementScale, allowVertexTextureFetch]);

  const cityLightsMat = useMemo(() => {
    if (!showNightLightsLayer) return null;
    return createCityLightsOverlayMaterial(
      cityLightsMapLinear,
      normalMap,
      heightTex,
      displacementScale,
      allowVertexTextureFetch
    );
  }, [
    showNightLightsLayer,
    cityLightsMapLinear,
    normalMap,
    heightTex,
    displacementScale,
    allowVertexTextureFetch,
  ]);

  useLayoutEffect(() => {
    if (!allowVertexTextureFetch || !landMat) return;
    const udh = landMat.uniforms.uHeightTex as { value: THREE.Texture } | undefined;
    if (udh) udh.value = heightTex;
  }, [allowVertexTextureFetch, landMat, heightTex]);

  useLayoutEffect(() => {
    if (!allowVertexTextureFetch || !landMat) return;
    const udd = landMat.uniforms.uDispScale as { value: number } | undefined;
    if (udd) udd.value = displacementScale;
  }, [allowVertexTextureFetch, landMat, displacementScale]);

  useLayoutEffect(() => {
    if (!allowVertexTextureFetch || !cityLightsMat) return;
    const uch = cityLightsMat.uniforms.uHeightTex as { value: THREE.Texture } | undefined;
    if (uch) uch.value = heightTex;
  }, [allowVertexTextureFetch, cityLightsMat, heightTex]);

  useLayoutEffect(() => {
    if (!allowVertexTextureFetch || !cityLightsMat) return;
    const ucd = cityLightsMat.uniforms.uDispScale as { value: number } | undefined;
    if (ucd) ucd.value = displacementScale;
  }, [allowVertexTextureFetch, cityLightsMat, displacementScale]);

  useLayoutEffect(() => {
    if (!landMat) return;
    const u = landMat.uniforms.uFullDay as { value: number } | undefined;
    if (u) u.value = fullDaySurface ? 1 : 0;
  }, [landMat, fullDaySurface]);

  useLayoutEffect(() => {
    if (!cityLightsMat) return;
    const u = cityLightsMat.uniforms.uFullDay as { value: number } | undefined;
    if (u) u.value = fullDaySurface ? 1 : 0;
  }, [cityLightsMat, fullDaySurface]);

  useLayoutEffect(() => {
    if (!cityLightsMat) return;
    const u = cityLightsMat.uniforms.uStrength as { value: number };
    u.value = viewerNight ? GLOBE_V2_CITY_LIGHTS_STRENGTH_NIGHT : GLOBE_V2_CITY_LIGHTS_STRENGTH_DAY;
  }, [cityLightsMat, viewerNight]);

  useLayoutEffect(() => {
    return () => {
      oceanMat.dispose();
      if (landMat) landMat.dispose();
      if (cityLightsMat) cityLightsMat.dispose();
      cityLightsMapLinear.dispose();
      oceanGeometry.dispose();
      landGeometry.dispose();
      neutralHeightTex.dispose();
      if (remoteHeightRef.current) {
        remoteHeightRef.current.dispose();
        remoteHeightRef.current = null;
      }
    };
  }, [oceanMat, landMat, cityLightsMat, cityLightsMapLinear, oceanGeometry, landGeometry, neutralHeightTex]);

  const atmosphereOn =
    showAtmosphere &&
    (layerBuildStage === 'ocean_land_clouds_atmosphere' ||
      (layerBuildStage === 'full' && visualStage === 'full'));

  return (
    <group>
      {showLand && landMat ? (
        <mesh ref={stripGlobeMeshRaycast} geometry={landGeometry} renderOrder={0}>
          <primitive object={landMat} attach="material" />
        </mesh>
      ) : null}
      {showOcean ? (
        <mesh ref={stripGlobeMeshRaycast} geometry={oceanGeometry} renderOrder={1}>
          <primitive object={oceanMat} attach="material" />
        </mesh>
      ) : null}
      {showNightLightsLayer && cityLightsMat ? (
        <mesh
          ref={stripGlobeMeshRaycast}
          geometry={landGeometry}
          scale={GLOBE_V2_CITY_LIGHTS_SCALE / GLOBE_V2_LAND_RADIUS}
          renderOrder={3}
        >
          <primitive object={cityLightsMat} attach="material" />
        </mesh>
      ) : null}
      {atmosphereOn ? (
        <AtmosphereGlow
          scale={GLOBE_V2_ATMOSPHERE_SCALE}
          fullDay={fullDaySurface}
          obliquityXRad={obliquityXRad}
          getEarthSceneDate={getEarthSceneDate}
          homeCinematic={Boolean(embedded)}
          cameraRelativeSun={cameraRelativeSun}
          orbitTarget={orbitTarget}
        />
      ) : null}
      {showClouds && cloudMap && cloudMaterial && cloudUnderlayMaterial && cloudOuterMaterial ? (
        <group ref={cloudDriftRef}>
          <mesh ref={stripGlobeMeshRaycast} material={cloudUnderlayMaterial} renderOrder={3}>
            <sphereGeometry
              args={[
                GLOBE_V2_CLOUD_ROOT_SCALE - GLOBE_V2_CLOUD_UNDERLAY_RADIUS_DELTA,
                GLOBE_V2_CLOUD_SPHERE_SEGMENTS,
                GLOBE_V2_CLOUD_SPHERE_SEGMENTS,
              ]}
            />
          </mesh>
          <mesh ref={stripGlobeMeshRaycast} material={cloudMaterial} renderOrder={5}>
            <sphereGeometry
              args={[GLOBE_V2_CLOUD_ROOT_SCALE, GLOBE_V2_CLOUD_SPHERE_SEGMENTS, GLOBE_V2_CLOUD_SPHERE_SEGMENTS]}
            />
          </mesh>
          <group rotation={[0, GLOBE_V2_CLOUD_OUTER_Y_ROT_RAD, 0]}>
            <mesh ref={stripGlobeMeshRaycast} material={cloudOuterMaterial} renderOrder={6}>
              <sphereGeometry
                args={[
                  GLOBE_V2_CLOUD_ROOT_SCALE + GLOBE_V2_CLOUD_OUTER_RADIUS_DELTA,
                  GLOBE_V2_CLOUD_SPHERE_SEGMENTS,
                  GLOBE_V2_CLOUD_SPHERE_SEGMENTS,
                ]}
              />
            </mesh>
          </group>
        </group>
      ) : null}
      <SyncSunToGlobe
        oceanMat={oceanMat}
        landMat={landMat}
        cityLightsMat={cityLightsMat}
        sunLightRef={sunLightRef}
        syncLand={showLand}
        syncCityLights={showNightLightsLayer && cityLightsMat != null}
        oceanSunDebug={oceanSunDebug}
        obliquityXRad={obliquityXRad}
        getEarthSceneDate={getEarthSceneDate}
        cameraRelativeSun={cameraRelativeSun}
        orbitTarget={orbitTarget}
      />
    </group>
  );
}

function GlobeScene({
  urls,
  embedded,
  bits,
  selectedBitId,
  onBitClick,
  viewerNight,
  sunLightRef,
  visualStage,
  fixedCameraPreset,
  displacementScale,
  layerBuildStage,
  oceanSunDebug,
  forceDaylight,
  showMoon,
  earthVisualTimeScale,
  pauseEarthSpinForUi,
  initialViewLat,
  initialViewLng,
}: {
  urls: GlobeV2TextureUrls;
  embedded: boolean;
  bits: GlobeBitMarker[];
  selectedBitId: number | null;
  onBitClick?: (id: number) => void;
  viewerNight: boolean;
  sunLightRef: RefObject<THREE.DirectionalLight | null>;
  visualStage: GlobeV2VisualStage;
  fixedCameraPreset?: GlobeV2CameraPreset | null;
  displacementScale: number;
  layerBuildStage: GlobeV2LayerBuildStage;
  oceanSunDebug: GlobeV2OceanSunDebug;
  forceDaylight: boolean;
  showMoon: boolean;
  earthVisualTimeScale: number;
  /** Drawer / panel que debe congelar el reloj terrestre (p. ej. bits abiertos en home). */
  pauseEarthSpinForUi: boolean;
  initialViewLat?: number;
  initialViewLng?: number;
}) {
  const { size } = useThree();
  const embeddedGeoFit = embedded ? Math.min(1, size.width / 400, size.height / 620) : 1;
  const geoScale = embedded ? Math.max(1, GLOBE_V2_EMBEDDED_GEO_SCALE * embeddedGeoFit) : 1;
  const camDist = embedded ? 3.62 : 3.14;
  const lockView = fixedCameraPreset != null;
  const planetSpinRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);

  const sceneTimeMsRef = useRef<number | null>(null);
  const lastRealMsRef = useRef<number | null>(null);
  const smoothedSpinRateRef = useRef(1);
  const bitInteractionStoreRef = useRef<GlobeBitInteractionStore>({
    pointerOnCanvas: false,
    magneticHoverId: null,
    pointerGlobeCenterDist: 1,
  });

  const getEarthSceneDate = useCallback((): Date => new Date(sceneTimeMsRef.current ?? Date.now()), []);

  const tidalLockYawRad = embedded ? GLOBE_V2_MOON_ORBIT_YAW_RAD.embedded : GLOBE_V2_MOON_ORBIT_YAW_RAD.full;
  const moonOrbitPeriodSeconds = embedded ? GLOBE_V2_MOON_ORBIT_BASE_S.embedded : GLOBE_V2_MOON_ORBIT_BASE_S.full;

  /**
   * Prioridad negativa: actualiza el reloj de escena antes que los materiales lean `getEarthSceneDate`.
   * `smoothedSpinRateRef` es el ÚNICO freno de giro: avanza GMST → `planetSpinRef` (océano+tierra+nubes+luces).
   * El drift local de nubes debe multiplicar el mismo factor (ver EarthGroup) para no desfasarse.
   */
  useFrame((_, dt) => {
    const now = Date.now();
    if (sceneTimeMsRef.current == null) {
      sceneTimeMsRef.current = now;
      lastRealMsRef.current = now;
    }
    const last = lastRealMsRef.current!;
    const deltaMs = now - last;
    lastRealMsRef.current = now;

    const st = bitInteractionStoreRef.current;
    let target = AUTO_ROTATE_IDLE_SPEED;
    if (pauseEarthSpinForUi) target = AUTO_ROTATE_PANEL_SPEED;
    else if (st.magneticHoverId != null) target = AUTO_ROTATE_HOVER_SPEED;
    else if (st.pointerOnCanvas) {
      const u = Math.min(1, st.pointerGlobeCenterDist / AUTO_ROTATE_PROXIMITY_BLEND_DIST);
      target =
        AUTO_ROTATE_NEAR_GLOBE_CENTER_SPEED +
        (AUTO_ROTATE_POINTER_SPEED - AUTO_ROTATE_NEAR_GLOBE_CENTER_SPEED) * u;
    }

    const k = Math.min(1, MAGNETIC_SPIN_RATE_SMOOTH * dt);
    smoothedSpinRateRef.current += (target - smoothedSpinRateRef.current) * k;

    const scale = Math.max(earthVisualTimeScale, 0.0001);
    sceneTimeMsRef.current! += deltaMs * scale * smoothedSpinRateRef.current;

    const g = planetSpinRef.current;
    if (!g || lockView) return;
    g.rotation.y = earthGreenwichSpinYRadFromUtc(
      new Date(sceneTimeMsRef.current!),
      GLOBE_V2_GMST_TEXTURE_OFFSET_RAD
    );
  }, -100);
  /* Estrellas: radio < camera.far (1000). Home ≥2000; sutiles, no compiten con bits. */
  const starsCount = embedded ? (viewerNight ? 2800 : 2400) : viewerNight ? 8000 : 6500;
  const starsRadius = embedded ? 420 : 480;

  /* ACES: exposición alta; el contenedor ya no aplica vignette fuerte (ver globe-earth-night.module.css). */
  const exp = embedded
    ? viewerNight
      ? forceDaylight
        ? 1.72
        : 1.9
      : forceDaylight
        ? 3.55
        : 2.16
    : viewerNight
      ? 1.65
      : 1.95;

  return (
    <>
      <ExposureSync exposure={exp} />

      <ProceduralStarfield
        count={starsCount}
        radius={starsRadius}
        twinkle={embedded ? 0.025 : 0.035}
      />

      {!embedded && (
        <Environment
          preset="night"
          environmentIntensity={viewerNight ? 0.24 : 0.22}
          background={false}
        />
      )}

      <hemisphereLight
        args={[
          embedded && !forceDaylight ? '#d8e4f2' : '#f0f3f8',
          embedded && !forceDaylight ? '#1a2838' : '#1a1f28',
          embedded
            ? viewerNight
              ? 0.52
              : forceDaylight
                ? 1.32
                : 0.5
            : viewerNight
              ? 0.38
              : 0.44,
        ]}
      />
      <ambientLight
        intensity={
          embedded
            ? viewerNight
              ? 0.42
              : forceDaylight
                ? 0.68
                : 0.46
            : viewerNight
              ? 0.09
              : 0.16
        }
        color={
          viewerNight
            ? '#6a7d96'
            : forceDaylight && embedded
              ? '#eef1f6'
              : embedded
                ? '#a8b8cc'
                : '#dfe3ea'
        }
      />
      <directionalLight
        ref={sunLightRef}
        intensity={
          embedded
            ? viewerNight
              ? forceDaylight
                ? 3.65
                : 3.95
              : forceDaylight
                ? 8.35
                : 4.95
            : viewerNight
              ? 3.35
              : 4.2
        }
        color={forceDaylight && embedded ? '#fffaf0' : '#fff8ec'}
      />
      {/* Fill débil permanente en home: evita cara frontal negra con sol editorial. */}
      {embedded ? (
        <directionalLight position={[-5, 3, 4]} intensity={viewerNight ? 0.85 : 1.55} color="#c8e0ff" />
      ) : null}

      <group scale={geoScale}>
        {/*
          Jerarquía Tierra:
          - earthAxialTilt: en full = oblicuidad 23,44°; en embedded home = 0 (eje vertical en pantalla).
          - earthSpin: giro sidéreo en Y local (GMST) — no modificar aquí.
          Luna hermana (no hereda tilt).
        */}
        <group
          name="earthAxialTilt"
          rotation={embedded ? [0, 0, 0] : [0, 0, EARTH_AXIAL_TILT_RAD]}
        >
          <group ref={planetSpinRef} name="earthSpin">
            <EarthGroup
              urls={urls}
              viewerNight={viewerNight}
              sunLightRef={sunLightRef}
              visualStage={visualStage}
              displacementScale={displacementScale}
              layerBuildStage={layerBuildStage}
              oceanSunDebug={oceanSunDebug}
              fullDaySurface={forceDaylight}
              obliquityXRad={GLOBE_V2_EARTH_OBLIQUITY_RAD}
              getEarthSceneDate={getEarthSceneDate}
              embedded={embedded}
              cameraRelativeSun={embedded}
              orbitTarget={embedded ? GLOBE_V2_EMBEDDED_ORBIT_TARGET : GLOBE_V2_FULL_ORBIT_TARGET}
              spinRateRef={smoothedSpinRateRef}
            />

            {layerBuildStage === 'full' && visualStage === 'full' ? (
              <GlobeBitsLayer
                bits={bits}
                selectedBitId={selectedBitId}
                onBitClick={onBitClick}
                orbitControlsRef={orbitControlsRef}
                interactionStoreRef={bitInteractionStoreRef}
                earthSpinGroupRef={planetSpinRef}
              />
            ) : null}
          </group>
        </group>

        {/*
          Suspense propio: `MoonSatellite` usa `useTexture`. Si suspende, no debe activar el Suspense
          del Canvas entero (fallback null) o la escena desaparece hasta cargar la Luna — al llegar a #mapa parece que “no hay Luna”.
        */}
        {showMoon && layerBuildStage !== 'ocean' && layerBuildStage !== 'land' ? (
          <Suspense fallback={null}>
            <MoonSatellite
              earthRadius={GLOBE_V2_OCEAN_RADIUS}
              orbitSemiMajor={embedded ? GLOBE_V2_MOON_ORBIT_SEMI_MAJOR.embedded : GLOBE_V2_MOON_ORBIT_SEMI_MAJOR.full}
              orbitPeriodSeconds={moonOrbitPeriodSeconds}
              moonRadiusScale={embedded ? GLOBE_V2_MOON_DISC_SCALE.embedded : GLOBE_V2_MOON_DISC_SCALE.full}
              orbitYawRad={tidalLockYawRad}
              orbitInclinationDeg={
                embedded ? GLOBE_V2_MOON_INCLINATION_EMBEDDED_DEG : GLOBE_V2_MOON_ORBIT_INCLINATION_DEG
              }
              roughness={embedded ? 0.81 : 0.94}
              emissiveIntensity={embedded ? 0.12 : 0.07}
              clipToViewport={embedded}
              keepBehindEarth
            />
          </Suspense>
        ) : null}
      </group>

      {/* Home embebida: sin zoom con rueda/trackpad para no bloquear el scroll de la página (OrbitControls usa preventDefault en wheel). */}
      <OrbitControls
        ref={orbitControlsRef}
        makeDefault={lockView}
        target={embedded ? GLOBE_V2_EMBEDDED_ORBIT_TARGET : [0, 0, 0]}
        enablePan={false}
        enableZoom={!embedded}
        minDistance={embedded ? 2.08 : 2.65}
        maxDistance={embedded ? 4.85 : 8}
        /* El giro lo marca `planetSpinRef` (corteza + nubes + bits a la vez); evita doble rotación con la cámara. */
        autoRotate={false}
        enableDamping
        dampingFactor={0.09}
        /* Embebido: menos sensibilidad para no “pierder” el clic en bits frente a micro-arrastres. */
        rotateSpeed={embedded ? 0.28 : 0.5}
        zoomSpeed={0.65}
      />
      {lockView && fixedCameraPreset ? (
        <CameraPresetRig preset={fixedCameraPreset} distance={camDist} />
      ) : null}
      {embedded &&
      !lockView &&
      typeof initialViewLat === 'number' &&
      typeof initialViewLng === 'number' ? (
        <InitialViewRig
          lat={initialViewLat}
          lng={initialViewLng}
          distance={camDist}
          orbitTarget={GLOBE_V2_EMBEDDED_ORBIT_TARGET}
          alignToSun={false}
        />
      ) : null}
    </>
  );
}

export type GlobeV2Props = {
  className?: string;
  textureUrls?: Partial<GlobeV2TextureUrls>;
  /** true = home (rellena el contenedor del mapa); false/omitido = pantalla completa tipo /globo-v2 */
  embedded?: boolean;
  /**
   * Modo de capas para validar por separado superficie / luces nocturnas / marcadores.
   * Por defecto `full` (comportamiento histórico).
   */
  visualStage?: GlobeV2VisualStage;
  /** Bits con lat/lon (grados), mismo criterio que BITS_DATA / HuellaPunto */
  bits?: GlobeBitMarker[];
  selectedBitId?: number | null;
  onBitClick?: (id: number) => void;
  /**
   * Encuadre fijo para QA (p. ej. /globo-validacion): sin giro de corteza y controls alineados al preset.
   */
  fixedCameraPreset?: GlobeV2CameraPreset | null;
  /**
   * Desplazamiento suave según heightMap (canal R, 0.5 = neutro). Por defecto 0 (solo pipeline listo).
   * @see GLOBE_V2_DISPLACEMENT_SCALE_DEFAULT
   */
  displacementScale?: number;
  /**
   * true = disco siempre como de día (sin terminador ni luces urbanas nocturnas).
   * false = siempre terminador UTC (útil en `embedded` para volver al ciclo día/noche real).
   * Omitido + `embedded`: se asume día (home `#mapa` legible y luminoso).
   */
  forceDaylight?: boolean;
  /**
   * Construcción por capas (QA): `ocean` → … → `full`. Marcadores y luces nocturnas solo con `full`.
   */
  layerBuildStage?: GlobeV2LayerBuildStage;
  /**
   * Solo OceanSphere: dirección de luz en el shader del mar (UTC real vs fija para QA).
   */
  oceanSunDebug?: GlobeV2OceanSunDebug;
  /** Luna en órbita elíptica; cara fija hacia Tierra (oculta en capas QA solo océano/tierra). */
  showMoon?: boolean;
  /**
   * Multiplicador del tiempo UTC solo para rotación terrestre y luz solar (`1` = tiempo real del reloj).
   * @see GLOBE_V2_EARTH_VISUAL_TIME_SCALE
   */
  earthVisualTimeScale?: number;
  /**
   * true = congela el avance del reloj de escena (giro + terminador) mientras un panel relevante está abierto.
   * En home: típ. `drawerOpen && drawerMode === 'bits'`.
   */
  pauseEarthSpinForUi?: boolean;
  /** Encuadre inicial (grados). Home: geolocalización o fallback editorial LATAM. */
  initialViewLat?: number;
  initialViewLng?: number;
  /** Ubicación del usuario para día/noche local (GPS); si no hay, zona IANA del navegador. */
  viewerLat?: number;
  viewerLng?: number;
};

export default function GlobeV2({
  className,
  textureUrls,
  embedded = false,
  visualStage = 'full',
  bits = [],
  selectedBitId = null,
  onBitClick,
  fixedCameraPreset = null,
  displacementScale = GLOBE_V2_DISPLACEMENT_SCALE_DEFAULT,
  forceDaylight,
  layerBuildStage = 'full',
  oceanSunDebug = 'utc',
  showMoon = true,
  earthVisualTimeScale = GLOBE_V2_EARTH_VISUAL_TIME_SCALE,
  pauseEarthSpinForUi = false,
  initialViewLat,
  initialViewLng,
  viewerLat,
  viewerLng,
}: GlobeV2Props) {
  /**
   * Día completo en shaders (sin terminador UTC) + luces “día” en la escena.
   * En `embedded` (home `#mapa`), por defecto activo salvo `forceDaylight={false}` explícito.
   */
  const forceDaylightOn = forceDaylight === true || (embedded && forceDaylight !== false);

  const urls: GlobeV2TextureUrls = {
    day: textureUrls?.day ?? GLOBE_V2_DEFAULT_TEXTURES.day,
    normal: textureUrls?.normal ?? GLOBE_V2_DEFAULT_TEXTURES.normal,
    clouds: textureUrls?.clouds ?? GLOBE_V2_DEFAULT_TEXTURES.clouds,
    nightLights: textureUrls?.nightLights ?? GLOBE_V2_DEFAULT_TEXTURES.nightLights,
    heightMap: textureUrls?.heightMap ?? GLOBE_V2_DEFAULT_TEXTURES.heightMap,
  };

  const localNight = useViewerSolarNight(viewerLat, viewerLng);
  const viewerNight = forceDaylightOn ? false : localNight;
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  const dprMax =
    typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, embedded ? 1.65 : 2.2) : 2;

  /* Embebido: cámara más cerca para disco mayor en home (coherente con `camDist` en GlobeScene). */
  const camZ = embedded ? 3.62 : 3.14;

  const wrapperClass =
    className ??
    (embedded
      ? 'relative z-0 h-full w-full min-h-[50vh] flex-1 overflow-hidden max-w-full [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none'
      : 'fixed inset-0 z-0 h-[100dvh] w-full min-h-0 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none');

  const embeddedUniverseChrome = embedded && className == null;
  const rootClassName =
    className == null
      ? `${wrapperClass} outline-none focus:outline-none ${
          embeddedUniverseChrome
            ? earthNightStyles.earthUniverseEmbeddedContainer
            : earthNightStyles.earthNightContainer
        }`
      : wrapperClass;

  const camPos: [number, number, number] = embedded
    ? [GLOBE_V2_EMBEDDED_CAM_POSITION[0], GLOBE_V2_EMBEDDED_CAM_POSITION[1], camZ]
    : [0, 0, camZ];

  return (
    <div
      className={rootClassName}
      role="img"
      tabIndex={embedded ? -1 : 0}
      aria-label="Globo terráqueo interactivo. Explorar con el ratón."
    >
      {className == null && !embeddedUniverseChrome ? (
        <div className={earthNightStyles.atmosphereOverlay} aria-hidden />
      ) : null}
      <Canvas
        shadows={false}
        /* far 1000: el starfield vive a radio ~420–480; far 280 lo recortaba entero. */
        camera={{ position: camPos, fov: embedded ? 40 : 42, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        className="relative z-0 h-full w-full"
        dpr={[1, dprMax]}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          /* Primer frame; <ExposureSync/> ajusta según modo (embebido día / noche / pantalla completa). */
          gl.toneMappingExposure = embeddedUniverseChrome
            ? forceDaylightOn
              ? 3.05
              : 2.14
            : embedded
              ? 2.02
              : 1.92;
        }}
      >
        <Suspense fallback={null}>
          <GlobeScene
            urls={urls}
            embedded={embedded}
            bits={bits}
            selectedBitId={selectedBitId}
            onBitClick={onBitClick}
            viewerNight={viewerNight}
            sunLightRef={sunLightRef}
            visualStage={visualStage}
            fixedCameraPreset={fixedCameraPreset}
            displacementScale={displacementScale}
            layerBuildStage={layerBuildStage}
            oceanSunDebug={oceanSunDebug}
            forceDaylight={forceDaylightOn}
            showMoon={showMoon}
            earthVisualTimeScale={earthVisualTimeScale}
            pauseEarthSpinForUi={pauseEarthSpinForUi}
            initialViewLat={initialViewLat}
            initialViewLng={initialViewLng}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
