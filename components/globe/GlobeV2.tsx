'use client';

/**
 * GlobeV2 — R3F + drei: Tierra + Luna, tiempo real UTC.
 *
 * Tierra: oblicuidad ~23,44° (eje X); `planetSpinRef.rotation.y` = GMST + offset (textura alineada al meridiano).
 * Reloj Tierra+Sol: `getEarthSceneDate()` (UTC acelerado con `GLOBE_V2_EARTH_VISUAL_TIME_SCALE` / prop). Luna en tiempo real.
 *
 * Luna: órbita geocéntrica fuera del grupo inclinado; plano ~5,145°; traslación prograda; cara fija a Tierra.
 *
 * `embedded`: home `#mapa` — `forceDaylight` por defecto salvo `forceDaylight={false}` (terminador UTC + halo tipo referencia órbita). Página completa: /globo-v2 sin `embedded`.
 */

import type { RefObject } from 'react';
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GlobeBitsLayer, type GlobeBitMarker } from '@/components/globe/GlobeBitsLayer';
import { MoonSatellite, MOON_ORBIT_INCLINATION_DEG } from '@/components/globe/MoonSatellite';
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
import {
  approximateCoordinatesForIANATimeZone,
  earthGreenwichSpinYRadFromUtc,
  isNightAtLocation,
} from '@/lib/sunPosition';
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
const GLOBE_V2_EMBEDDED_GEO_SCALE = 1.1;

/** Oblicuidad de la eclíptica (~23,44°): eje de rotación terrestre fijo respecto al plano orbital de la Luna. */
const GLOBE_V2_EARTH_OBLIQUITY_RAD = THREE.MathUtils.degToRad(23.439421);

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
 */
const GLOBE_V2_MOON_ORBIT_BASE_S = { embedded: 218, full: 162 } as const;

/** Semieje mayor orbital (Tierra R⊕ ≈ 1). Home: más cerca del disco para que no se salga del encuadre. */
const GLOBE_V2_MOON_ORBIT_SEMI_MAJOR = { embedded: 1.58, full: 3.58 } as const;

/** Escala solo del disco lunar (no del radio orbital). */
const GLOBE_V2_MOON_DISC_SCALE = { embedded: 0.48, full: 0.6 } as const;

/** Inclinación del plano orbital respecto a la eclíptica (~5,145°). */
const GLOBE_V2_MOON_ORBIT_INCLINATION_DEG = MOON_ORBIT_INCLINATION_DEG;

/** Fase inicial del plano en Y (solo encuadre: home ≈ Luna arriba-izquierda respecto al disco). */
const GLOBE_V2_MOON_ORBIT_YAW_RAD = { embedded: Math.PI * 0.82, full: 0 } as const;

/** Inclinación orbital lunar en home: moderada para no perder la Luna arriba/abajo del canvas. */
const GLOBE_V2_MOON_INCLINATION_EMBEDDED_DEG = 5.25;

/** Cámara / target en home: Tierra más abajo-derecha (offset pantalla). Target menos bajo para no recortar el disco por arriba en el canvas. */
const GLOBE_V2_EMBEDDED_CAM_POSITION: [number, number, number] = [0.22, 0.3, 0];
const GLOBE_V2_EMBEDDED_ORBIT_TARGET: [number, number, number] = [-0.06, -0.07, 0];

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

/**
 * Noche en la UI (estrellas, exposición, nubes) según el sol en un punto representativo de la
 * zona IANA del navegador — evita modo “noche” a las 20:00 con sol alto (p. ej. verano en Chile).
 * El terminador del globo sigue usando `sunDirectionUtc` en el shader.
 */
function useViewerLocalNight(): boolean {
  const compute = (): boolean => {
    if (typeof window === 'undefined') return false;
    const now = new Date();
    let tz: string;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      tz = 'UTC';
    }
    const anchor = approximateCoordinatesForIANATimeZone(tz);
    if (anchor) return isNightAtLocation(anchor.lat, anchor.lng, now);
    const h = now.getHours();
    return h >= 20 || h < 6;
  };
  const [night, setNight] = useState(compute);
  useEffect(() => {
    const tick = () => setNight(compute());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return night;
}

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

/** Sincroniza sol, cámara y tiempo con OceanSphere / LandSphere / luces (`earthSceneDate` = reloj Tierra). */
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
}) {
  const { camera } = useThree();
  const camWorld = useMemo(() => new THREE.Vector3(), []);
  const sunScratch = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const s = computeSunDirection(getEarthSceneDate(), obliquityXRad, sunScratch);
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
    camera.getWorldPosition(camWorld);
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
}: {
  scale: number;
  fullDay: boolean;
  obliquityXRad: number;
  getEarthSceneDate: () => Date;
  /** Home `#mapa`: halo azul más legible (foto órbita / NASA). */
  homeCinematic?: boolean;
}) {
  const { camera } = useThree();
  const mat = useMemo(
    () =>
      createAtmosphereGlowMaterial(
        homeCinematic
          ? {
              intensity: 0.128,
              power: 3.05,
              innerColor: 0x8ed8ff,
              outerColor: 0x0a2a5c,
            }
          : undefined
      ),
    [homeCinematic]
  );
  const camWorld = useMemo(() => new THREE.Vector3(), []);
  const sunScratch = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    camera.getWorldPosition(camWorld);
    (mat.uniforms.uCamPos as { value: THREE.Vector3 }).value.copy(camWorld);
    computeSunDirection(getEarthSceneDate(), obliquityXRad, sunScratch);
    (mat.uniforms.uSunDir as { value: THREE.Vector3 }).value.copy(sunScratch);
    (mat.uniforms.uFullDay as { value: number }).value = fullDay ? 1 : 0;
  });

  useLayoutEffect(() => {
    return () => mat.dispose();
  }, [mat]);

  return (
    <mesh ref={stripGlobeMeshRaycast} scale={scale} renderOrder={-1}>
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

  const [dayMap, cloudMap, lightsMap, normalMap] = useTexture([
    urls.day,
    urls.clouds,
    urls.nightLights,
    urls.normal,
  ]);

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
    setTextureQuality(cloudMap, THREE.SRGBColorSpace, maxA);
    setTextureQuality(lightsMap, THREE.SRGBColorSpace, maxA);
    normalMap.colorSpace = THREE.NoColorSpace;
    normalMap.anisotropy = maxA;
    normalMap.generateMipmaps = true;
    normalMap.minFilter = THREE.LinearMipmapLinearFilter;
    normalMap.magFilter = THREE.LinearFilter;
    normalMap.wrapS = THREE.ClampToEdgeWrapping;
    normalMap.wrapT = THREE.ClampToEdgeWrapping;
    normalMap.needsUpdate = true;
  }, [gl, dayMap, cloudMap, lightsMap, normalMap]);

  const cloudOpacity = viewerNight ? GLOBE_V2_CLOUD_OPACITY_NIGHT : GLOBE_V2_CLOUD_OPACITY_DAY;
  const cloudOuterOpacityFactor = viewerNight
    ? GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_NIGHT
    : GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_DAY;

  const cloudMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cloudMap,
        transparent: true,
        opacity: cloudOpacity,
        depthWrite: false,
        blending: THREE.NormalBlending,
        premultipliedAlpha: false,
        /* Sin Environment en embebido: metalness/IBL apagan el mapa; mate + emissive suave = nubes visibles */
        roughness: 1,
        metalness: 0,
        color: viewerNight ? new THREE.Color(0.84, 0.88, 0.92) : new THREE.Color(0xffffff),
        emissive: new THREE.Color(0xd8e2ee),
        emissiveIntensity: viewerNight ? 0.02 : 0.09,
      }),
    [cloudMap, cloudOpacity, viewerNight]
  );

  const cloudUnderlayMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cloudMap,
        transparent: true,
        opacity: cloudOpacity * GLOBE_V2_CLOUD_UNDERLAY_OPACITY_FACTOR,
        depthWrite: false,
        blending: THREE.NormalBlending,
        premultipliedAlpha: false,
        roughness: 1,
        metalness: 0,
        color: viewerNight ? new THREE.Color(0.84, 0.88, 0.92) : new THREE.Color(0xffffff),
        emissive: new THREE.Color(0xd8e2ee),
        emissiveIntensity: viewerNight ? 0.015 : 0.065,
      }),
    [cloudMap, cloudOpacity, viewerNight]
  );

  const cloudOuterMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cloudMap,
        transparent: true,
        opacity: cloudOpacity * cloudOuterOpacityFactor,
        depthWrite: false,
        blending: THREE.NormalBlending,
        premultipliedAlpha: false,
        roughness: 1,
        metalness: 0,
        color: viewerNight ? new THREE.Color(0.84, 0.88, 0.92) : new THREE.Color(0xffffff),
        emissive: new THREE.Color(0xd8e2ee),
        emissiveIntensity: viewerNight ? 0.018 : 0.075,
      }),
    [cloudMap, cloudOpacity, cloudOuterOpacityFactor, viewerNight]
  );

  useLayoutEffect(() => {
    cloudMaterial.opacity = cloudOpacity;
    cloudMaterial.color.set(viewerNight ? '#a8b0bc' : '#ffffff');
    cloudMaterial.roughness = 1;
    cloudMaterial.metalness = 0;
    cloudMaterial.emissive.set('#d8e2ee');
    cloudMaterial.emissiveIntensity = viewerNight ? 0.02 : fullDaySurface && embedded ? 0.18 : 0.09;
    cloudMaterial.needsUpdate = true;
  }, [cloudMaterial, cloudOpacity, viewerNight, fullDaySurface, embedded]);

  useLayoutEffect(() => {
    const uo = cloudOpacity * GLOBE_V2_CLOUD_UNDERLAY_OPACITY_FACTOR;
    cloudUnderlayMaterial.opacity = uo;
    cloudUnderlayMaterial.color.set(viewerNight ? '#a8b0bc' : '#ffffff');
    cloudUnderlayMaterial.roughness = 1;
    cloudUnderlayMaterial.metalness = 0;
    cloudUnderlayMaterial.emissive.set('#d8e2ee');
    cloudUnderlayMaterial.emissiveIntensity = viewerNight ? 0.015 : 0.065;
    cloudUnderlayMaterial.needsUpdate = true;
  }, [cloudUnderlayMaterial, cloudOpacity, viewerNight]);

  useLayoutEffect(() => {
    cloudOuterMaterial.opacity = cloudOpacity * cloudOuterOpacityFactor;
    cloudOuterMaterial.color.set(viewerNight ? '#a8b0bc' : '#ffffff');
    cloudOuterMaterial.roughness = 1;
    cloudOuterMaterial.metalness = 0;
    cloudOuterMaterial.emissive.set('#d8e2ee');
    cloudOuterMaterial.emissiveIntensity = viewerNight ? 0.018 : 0.075;
    cloudOuterMaterial.needsUpdate = true;
  }, [cloudOuterMaterial, cloudOpacity, cloudOuterOpacityFactor, viewerNight]);

  useLayoutEffect(() => {
    return () => {
      cloudMaterial.dispose();
      cloudUnderlayMaterial.dispose();
      cloudOuterMaterial.dispose();
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
        />
      ) : null}
      {showClouds ? (
        <group>
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
}) {
  const geoScale = embedded ? GLOBE_V2_EMBEDDED_GEO_SCALE : 1;
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
   * `smoothedSpinRateRef` modula cuánto avanza el tiempo (giro terrestre + terminador) según puntero/hover/panel.
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
  const starsCount = embedded
    ? viewerNight
      ? 1600
      : 1050
    : viewerNight
      ? 11000
      : 9000;
  const starsRadius = embedded ? 465 : 520;

  /* ACES: exposición alta; el contenedor ya no aplica vignette fuerte (ver globe-earth-night.module.css). */
  const exp = embedded
    ? viewerNight
      ? forceDaylight
        ? 1.72
        : 1.9
      : forceDaylight
        ? 3.42
        : 2.16
    : viewerNight
      ? 1.65
      : 1.95;

  return (
    <>
      <ExposureSync exposure={exp} />

      <Stars
        radius={starsRadius}
        depth={100}
        count={starsCount}
        factor={embedded ? 2.05 : 3}
        saturation={0}
        fade
        speed={embedded ? 0.18 : 0.32}
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
          '#f0f3f8',
          '#1a1f28',
          embedded
            ? viewerNight
              ? 0.44
              : forceDaylight
                ? 1.18
                : 0.48
            : viewerNight
              ? 0.38
              : 0.44,
        ]}
      />
      <ambientLight
        intensity={
          embedded ? (viewerNight ? 0.11 : forceDaylight ? 0.56 : 0.18) : viewerNight ? 0.09 : 0.16
        }
        color={viewerNight ? '#4a5568' : forceDaylight && embedded ? '#eef1f6' : '#dfe3ea'}
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
      {embedded && forceDaylight && !viewerNight ? (
        <directionalLight position={[-5, 3, 4]} intensity={2.85} color="#c8e0ff" />
      ) : null}

      <group scale={geoScale}>
        {/*
          Jerarquía Tierra:
          - Inclinación fija del eje (oblicuidad) en X.
          - Rotación diaria en Y bajo la inclinación (corteza + nubes + bits).
          La Luna es hermana (órbita geocéntrica en marco “inercial” de la escena, no hereda la oblicuidad).
        */}
        <group rotation={[GLOBE_V2_EARTH_OBLIQUITY_RAD, 0, 0]}>
          <group ref={planetSpinRef}>
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
              emissiveIntensity={embedded ? 0.07 : 0.04}
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
        maxDistance={embedded ? 6.2 : 8}
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

  const localNight = useViewerLocalNight();
  const viewerNight = forceDaylightOn ? false : localNight;
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  const dprMax =
    typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, embedded ? 1.65 : 2.2) : 2;

  /* Embebido: cámara más cerca para disco mayor en home (coherente con `camDist` en GlobeScene). */
  const camZ = embedded ? 3.62 : 3.14;

  const wrapperClass =
    className ??
    (embedded
      ? 'relative z-0 h-full w-full min-h-[50vh] flex-1 overflow-visible max-w-full [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none'
      : 'fixed inset-0 z-0 h-[100dvh] w-full min-h-0 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none');

  const embeddedDayChrome = embedded && forceDaylightOn && className == null;
  const embeddedCinematicChrome = embedded && !forceDaylightOn && className == null;
  const rootClassName =
    className == null
      ? `${wrapperClass} ${
          embeddedDayChrome
            ? earthNightStyles.earthDayEmbeddedContainer
            : embeddedCinematicChrome
              ? earthNightStyles.earthCinematicEmbeddedContainer
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
      tabIndex={0}
      aria-label="Globo terráqueo interactivo. Explorar con el ratón."
    >
      {className == null && !embeddedDayChrome && !embeddedCinematicChrome ? (
        <div className={earthNightStyles.atmosphereOverlay} aria-hidden />
      ) : null}
      <Canvas
        shadows={false}
        camera={{ position: camPos, fov: embedded ? 40 : 42, near: 0.1, far: 280 }}
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
          gl.toneMappingExposure = embeddedDayChrome
            ? 3.05
            : embeddedCinematicChrome
              ? 2.14
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
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
