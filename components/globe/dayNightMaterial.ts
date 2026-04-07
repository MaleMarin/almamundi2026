// components/globe/dayNightMaterial.ts
import * as THREE from 'three';
import {
  GLOBE_V2_LAND_MASK_SPEC_HIGH,
  GLOBE_V2_LAND_MASK_SPEC_LOW,
  GLOBE_V2_NORMAL_SCALE_CITY_LIGHTS,
} from '@/lib/globe/globe-v2-assets';
import { sunUnitVectorTowardSunEcef } from '@/lib/sunPosition';

type CityLightsUniforms = {
  uMap: { value: THREE.Texture | null };
  uNormalTex: { value: THREE.Texture | null };
  uHeightTex: { value: THREE.Texture | null };
  uDispScale: { value: number };
  uSunDir: { value: THREE.Vector3 };
  uStrength: { value: number };
  uNormalScale: { value: number };
  uFullDay: { value: number };
};

/**
 * Luces urbanas — asset: reemplazar URL en `GLOBE_V2_TEXTURE_URLS.nightLights` (lib/globe/globe-v2-assets.ts).
 * PNG/LDR actual; EXR/HDR implica DataTexture float + ajuste de este fragment (ver nota en assets).
 * Mismo desplazamiento en vértice que la superficie para alinear el overlay si hay heightMap.
 */
export function createCityLightsOverlayMaterial(
  lightsTex: THREE.Texture,
  normalTex: THREE.Texture,
  heightTex: THREE.Texture,
  displacementScale = 0,
  allowVertexTextureFetch = true
): THREE.ShaderMaterial {
  lightsTex.colorSpace = THREE.SRGBColorSpace;
  normalTex.colorSpace = THREE.NoColorSpace;
  heightTex.colorSpace = THREE.NoColorSpace;

  const uniforms = {
    uMap: { value: lightsTex },
    uNormalTex: { value: normalTex },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uStrength: { value: 0.504 },
    uNormalScale: { value: GLOBE_V2_NORMAL_SCALE_CITY_LIGHTS },
    uFullDay: { value: 0 },
    ...(allowVertexTextureFetch
      ? {
          uHeightTex: { value: heightTex },
          uDispScale: { value: displacementScale },
        }
      : {}),
  } as Record<string, THREE.IUniform> & CityLightsUniforms;

  const vertexShader = allowVertexTextureFetch
    ? /* glsl */ `
    attribute vec4 tangent;

    uniform sampler2D uHeightTex;
    uniform float uDispScale;

    varying vec2 vUv;
    varying vec3 vTw;
    varying vec3 vBw;
    varying vec3 vNw;

    void main() {
      vUv = uv;
      float rawH = texture2D(uHeightTex, uv).r;
      float specMask = rawH;
      float landW = 1.0 - smoothstep(${GLOBE_V2_LAND_MASK_SPEC_LOW}, ${GLOBE_V2_LAND_MASK_SPEC_HIGH}, specMask);
      float h = (0.5 - rawH) * 2.0;
      h *= max(landW, 0.0);
      vec3 displaced = position + normalize(normal) * (h * uDispScale);

      vec3 N = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec3 T = normalize((modelMatrix * vec4(tangent.xyz, 0.0)).xyz);
      T = normalize(T - dot(T, N) * N);
      vec3 B = normalize(cross(N, T) * tangent.w);
      vTw = T;
      vBw = B;
      vNw = N;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `
    : /* glsl */ `
    attribute vec4 tangent;

    varying vec2 vUv;
    varying vec3 vTw;
    varying vec3 vBw;
    varying vec3 vNw;

    void main() {
      vUv = uv;
      vec3 displaced = position;

      vec3 N = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec3 T = normalize((modelMatrix * vec4(tangent.xyz, 0.0)).xyz);
      T = normalize(T - dot(T, N) * N);
      vec3 B = normalize(cross(N, T) * tangent.w);
      vTw = T;
      vBw = B;
      vNw = N;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform sampler2D uMap;
    uniform sampler2D uNormalTex;
    uniform vec3 uSunDir;
    uniform float uStrength;
    uniform float uNormalScale;
    uniform float uFullDay;

    varying vec2 vUv;
    varying vec3 vTw;
    varying vec3 vBw;
    varying vec3 vNw;

    void main() {
      vec3 tmap = texture2D(uNormalTex, vUv).xyz * 2.0 - 1.0;
      tmap.xy *= uNormalScale;
      mat3 mGlobeTbn = mat3(vTw, vBw, vNw);
      vec3 n = normalize(mGlobeTbn * normalize(tmap));
      float ndl = dot(n, normalize(uSunDir));
      float night = uFullDay > 0.5 ? 0.0 : (1.0 - smoothstep(-0.36, 0.26, ndl));
      night = pow(clamp(night, 0.0, 1.0), 0.92);
      float dayLeak = smoothstep(-0.02, 0.18, ndl);
      night *= 1.0 - dayLeak * 0.82;
      float poleFade = smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.72, 1.0, vUv.y));

      float e = 0.00042;
      vec3 Lc = texture2D(uMap, vUv).rgb;
      vec3 Lx = texture2D(uMap, vUv + vec2(e, 0.0)).rgb;
      vec3 Lxm = texture2D(uMap, vUv - vec2(e, 0.0)).rgb;
      vec3 Ly = texture2D(uMap, vUv + vec2(0.0, e)).rgb;
      vec3 Lym = texture2D(uMap, vUv - vec2(0.0, e)).rgb;
      vec3 L = (Lc * 2.0 + Lx + Lxm + Ly + Lym) * 0.2;
      float pk = max(L.r, max(L.g, L.b));
      L *= smoothstep(0.08, 0.22, pk);
      float pkLift = pow(clamp(pk * 0.95, 0.0, 1.0), 0.88);
      float dense = smoothstep(0.35, 0.92, pkLift);
      vec3 boosted = L * mix(vec3(1.0), vec3(1.06, 1.04, 1.02), dense);
      boosted = boosted / (vec3(1.0) + boosted * 0.55);
      boosted = min(boosted, vec3(0.72));

      /* Tono #ffcc44 (cálido cinematográfico) */
      vec3 warmLow = vec3(1.0, 0.76, 0.22);
      vec3 warmMid = vec3(1.0, 0.85, 0.35);

      vec3 cityTint = mix(warmLow, warmMid, smoothstep(0.25, 0.88, pkLift));

      vec3 emit = boosted * cityTint * uStrength * night * poleFade;
      emit *= mix(1.0, 1.03, dense);

      gl_FragColor = vec4(emit, 1.0);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    name: 'GlobeCityLightsOverlay',
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  mat.name = 'GlobeCityLightsOverlay';
  return mat;
}

export type GlobeAtmosphereGlowOptions = {
  intensity?: number;
  power?: number;
  innerColor?: THREE.ColorRepresentation;
  outerColor?: THREE.ColorRepresentation;
};

/**
 * Halo orbital: más lectura a contraluz, casi apagado en sombra.
 * `opts` permite preset «home cinematográfica» sin mutar uniforms tras crear el material.
 */
export function createAtmosphereGlowMaterial(opts?: GlobeAtmosphereGlowOptions): THREE.ShaderMaterial {
  const uniforms = {
    uCamPos: { value: new THREE.Vector3(0, 0, 5) },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uInner: { value: new THREE.Color(opts?.innerColor ?? 0x1a5fff) },
    uOuter: { value: new THREE.Color(opts?.outerColor ?? 0x0a2060) },
    uIntensity: { value: opts?.intensity ?? 0.101 },
    uPower: { value: opts?.power ?? 3.15 },
    uFullDay: { value: 0 },
  };

  const vertexShader = /* glsl */ `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform vec3 uCamPos;
    uniform vec3 uSunDir;
    uniform vec3 uInner;
    uniform vec3 uOuter;
    uniform float uIntensity;
    uniform float uPower;
    uniform float uFullDay;

    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vec3 N = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCamPos - vWorldPos);
      float ndv = clamp(dot(N, viewDir), -1.0, 1.0);
      float rim = pow(1.0 - abs(ndv), uPower);
      float sunF = clamp(dot(N, normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0);
      float sunLit = uFullDay > 0.5 ? 1.0 : mix(0.18, 0.88, pow(sunF, 0.78));
      vec3 glow = mix(uInner, uOuter, rim) * rim * uIntensity * sunLit;
      gl_FragColor = vec4(glow, clamp(rim * 0.24 * sunLit, 0.0, 0.55));
    }
  `;

  const mat = new THREE.ShaderMaterial({
    name: 'GlobeAtmosphereGlow',
    uniforms: uniforms as Record<string, THREE.IUniform>,
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  mat.name = 'GlobeAtmosphereGlow';
  return mat;
}

const _axisSunX = new THREE.Vector3(1, 0, 0);

/**
 * Dirección Tierra → Sol en **espacio mundial** (antes del giro GMST del mesh).
 * El vector está en el marco del hijo de la oblicuidad (eje Y = rotación diaria); solo se aplica `R_x(obliquity)`.
 * La rotación `planetSpinRef` (GMST) va **solo** en la corteza: si rotáramos también la luz con Y, el terminador quedaría fijo en la textura.
 */
export function computeSunDirection(
  date: Date,
  obliquityXRad: number,
  target?: THREE.Vector3
): THREE.Vector3 {
  const ecef = sunUnitVectorTowardSunEcef(date);
  const v = target ?? new THREE.Vector3();
  v.set(ecef.x, ecef.y, ecef.z);
  v.applyAxisAngle(_axisSunX, obliquityXRad);
  return v.normalize();
}

/*
 * Superficie día/noche: ver `globeOceanLandMaterials.ts` (OceanSphere + LandSphere).
 * GlobeCityLightsOverlay + GlobeAtmosphereGlow: GLSL ES 1.0 (gl_FragColor, texture2D).
 */
