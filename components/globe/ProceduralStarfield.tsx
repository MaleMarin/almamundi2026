'use client';

/**
 * Campo de estrellas de fondo: posiciones/tamaños/brillos en CPU (sin textura).
 * Debe vivir dentro de camera.far (GlobeV2 usa far 1000).
 * `color` lo inyecta Three (`vertexColors`); no redeclararlo en el vertex shader.
 */

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type ProceduralStarfieldProps = {
  count?: number;
  radius?: number;
  twinkle?: number;
};

function hash01(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function ProceduralStarfield({
  count = 2400,
  radius = 420,
  twinkle = 0.03,
}: ProceduralStarfieldProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = hash01(i, 1);
      const v = hash01(i, 2);
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.92 + 0.08 * hash01(i, 3));
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      /* Mayoría apenas visibles; pocas un poco más claras. Nada dorado (bits). */
      const lum = Math.pow(hash01(i, 4), 3.4);
      const temp = hash01(i, 5);
      const base = 0.14 + lum * 0.62;
      colors[i * 3] = base * (0.82 + 0.08 * (1.0 - temp));
      colors[i * 3 + 1] = base * (0.88 + 0.06 * hash01(i, 6));
      colors[i * 3 + 2] = base * (0.94 + 0.06 * temp);

      phases[i] = hash01(i, 8) * Math.PI * 2;
    }
    return { positions, colors, phases };
  }, [count, radius]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTwinkle: { value: twinkle },
        uPixelRatio: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute float aPhase;
        varying vec3 vColor;
        varying float vPhase;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vPhase = aPhase;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float lum = max(max(color.r, color.g), color.b);
          float sz = mix(1.15, 2.35, pow(lum, 2.2));
          gl_PointSize = sz * uPixelRatio;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec3 vColor;
        varying float vPhase;
        uniform float uTime;
        uniform float uTwinkle;

        void main() {
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float d = dot(p, p);
          if (d > 1.0) discard;
          float core = exp(-d * 5.2);
          float tw = 1.0 - uTwinkle * 0.45 + uTwinkle * 0.45 * sin(uTime * 0.48 + vPhase);
          vec3 rgb = vColor * core * tw;
          float a = core * tw * 0.78;
          gl_FragColor = vec4(rgb, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      vertexColors: true,
    });
    return mat;
  }, [twinkle]);

  useLayoutEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame(({ clock, gl }) => {
    const m = matRef.current ?? material;
    m.uniforms.uTime.value = clock.elapsedTime;
    m.uniforms.uTwinkle.value = twinkle;
    m.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);
  });

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return g;
  }, [positions, colors, phases]);

  useLayoutEffect(() => {
    return () => {
      geom.dispose();
    };
  }, [geom]);

  return (
    <points
      ref={(node) => {
        if (node) node.raycast = () => {};
      }}
      geometry={geom}
      frustumCulled={false}
      renderOrder={-40}
    >
      <primitive object={material} ref={matRef} attach="material" />
    </points>
  );
}
