// components/globe/dayNightMaterial.ts
import * as THREE from 'three';
import {
  GLOBE_V2_LAND_MASK_SPEC_HIGH,
  GLOBE_V2_LAND_MASK_SPEC_LOW,
  GLOBE_V2_NORMAL_SCALE_CITY_LIGHTS,
} from '@/lib/globe/globe-v2-assets';
import { sunDirectionUtc } from '@/lib/sunPosition';

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
    uStrength: { value: 0.42 },
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
      float night = uFullDay > 0.5 ? 0.0 : (1.0 - smoothstep(-0.44, 0.22, ndl));
      night = pow(clamp(night, 0.0, 1.0), 0.76);
      float dayLeak = smoothstep(-0.08, 0.14, ndl);
      night *= 1.0 - dayLeak * 0.92;
      float poleFade = smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.72, 1.0, vUv.y));

      float e = 0.00042;
      vec3 Lc = texture2D(uMap, vUv).rgb;
      vec3 Lx = texture2D(uMap, vUv + vec2(e, 0.0)).rgb;
      vec3 Lxm = texture2D(uMap, vUv - vec2(e, 0.0)).rgb;
      vec3 Ly = texture2D(uMap, vUv + vec2(0.0, e)).rgb;
      vec3 Lym = texture2D(uMap, vUv - vec2(0.0, e)).rgb;
      vec3 L = (Lc * 2.2 + Lx + Lxm + Ly + Lym) * 0.2;
      float pk = max(L.r, max(L.g, L.b));
      L *= smoothstep(0.045, 0.12, pk);
      float pkLift = pow(clamp(pk * 1.18, 0.0, 1.0), 0.68);
      float dense = smoothstep(0.28, 0.94, pkLift);
      vec3 boosted = L * mix(vec3(1.0), vec3(1.24, 1.18, 1.1), dense);
      boosted = boosted / (vec3(1.0) + boosted * 0.34);
      boosted = min(boosted, vec3(1.02));

      vec3 actionGold = vec3(0.98, 0.8, 0.36);
      vec3 coreGold = vec3(1.0, 0.92, 0.58);
      vec3 whiteHot = vec3(1.0, 0.99, 0.96);

      vec3 cityTint = mix(actionGold, coreGold, smoothstep(0.18, 0.86, pkLift));
      cityTint = mix(cityTint, whiteHot, smoothstep(0.48, 0.99, pkLift));

      vec3 emit = boosted * cityTint * uStrength * night * poleFade;
      emit *= mix(1.0, 1.22, dense * dense);
      float bloomWide = smoothstep(0.14, 0.82, pkLift) * pkLift;
      emit += boosted * vec3(1.0, 0.78, 0.45) * bloomWide * 0.28 * uStrength * night * poleFade;
      float bloomCore = smoothstep(0.38, 0.99, pkLift) * pkLift;
      emit += boosted * coreGold * bloomCore * 0.42 * uStrength * night * poleFade;

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

/**
 * Halo orbital: más lectura a contraluz, casi apagado en sombra.
 */
export function createAtmosphereGlowMaterial(): THREE.ShaderMaterial {
  const uniforms = {
    uCamPos: { value: new THREE.Vector3(0, 0, 5) },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uInner: { value: new THREE.Color(0xd8eefc) },
    uOuter: { value: new THREE.Color(0x5c94b8) },
    uIntensity: { value: 0.138 },
    uPower: { value: 2.92 },
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
      float sunLit = uFullDay > 0.5 ? 1.0 : mix(0.22, 1.0, pow(sunF, 0.72));
      vec3 glow = mix(uInner, uOuter, rim) * rim * uIntensity * sunLit;
      gl_FragColor = vec4(glow, clamp(rim * 0.36 * sunLit, 0.0, 1.0));
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

export function computeSunDirection(date: Date) {
  const s = sunDirectionUtc(date);
  return new THREE.Vector3(s.x, s.y, s.z);
}

/*
 * Superficie día/noche: ver `globeOceanLandMaterials.ts` (OceanSphere + LandSphere).
 * GlobeCityLightsOverlay + GlobeAtmosphereGlow: GLSL ES 1.0 (gl_FragColor, texture2D).
 */
