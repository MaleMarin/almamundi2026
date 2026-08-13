'use client';

/**
 * Campo de estrellas de fondo: posiciones/tamaños/brillos en CPU (sin textura).
 * Densidad baja; no compite con bits de historias (dorados, sobre la Tierra).
 */

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type ProceduralStarfieldProps = {
  /** Número de estrellas (home embebida: bajo). */
  count?: number;
  /** Radio de la esfera de fondo. */
  radius?: number;
  /** Amplitud de titileo (0 = estático). Muy bajo para no llamar la atención. */
  twinkle?: number;
};

function hash01(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function ProceduralStarfield({
  count = 320,
  radius = 480,
  twinkle = 0.04,
}: ProceduralStarfieldProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      /* Distribución uniforme en esfera. */
      const u = hash01(i, 1);
      const v = hash01(i, 2);
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.92 + 0.08 * hash01(i, 3));
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      /* Mayoría tenues; pocas un poco más brillantes. Nada dorado (bits). */
      const bright = Math.pow(hash01(i, 4), 2.4);
      const cool = 0.92 + 0.08 * hash01(i, 5);
      const base = 0.22 + bright * 0.55;
      colors[i * 3] = base * (0.88 + 0.06 * hash01(i, 6));
      colors[i * 3 + 1] = base * (0.9 + 0.06 * hash01(i, 7));
      colors[i * 3 + 2] = base * cool;

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
        attribute vec3 color;
        attribute float aPhase;
        varying vec3 vColor;
        varying float vPhase;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vPhase = aPhase;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          /* Tamaño en px: mayoría ~1px, pocas hasta ~2.2px (no como bits). */
          float lum = max(max(color.r, color.g), color.b);
          float sz = mix(0.7, 2.15, pow(lum, 1.35));
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
          /* Núcleo suave; sin cruz/sprite que se confunda con bits. */
          float core = exp(-d * 3.8);
          float tw = 1.0 - uTwinkle * 0.5 + uTwinkle * 0.5 * sin(uTime * 0.55 + vPhase);
          vec3 rgb = vColor * core * tw;
          float a = core * tw * 0.85;
          gl_FragColor = vec4(rgb, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
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
