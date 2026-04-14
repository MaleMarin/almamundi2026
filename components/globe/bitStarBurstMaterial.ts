import * as THREE from 'three';

/**
 * Material aditivo tipo lucerna nocturna: punto muy brillante, halo cálido (sodio / ciudad).
 */
export function createBitStarBurstMaterial(
  intensity: number,
  materialName = 'GlobeBitStarBurst'
): THREE.ShaderMaterial {
  const mat = new THREE.ShaderMaterial({
    name: materialName,
    uniforms: {
      uIntensity: { value: intensity },
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
      varying vec2 vUv;

      layout(location = 0) out highp vec4 fragColor;

      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c) * 2.0;
        float edge = 1.0 - smoothstep(0.9, 1.02, d);

        float angle = atan(c.y, c.x);
        float r8a = pow(abs(cos(angle * 4.0)), 20.0);
        float r8b = pow(abs(cos(angle * 4.0 + 0.785398)), 20.0);
        float spokes = max(r8a, r8b) * smoothstep(0.94, 0.06, d);

        vec2 nd = length(c) > 1e-4 ? normalize(c) : vec2(0.0);
        float d1 = abs(dot(nd, vec2(0.70710678, 0.70710678)));
        float d2 = abs(dot(nd, vec2(-0.70710678, 0.70710678)));
        float streak = pow(max(d1, d2), 26.0) * smoothstep(0.96, 0.08, d) * 0.88;

        float core = exp(-d * d * 38.0);
        float halo = smoothstep(1.0, 0.0, d) * 0.62;

        float alpha = (core * 1.05 + halo * 0.72 + spokes * 0.55 + streak * 0.42) * uIntensity;
        alpha = clamp(alpha * edge, 0.0, 1.0);

        vec3 sodium = vec3(1.0, 0.88, 0.38);
        vec3 warm = vec3(1.0, 0.76, 0.22);
        vec3 white = vec3(1.0);
        vec3 col = mix(sodium, white, clamp(core * 1.65, 0.0, 1.0));
        col = mix(col, warm, spokes * 0.42);
        col *= 1.1;

        fragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  mat.name = materialName;
  return mat;
}

/**
 * Mismo brillo que los bits, tono naranja AlmaMundi para historias en el globo.
 */
export function createStoryStarBurstMaterial(
  intensity: number,
  materialName = 'GlobeStoryStarBurst'
): THREE.ShaderMaterial {
  const mat = new THREE.ShaderMaterial({
    name: materialName,
    uniforms: {
      uIntensity: { value: intensity },
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
      varying vec2 vUv;

      layout(location = 0) out highp vec4 fragColor;

      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c) * 2.0;
        float edge = 1.0 - smoothstep(0.9, 1.02, d);

        float angle = atan(c.y, c.x);
        float r8a = pow(abs(cos(angle * 4.0)), 20.0);
        float r8b = pow(abs(cos(angle * 4.0 + 0.785398)), 20.0);
        float spokes = max(r8a, r8b) * smoothstep(0.94, 0.06, d);

        vec2 nd = length(c) > 1e-4 ? normalize(c) : vec2(0.0);
        float d1 = abs(dot(nd, vec2(0.70710678, 0.70710678)));
        float d2 = abs(dot(nd, vec2(-0.70710678, 0.70710678)));
        float streak = pow(max(d1, d2), 26.0) * smoothstep(0.96, 0.08, d) * 0.88;

        float core = exp(-d * d * 38.0);
        float halo = smoothstep(1.0, 0.0, d) * 0.62;

        float alpha = (core * 1.05 + halo * 0.72 + spokes * 0.55 + streak * 0.42) * uIntensity;
        alpha = clamp(alpha * edge, 0.0, 1.0);

        vec3 coral = vec3(1.0, 0.42, 0.18);
        vec3 deep = vec3(1.0, 0.28, 0.08);
        vec3 white = vec3(1.0);
        vec3 col = mix(coral, white, clamp(core * 1.55, 0.0, 1.0));
        col = mix(col, deep, spokes * 0.38);
        col *= 1.08;

        fragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  mat.name = materialName;
  return mat;
}
