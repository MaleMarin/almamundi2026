'use client';

/**
 * GlobeV2 — R3F + drei: capas físicas OceanSphere + LandSphere (sin mezcla mar/tierra en un shader),
 * CloudSphere (Standard), AtmosphereGlow, Luna en órbita elíptica (rotación sincrónica), opcional luces urbanas y bits.
 * `embedded`: home (contenedor con altura). Página completa: /globo-v2 sin `embedded`.
 */

import type { RefObject } from 'react';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GlobeBitsLayer, type GlobeBitMarker } from '@/components/globe/GlobeBitsLayer';
import {
  MoonSatellite,
  MOON_MUTUAL_LOCK_SIDEREAL_DAYS,
  MOON_SIDEREAL_ORBIT_DAYS,
} from '@/components/globe/MoonSatellite';
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
import { approximateCoordinatesForIANATimeZone, isNightAtLocation } from '@/lib/sunPosition';
import earthNightStyles from '@/components/globe/globe-earth-night.module.css';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/**
 * Home embebida: reduce Tierra + Luna + bits a la vez para un disco algo más pequeño
 * y mantiene la Luna en el mismo “encuadre” que el globo (sin quedar fuera del área negra).
 */
const GLOBE_V2_EMBEDDED_GEO_SCALE = 0.94;

/**
 * Giro de la corteza si no hay Luna visible (rad/s). Con Luna: bloqueo mareal mutuo → misma ω que la órbita
 * (~47 d sidéreos escalados respecto a ~27,3 d; ver `globeV2MutualLockOrbitPeriodSeconds`).
 */
const GLOBE_V2_PLANET_SPIN_RAD_S = { embedded: 0.1, full: 0.14 } as const;

/** Segundos de escena por órbita antes de escalar al escenario ~47 d / ~27,32 d. */
const GLOBE_V2_MOON_ORBIT_BASE_S = { embedded: 192, full: 148 } as const;

/** Debe coincidir con `orbitYawRad` de `<MoonSatellite />` para el acoplamiento mareal. */
const GLOBE_V2_MOON_ORBIT_YAW_RAD = { embedded: Math.PI, full: 0 } as const;

function globeV2MutualLockOrbitPeriodSeconds(embedded: boolean): number {
  const base = embedded ? GLOBE_V2_MOON_ORBIT_BASE_S.embedded : GLOBE_V2_MOON_ORBIT_BASE_S.full;
  return base * (MOON_MUTUAL_LOCK_SIDEREAL_DAYS / MOON_SIDEREAL_ORBIT_DAYS);
}

/**
 * Rotación Y de la corteza (rad) acoplada a `MoonSatellite`: misma ν = ω·t; Luna usa zOrbit = −r sin ν.
 * Giro superficial oeste→este (prograde); bloqueo mareal: meridiano fijo sigue a la Luna.
 *
 * - `orbitYawRad === 0`: Luna en (+cos ν, −sin ν) en XZ → θ = +ν.
 * - `orbitYawRad === π` (home): tras el yaw → θ = π + ν.
 */
function globeV2TidalLockEarthRotationY(
  elapsedTime: number,
  orbitPeriodSec: number,
  orbitYawRad: number
): number {
  const omega = (2 * Math.PI) / Math.max(orbitPeriodSec, 1e-6);
  const nu = omega * elapsedTime;
  const y = orbitYawRad;
  if (Math.abs(y) < 1e-5) return nu;
  if (Math.abs(y - Math.PI) < 1e-5) return Math.PI + nu;
  return nu;
}

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

/** Sincroniza sol (UTC), cámara y tiempo con OceanSphere / LandSphere / luces. */
function SyncSunToGlobe({
  oceanMat,
  landMat,
  cityLightsMat,
  sunLightRef,
  syncLand,
  syncCityLights,
  oceanSunDebug,
}: {
  oceanMat: THREE.ShaderMaterial;
  landMat: THREE.ShaderMaterial | null;
  cityLightsMat: THREE.ShaderMaterial | null;
  sunLightRef: RefObject<THREE.DirectionalLight | null>;
  syncLand: boolean;
  syncCityLights: boolean;
  oceanSunDebug: GlobeV2OceanSunDebug;
}) {
  const { camera } = useThree();
  const camWorld = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const s = computeSunDirection(new Date());
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
function AtmosphereGlow({ scale, fullDay }: { scale: number; fullDay: boolean }) {
  const { camera } = useThree();
  const mat = useMemo(() => createAtmosphereGlowMaterial(), []);
  const camWorld = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    camera.getWorldPosition(camWorld);
    (mat.uniforms.uCamPos as { value: THREE.Vector3 }).value.copy(camWorld);
    const s = computeSunDirection(new Date());
    (mat.uniforms.uSunDir as { value: THREE.Vector3 }).value.copy(s);
    (mat.uniforms.uFullDay as { value: number }).value = fullDay ? 1 : 0;
  });

  useLayoutEffect(() => {
    return () => mat.dispose();
  }, [mat]);

  return (
    <mesh scale={scale} renderOrder={-1}>
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

  const cloudMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cloudMap,
        transparent: true,
        opacity: cloudOpacity,
        depthWrite: false,
        blending: THREE.NormalBlending,
        premultipliedAlpha: false,
        roughness: 0.98,
        metalness: 0,
        color: viewerNight ? new THREE.Color(0.84, 0.88, 0.92) : new THREE.Color(0.995, 0.998, 1.0),
        emissive: new THREE.Color(0xd8e6f4),
        emissiveIntensity: 0.056,
      }),
    [cloudMap, cloudOpacity, viewerNight]
  );

  const cloudUnderlayMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cloudMap,
        transparent: true,
        opacity: GLOBE_V2_CLOUD_OPACITY_DAY * GLOBE_V2_CLOUD_UNDERLAY_OPACITY_FACTOR,
        depthWrite: false,
        blending: THREE.NormalBlending,
        premultipliedAlpha: false,
        roughness: 0.98,
        metalness: 0,
        color: viewerNight ? new THREE.Color(0.84, 0.88, 0.92) : new THREE.Color(0.995, 0.998, 1.0),
        emissive: new THREE.Color(0xd8e6f4),
        emissiveIntensity: 0.036,
      }),
    [cloudMap, viewerNight]
  );

  useLayoutEffect(() => {
    cloudMaterial.opacity = cloudOpacity;
    cloudMaterial.color.set(viewerNight ? '#a8b0bc' : '#f2f6fa');
    cloudMaterial.emissive.set(viewerNight ? '#000000' : '#dce8f4');
    cloudMaterial.emissiveIntensity = viewerNight ? 0 : 0.068;
    cloudMaterial.needsUpdate = true;
  }, [cloudMaterial, cloudOpacity, viewerNight]);

  useLayoutEffect(() => {
    const uo = cloudOpacity * GLOBE_V2_CLOUD_UNDERLAY_OPACITY_FACTOR;
    cloudUnderlayMaterial.opacity = uo;
    cloudUnderlayMaterial.color.set(viewerNight ? '#a8b0bc' : '#f2f6fa');
    cloudUnderlayMaterial.emissive.set(viewerNight ? '#000000' : '#dce8f4');
    cloudUnderlayMaterial.emissiveIntensity = viewerNight ? 0 : 0.042;
    cloudUnderlayMaterial.needsUpdate = true;
  }, [cloudUnderlayMaterial, cloudOpacity, viewerNight]);

  useLayoutEffect(() => {
    return () => {
      cloudMaterial.dispose();
      cloudUnderlayMaterial.dispose();
    };
  }, [cloudMaterial, cloudUnderlayMaterial]);

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
        <mesh geometry={landGeometry} renderOrder={0}>
          <primitive object={landMat} attach="material" />
        </mesh>
      ) : null}
      {showOcean ? (
        <mesh geometry={oceanGeometry} renderOrder={1}>
          <primitive object={oceanMat} attach="material" />
        </mesh>
      ) : null}
      {showNightLightsLayer && cityLightsMat ? (
        <mesh geometry={landGeometry} scale={GLOBE_V2_CITY_LIGHTS_SCALE / GLOBE_V2_LAND_RADIUS} renderOrder={3}>
          <primitive object={cityLightsMat} attach="material" />
        </mesh>
      ) : null}
      {atmosphereOn ? (
        <AtmosphereGlow scale={GLOBE_V2_ATMOSPHERE_SCALE} fullDay={fullDaySurface} />
      ) : null}
      {showClouds ? (
        <group>
          <mesh material={cloudUnderlayMaterial} renderOrder={4}>
            <sphereGeometry
              args={[
                GLOBE_V2_CLOUD_ROOT_SCALE - GLOBE_V2_CLOUD_UNDERLAY_RADIUS_DELTA,
                GLOBE_V2_CLOUD_SPHERE_SEGMENTS,
                GLOBE_V2_CLOUD_SPHERE_SEGMENTS,
              ]}
            />
          </mesh>
          <mesh material={cloudMaterial} renderOrder={5}>
            <sphereGeometry
              args={[GLOBE_V2_CLOUD_ROOT_SCALE, GLOBE_V2_CLOUD_SPHERE_SEGMENTS, GLOBE_V2_CLOUD_SPHERE_SEGMENTS]}
            />
          </mesh>
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
}) {
  const geoScale = embedded ? GLOBE_V2_EMBEDDED_GEO_SCALE : 1;
  const camDist = embedded ? 3.92 : 3.14;
  const lockView = fixedCameraPreset != null;
  const planetSpinRef = useRef<THREE.Group>(null);

  const mutualTidalLockActive =
    showMoon && layerBuildStage !== 'ocean' && layerBuildStage !== 'land';
  const mutualLockOrbitPeriodSec = mutualTidalLockActive
    ? globeV2MutualLockOrbitPeriodSeconds(embedded)
    : null;

  const tidalLockYawRad = embedded ? GLOBE_V2_MOON_ORBIT_YAW_RAD.embedded : GLOBE_V2_MOON_ORBIT_YAW_RAD.full;

  useFrame(({ clock }, dt) => {
    const g = planetSpinRef.current;
    if (!g || lockView) return;
    if (mutualLockOrbitPeriodSec != null) {
      g.rotation.y = globeV2TidalLockEarthRotationY(
        clock.elapsedTime,
        mutualLockOrbitPeriodSec,
        tidalLockYawRad
      );
    } else {
      /* Sin Luna: mismo sentido oeste→este que con bloqueo mareal. */
      g.rotation.y -= dt * (embedded ? GLOBE_V2_PLANET_SPIN_RAD_S.embedded : GLOBE_V2_PLANET_SPIN_RAD_S.full);
    }
  });
  const starsCount = embedded
    ? viewerNight
      ? 5200
      : 3800
    : viewerNight
      ? 11000
      : 9000;
  const starsRadius = embedded ? 420 : 520;

  /* ACES: exposición alta; el contenedor ya no aplica vignette fuerte (ver globe-earth-night.module.css). */
  const exp = embedded
    ? viewerNight
      ? 1.9
      : 2.72
    : viewerNight
      ? 1.82
      : 2.55;

  return (
    <>
      <ExposureSync exposure={exp} />

      <Stars
        radius={starsRadius}
        depth={100}
        count={starsCount}
        factor={3}
        saturation={0}
        fade
        speed={0.32}
      />

      {!embedded && (
        <Environment
          preset="night"
          environmentIntensity={viewerNight ? 0.24 : 0.22}
          background={false}
        />
      )}

      <hemisphereLight args={['#ffffff', '#1a1e28', embedded ? (viewerNight ? 0.55 : 0.88) : viewerNight ? 0.48 : 0.78]} />
      <ambientLight
        intensity={embedded ? (viewerNight ? 0.2 : 0.48) : viewerNight ? 0.14 : 0.38}
        color={viewerNight ? '#4a5568' : '#ffffff'}
      />
      <directionalLight
        ref={sunLightRef}
        intensity={embedded ? (viewerNight ? 5.4 : 8.4) : viewerNight ? 4.8 : 7.8}
        color="#ffffff"
      />

      <group scale={geoScale}>
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
          />

          {layerBuildStage === 'full' && visualStage === 'full' ? (
            <GlobeBitsLayer bits={bits} selectedBitId={selectedBitId} onBitClick={onBitClick} />
          ) : null}
        </group>

        {showMoon && layerBuildStage !== 'ocean' && layerBuildStage !== 'land' ? (
          <MoonSatellite
            earthRadius={GLOBE_V2_OCEAN_RADIUS}
            /* Embebido: órbita corta + yaw π → Luna hacia la izquierda con cámara en +Z; disco pequeño para no salirse del canvas. */
            orbitSemiMajor={embedded ? 1.42 : 3.05}
            orbitPeriodSeconds={globeV2MutualLockOrbitPeriodSeconds(embedded)}
            moonRadiusScale={embedded ? 0.58 : 0.78}
            orbitYawRad={tidalLockYawRad}
          />
        ) : null}
      </group>

      {/* Home embebida: sin zoom con rueda/trackpad para no bloquear el scroll de la página (OrbitControls usa preventDefault en wheel). */}
      <OrbitControls
        makeDefault={lockView}
        target={[0, 0, 0]}
        enablePan={false}
        enableZoom={!embedded}
        minDistance={embedded ? 2.05 : 2.65}
        maxDistance={embedded ? 6.2 : 8}
        /* El giro lo marca `planetSpinRef` (corteza + nubes + bits a la vez); evita doble rotación con la cámara. */
        autoRotate={false}
        enableDamping
        dampingFactor={0.09}
        rotateSpeed={0.5}
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
   * true = todo el disco iluminado como de día (sin terminador ni luces urbanas).
   * Si se omite y `embedded` es true, por defecto se asume día (mapa en home).
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
  /** Luna en órbita elíptica + rotación sincrónica (oculta en capas QA solo océano/tierra). */
  showMoon?: boolean;
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
}: GlobeV2Props) {
  const forceDaylightOn = forceDaylight !== undefined ? forceDaylight : embedded;

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

  /* Embebido: cámara más lejana para margen (Luna + auto-rotación sin recortes en el contenedor). */
  const camZ = embedded ? 3.92 : 3.14;

  const wrapperClass =
    className ??
    (embedded
      ? 'relative z-0 h-full w-full min-h-[50vh] flex-1 overflow-hidden [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none'
      : 'fixed inset-0 z-0 h-[100dvh] w-full min-h-0 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none');

  const rootClassName =
    className == null ? `${wrapperClass} ${earthNightStyles.earthNightContainer}` : wrapperClass;

  return (
    <div className={rootClassName}>
      {className == null ? <div className={earthNightStyles.atmosphereOverlay} aria-hidden /> : null}
      <Canvas
        shadows={false}
        camera={{ position: [0, 0, camZ], fov: 42, near: 0.1, far: 280 }}
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
          /* Primer frame alto; <ExposureSync/> ajusta según día/noche local. */
          gl.toneMappingExposure = embedded ? 2.65 : 2.45;
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
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
