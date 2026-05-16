// components/globe/globeOceanLandMaterials.ts
/**
 * Océano y tierra en esferas separadas (sin mezcla mar/tierra en un solo fragment).
 * - Océano: procedural + spec / fresnel; terminador día/noche con `dot(N, sun)` (UTC vía uSunDir).
 * - Tierra: albedo + normal + displacement; descarte por máscara; terminador con normal geométrica (vNw).
 * GLSL ES 1.0 (texture2D, gl_FragColor).
 */
import * as THREE from 'three';
import {
  GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE0,
  GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE1,
  GLOBE_V2_LAND_MASK_DAY_OCEAN_GATE,
  GLOBE_V2_LAND_MASK_DAY_OCEAN_RG,
  GLOBE_V2_LAND_MASK_DILATE_UV,
  GLOBE_V2_LAND_MASK_SPEC_DISCARD,
  GLOBE_V2_LAND_MASK_SPEC_HIGH,
  GLOBE_V2_LAND_MASK_SPEC_LOW,
  GLOBE_V2_LAND_MASK_SPEC_OPEN_WATER,
  GLOBE_V2_NORMAL_SCALE_SURFACE,
} from '@/lib/globe/globe-v2-assets';

/** Peso relieve en vértice (misma convención que luces urbanas). */
function smoothLandWeight(specR: string): string {
  return `(1.0 - smoothstep(${GLOBE_V2_LAND_MASK_SPEC_LOW}, ${GLOBE_V2_LAND_MASK_SPEC_HIGH}, ${specR}))`;
}

/**
 * OceanSphere — solo mar: color profundo, fresnel, brillo solar acotado, micro-onda procedural.
 * `dayTex` (earth day) alinea la máscara mar/tierra con LandSphere (spec + heurística RGB).
 */
export function createOceanSphereMaterial(specTex: THREE.Texture, dayTex: THREE.Texture): THREE.ShaderMaterial {
  specTex.colorSpace = THREE.NoColorSpace;
  dayTex.colorSpace = THREE.SRGBColorSpace;

  const uniforms = {
    uSpecTex: { value: specTex },
    uDayTex: { value: dayTex },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uCamPos: { value: new THREE.Vector3(0, 0, 5) },
    /** 0 = usar uSunDir (UTC). 1 = uSunDirOverride (solo QA océano). */
    uUseSunOverride: { value: 0 },
    uSunDirOverride: { value: new THREE.Vector3(1, 0, 0) },
    /**
     * 1 = no dibujar mar donde la máscara es tierra (misma dilatación/umbral que LandSphere).
     * Evita color y profundidad de océano bajo continentes cuando LandSphere descarta o compite.
     * 0 = esfera completa (solo modo QA `layerBuildStage === 'ocean'`).
     */
    uOceanMaskLand: { value: 1 },
    /** 1 = sin terminador: todo el disco como hemisferio iluminado (p. ej. `forceDaylight` en GlobeV2). */
    uFullDay: { value: 0 },
  };

  /* Esfera rígida como la tierra: sin micro-olas en vértice (evita que el mar “se deslice” frente a continentes). */
  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    precision highp float;

    uniform sampler2D uSpecTex;
    uniform sampler2D uDayTex;
    uniform vec3 uSunDir;
    uniform vec3 uSunDirOverride;
    uniform float uUseSunOverride;
    uniform vec3 uCamPos;
    uniform float uOceanMaskLand;
    uniform float uFullDay;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      float specSample = texture2D(uSpecTex, vUv).r;

      /* Misma partición que LandSphere: spec dilatado + mapa diurno (evita mar bajo continentes por spec falso). */
      if (uOceanMaskLand > 0.5) {
        float e = ${GLOBE_V2_LAND_MASK_DILATE_UV};
        float sp0 = specSample;
        float spM = min(sp0, min(
          texture2D(uSpecTex, vUv + vec2(e, 0.0)).r,
          min(texture2D(uSpecTex, vUv + vec2(-e, 0.0)).r,
          min(texture2D(uSpecTex, vUv + vec2(0.0, e)).r,
              texture2D(uSpecTex, vUv + vec2(0.0, -e)).r))));
        vec3 d = texture2D(uDayTex, vUv).rgb;
        float dayOcean = smoothstep(${GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE0}, ${GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE1},
          d.b - max(d.r, d.g) * ${GLOBE_V2_LAND_MASK_DAY_OCEAN_RG});
        bool isOpenWater =
          (spM > ${GLOBE_V2_LAND_MASK_SPEC_DISCARD} && dayOcean > ${GLOBE_V2_LAND_MASK_DAY_OCEAN_GATE})
          || (spM > ${GLOBE_V2_LAND_MASK_SPEC_OPEN_WATER});
        if (!isOpenWater) discard;
      }

      vec3 N = normalize(vWorldNormal);
      vec3 V = normalize(uCamPos - vWorldPos);
      vec3 L = uUseSunOverride > 0.5 ? normalize(uSunDirOverride) : normalize(uSunDir);
      float mu = dot(N, L);
      float ndlRaw = max(mu, 0.0);
      /* Con uFullDay: disco legible sin empujar el centro a blanco puro (menos “continentes quemados”). */
      float ndl = uFullDay > 0.5 ? clamp(0.68 + 0.32 * ndlRaw, 0.78, 1.0) : ndlRaw;
      float ndv = clamp(dot(N, V), 0.0, 1.0);
      float openWater = smoothstep(0.36, 0.92, specSample);

      /* Océano azul profundo pero legible (NASA Earth Observatory / día) */
      vec3 deep = mix(vec3(0.039, 0.165, 0.431), vec3(0.05, 0.22, 0.52), uFullDay);
      vec3 mid = mix(vec3(0.06, 0.22, 0.48), vec3(0.1, 0.32, 0.58), uFullDay);
      float bathy = 0.5 + 0.5 * sin(vUv.x * 18.0 + vUv.y * 11.0);
      bathy = bathy * 0.06 + 0.94;
      vec3 base = mix(deep, mid, bathy * 0.12 + 0.1);

      /* Fresnel solo en limbo (ndv bajo). Sin término extra que suba el centro del disco. */
      float rim = pow(1.0 - ndv, 6.2);
      vec3 fresTint = vec3(0.28, 0.42, 0.55);
      float fresAmt = rim * 0.055;

      /* Difuso: más lift en modo día completo para evitar océanos casi negros. */
      float diff = mix(0.36 + 0.44 * pow(ndl, 1.12), 0.48 + 0.52 * pow(ndl, 1.05), uFullDay);
      vec3 colDay = base * diff * mix(0.98, 1.08, uFullDay);

      /* Brillo solar: Blinn-Phong (H), lóbulo estrecho; solo agua abierta; sin segundo lóbulo amplio. */
      vec3 H = normalize(L + V);
      float nh = max(dot(N, H), 0.0);
      float sunSpec = pow(nh, 384.0) * openWater * 0.055 * smoothstep(0.04, 0.98, ndl);
      /* Highlight especular cálido (sol sobre el mar) */
      colDay += vec3(0.95, 0.88, 0.72) * sunSpec;

      /* Fresnel acoplado al sol en el día (no “luz de estudio” desde la cámara en el centro). */
      colDay += fresTint * fresAmt * ndl * (0.35 + 0.65 * openWater);

      vec3 colNight = base * vec3(0.08, 0.1, 0.16) + vec3(0.008, 0.014, 0.032);
      colNight += fresTint * rim * 0.032 * (0.22 + 0.48 * openWater);

      float dayW = uFullDay > 0.5 ? 1.0 : smoothstep(-0.42, 0.36, mu);
      vec3 col = mix(colNight, colDay, dayW);
      col = pow(clamp(col, 0.0, 1.0), vec3(0.98));

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    name: 'GlobeOceanSphere',
    uniforms: uniforms as Record<string, THREE.IUniform>,
    vertexShader,
    fragmentShader,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    side: THREE.FrontSide,
  });
  return mat;
}

/**
 * LandSphere — solo continentes: descarte por máscara; albedo día + TBN + relieve; mate (sin spec plástico).
 */
export function createLandSphereMaterial(
  dayTex: THREE.Texture,
  normalTex: THREE.Texture,
  heightTex: THREE.Texture,
  landMaskTex: THREE.Texture,
  displacementScale = 0,
  allowVertexTextureFetch = true
): THREE.ShaderMaterial {
  dayTex.colorSpace = THREE.SRGBColorSpace;
  normalTex.colorSpace = THREE.NoColorSpace;
  heightTex.colorSpace = THREE.NoColorSpace;
  landMaskTex.colorSpace = THREE.NoColorSpace;

  const uniforms = {
    uDayTex: { value: dayTex },
    uNormalTex: { value: normalTex },
    uLandMaskTex: { value: landMaskTex },
    uNormalScale: { value: GLOBE_V2_NORMAL_SCALE_SURFACE },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uCamPos: { value: new THREE.Vector3(0, 0, 5) },
    uFullDay: { value: 0 },
    ...(allowVertexTextureFetch
      ? {
          uHeightTex: { value: heightTex },
          uDispScale: { value: displacementScale },
        }
      : {}),
  } as Record<string, THREE.IUniform>;

  const lm = smoothLandWeight('specMask');

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
      float landW = ${lm};
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
      vec4 wp = modelMatrix * vec4(displaced, 1.0);
      gl_Position = projectionMatrix * viewMatrix * wp;
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
    precision highp float;

    uniform sampler2D uDayTex;
    uniform sampler2D uNormalTex;
    uniform sampler2D uLandMaskTex;
    uniform float uNormalScale;
    uniform vec3 uSunDir;
    uniform float uFullDay;

    varying vec2 vUv;
    varying vec3 vTw;
    varying vec3 vBw;
    varying vec3 vNw;

    void main() {
      float e = ${GLOBE_V2_LAND_MASK_DILATE_UV};
      float sp0 = texture2D(uLandMaskTex, vUv).r;
      float spM = min(sp0, min(
        texture2D(uLandMaskTex, vUv + vec2(e, 0.0)).r,
        min(texture2D(uLandMaskTex, vUv + vec2(-e, 0.0)).r,
        min(texture2D(uLandMaskTex, vUv + vec2(0.0, e)).r,
            texture2D(uLandMaskTex, vUv + vec2(0.0, -e)).r))));

      vec3 d0 = texture2D(uDayTex, vUv).rgb;
      float dayOcean = smoothstep(${GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE0}, ${GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE1},
        d0.b - max(d0.r, d0.g) * ${GLOBE_V2_LAND_MASK_DAY_OCEAN_RG});
      bool isOpenWater =
        (spM > ${GLOBE_V2_LAND_MASK_SPEC_DISCARD} && dayOcean > ${GLOBE_V2_LAND_MASK_DAY_OCEAN_GATE})
        || (spM > ${GLOBE_V2_LAND_MASK_SPEC_OPEN_WATER});
      if (isOpenWater) discard;

      float landMask = 1.0 - smoothstep(0.32, 0.68, sp0);

      /* Albedo casi directo del mapa: poco “grade” en shader (menos aspecto videojuego). */
      float y = dot(d0, vec3(0.299, 0.587, 0.114));
      vec3 gray = vec3(y);
      d0 = clamp(mix(gray, d0, 1.02), 0.0, 1.0);
      d0 = clamp((d0 - 0.5) * 0.88 + 0.5, 0.0, 1.0);

      vec3 tmap = texture2D(uNormalTex, vUv).xyz * 2.0 - 1.0;
      float landScale = mix(0.82, 1.22, landMask);
      tmap.xy *= uNormalScale * landScale;

      mat3 mTbn = mat3(vTw, vBw, vNw);
      vec3 n = normalize(mTbn * normalize(tmap));
      vec3 s = normalize(uSunDir);
      float ndlRaw = max(dot(n, s), 0.0);
      float ndl = uFullDay > 0.5 ? clamp(0.64 + 0.36 * ndlRaw, 0.74, 0.98) : ndlRaw;

      vec3 geomN = normalize(vNw);
      float mu = dot(geomN, s);

      float slope = clamp(length(tmap.xy), 0.0, 1.85);
      float mountainPop = 1.0 + landMask * slope * 0.38;

      float amb = mix(0.2, 0.28, uFullDay);
      float dif = mix(0.68, 0.78, uFullDay) * pow(ndl, 0.94);
      vec3 litDay = d0 * (amb + dif) * mountainPop * mix(1.0, 1.06, uFullDay);
      /* Atenúa zonas claras (arena/nieve) sin teñir el resto. */
      float luma = dot(d0, vec3(0.299, 0.587, 0.114));
      float hot = smoothstep(0.5, 0.86, luma);
      litDay *= mix(1.0, 0.78, hot);

      vec3 litNight = d0 * vec3(0.1, 0.12, 0.17) * (0.38 + 0.5 * mountainPop);
      litNight += vec3(0.02, 0.024, 0.038) * landMask;

      float dayW = uFullDay > 0.5 ? 1.0 : smoothstep(-0.38, 0.34, mu);
      vec3 lit = mix(litNight, litDay, dayW);
      if (uFullDay < 0.5) {
        lit = max(lit, d0 * 0.11);
      }
      lit = pow(clamp(lit, 0.0, 1.0), vec3(0.99));

      gl_FragColor = vec4(lit, 1.0);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    name: 'GlobeLandSphere',
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    side: THREE.FrontSide,
  });
  return mat;
}
