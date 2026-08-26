import * as THREE from 'three';

/**
 * Punto circular suave (bits / historias). Sin rayos ni cruces: el alfa cae
 * con la distancia al centro y se descarta fuera del radio.
 */
function createCircularMarkerMaterial(
  intensity: number,
  coreRgb: [number, number, number],
  rimRgb: [number, number, number],
  materialName: string
): THREE.ShaderMaterial {
  const mat = new THREE.ShaderMaterial({
    name: materialName,
    uniforms: {
      uIntensity: { value: intensity },
      uCore: { value: new THREE.Vector3(coreRgb[0], coreRgb[1], coreRgb[2]) },
      uRim: { value: new THREE.Vector3(rimRgb[0], rimRgb[1], rimRgb[2]) },
      uLayerOpacity: { value: 1 },
    },
    glslVersion: THREE.GLSL3,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uIntensity;
      uniform vec3 uCore;
      uniform vec3 uRim;
      uniform float uLayerOpacity;
      varying vec2 vUv;

      layout(location = 0) out highp vec4 fragColor;

      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c) * 2.0;
        if (d > 1.0) discard;

        float core = exp(-d * d * 7.5);
        float halo = (1.0 - smoothstep(0.0, 1.0, d)) * 0.55;
        float edge = 1.0 - smoothstep(0.72, 1.0, d);
        float alpha = clamp((core * 1.15 + halo) * edge * uIntensity * uLayerOpacity, 0.0, 1.0);

        vec3 col = mix(uRim, uCore, clamp(core * 1.35, 0.0, 1.0));
        fragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  mat.name = materialName;
  return mat;
}

/**
 * Material aditivo tipo lucerna nocturna: núcleo brillante, halo cálido (sodio / ciudad).
 */
export function createBitStarBurstMaterial(
  intensity: number,
  materialName = 'GlobeBitStarBurst'
): THREE.ShaderMaterial {
  const core = new THREE.Color('#FF4A1C').convertSRGBToLinear();
  const rim = new THREE.Color('#D13D17').convertSRGBToLinear();
  return createCircularMarkerMaterial(
    intensity,
    [core.r, core.g, core.b],
    [rim.r, rim.g, rim.b],
    materialName
  );
}

/** Naranja fuerte de historias (`#ff7a00`), en lineal para ShaderMaterial. */
function almaMundiCoralLinear(): THREE.Vector3 {
  const c = new THREE.Color('#ff7a00').convertSRGBToLinear();
  return new THREE.Vector3(c.r, c.g, c.b);
}

/**
 * Disco coral opaco (historias). NormalBlending: el aditivo + ACES las pintaba de oro.
 */
export function createStoryStarBurstMaterial(
  intensity: number,
  materialName = 'GlobeStoryStarBurst'
): THREE.ShaderMaterial {
  const coral = almaMundiCoralLinear();
  const core = new THREE.Color('#ffb020').convertSRGBToLinear();
  const mat = new THREE.ShaderMaterial({
    name: materialName,
    uniforms: {
      uIntensity: { value: intensity },
      uCore: { value: new THREE.Vector3(core.r, core.g, core.b) },
      uRim: { value: coral },
      uLayerOpacity: { value: 1 },
    },
    glslVersion: THREE.GLSL3,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uIntensity;
      uniform vec3 uCore;
      uniform vec3 uRim;
      uniform float uLayerOpacity;
      varying vec2 vUv;

      layout(location = 0) out highp vec4 fragColor;

      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c) * 2.0;
        if (d > 1.0) discard;

        float fill = 1.0 - smoothstep(0.56, 0.66, d);
        float ring = smoothstep(0.74, 0.80, d) * (1.0 - smoothstep(0.90, 0.98, d));
        float alpha = max(fill, ring) * clamp(uIntensity, 0.0, 1.0) * uLayerOpacity;
        if (alpha < 0.03) discard;
        vec3 col = mix(uRim, uCore, fill);
        fragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  mat.name = materialName;
  return mat;
}

/**
 * Anillo concéntrico tipo onda expansiva (historias). Fase y período por vértice
 * para desfasar cada marcador con un material compartido.
 */
export function createStoryRippleMaterial(
  intensity = 1,
  materialName = 'GlobeStoryRipple'
): THREE.ShaderMaterial {
  const coral = almaMundiCoralLinear();
  const mat = new THREE.ShaderMaterial({
    name: materialName,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uCoral: { value: coral },
      uLayerOpacity: { value: 1 },
    },
    glslVersion: THREE.GLSL3,
    vertexShader: /* glsl */ `
      in float aPhase;
      in float aPeriod;
      out vec2 vUv;
      out float vPhase;
      out float vPeriod;
      void main() {
        vUv = uv;
        vPhase = aPhase;
        vPeriod = aPeriod;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uCoral;
      uniform float uLayerOpacity;
      in vec2 vUv;
      in float vPhase;
      in float vPeriod;

      layout(location = 0) out highp vec4 fragColor;

      void main() {
        vec2 c = vUv - 0.5;
        float r = length(c) * 2.0;
        if (r > 1.0) discard;

        float period = clamp(vPeriod, 2.0, 4.0);
        float t = fract(uTime / period + vPhase);
        float ringR = mix(0.58, 0.96, t);
        float halfW = 0.046;
        float dist = abs(r - ringR);
        float ring = 1.0 - smoothstep(0.0, halfW, dist);
        float fade = pow(1.0 - t, 0.65);
        float alpha = ring * fade * 0.98 * uIntensity * uLayerOpacity;
        if (alpha < 0.05) discard;

        fragColor = vec4(uCoral, alpha);
      }
    `,
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  mat.name = materialName;
  return mat;
}

export function makeStoryRippleGeometry(bitId: number): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(1, 1);
  const n = g.getAttribute('position').count;
  const phase = ((Math.sin(bitId * 127.1 + 19.7) * 43758.5453) % 1 + 1) % 1;
  const period = 2.15 + ((((bitId * 17) % 100) + 100) % 100) / 100 * 1.7;
  g.setAttribute('aPhase', new THREE.BufferAttribute(new Float32Array(n).fill(phase), 1));
  g.setAttribute('aPeriod', new THREE.BufferAttribute(new Float32Array(n).fill(period), 1));
  return g;
}

/**
 * Anillo fino, frío y hueco: noticias (efímeras). No compite con el disco coral.
 */
export function createNewsRingMaterial(
  intensity = 0.88,
  materialName = 'GlobeNewsRing'
): THREE.ShaderMaterial {
  const rim = new THREE.Color('#7ec8ff').convertSRGBToLinear();
  const core = new THREE.Color('#e8f6ff').convertSRGBToLinear();
  const mat = new THREE.ShaderMaterial({
    name: materialName,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uCore: { value: new THREE.Vector3(core.r, core.g, core.b) },
      uRim: { value: new THREE.Vector3(rim.r, rim.g, rim.b) },
      uLayerOpacity: { value: 1 },
    },
    glslVersion: THREE.GLSL3,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uCore;
      uniform vec3 uRim;
      uniform float uLayerOpacity;
      varying vec2 vUv;

      layout(location = 0) out highp vec4 fragColor;

      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c) * 2.0;
        if (d > 1.0) discard;

        float pulse = 0.62 + 0.38 * sin(uTime * 2.35);
        float ring = smoothstep(0.52, 0.62, d) * (1.0 - smoothstep(0.86, 0.98, d));
        float alpha = ring * pulse * uIntensity * uLayerOpacity;
        if (alpha < 0.04) discard;
        vec3 col = mix(uRim, uCore, 1.0 - smoothstep(0.55, 0.82, d));
        fragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  mat.name = materialName;
  return mat;
}
