'use client';

/**
 * Campo de estrellas de fondo: posiciones en CPU, tamaño en píxeles de pantalla
 * (sin sizeAttenuation). `color` lo inyecta Three (`vertexColors`); no redeclararlo.
 * Sutileza por opacidad, no por tamaño subpíxel (mínimo 2px).
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
  count = 2500,
  radius = 420,
  twinkle = 0.03,
}: ProceduralStarfieldProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, opacities, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const opacities = new Float32Array(count);
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

      /* Blanco frío; temperatura leve. El brillo va en aOpacity, no en RGB. */
      const temp = hash01(i, 5);
      colors[i * 3] = 0.84 + 0.08 * temp;
      colors[i * 3 + 1] = 0.90 + 0.05 * hash01(i, 6);
      colors[i * 3 + 2] = 0.97 + 0.03 * (1.0 - temp);

      opacities[i] = 0.16 + Math.pow(hash01(i, 4), 3.1) * 0.72;
      phases[i] = hash01(i, 8) * Math.PI * 2;
    }
    return { positions, colors, opacities, phases };
  }, [count, radius]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTwinkle: { value: twinkle },
        uPixelRatio: { value: 1 },
        uPointSize: { value: 2 },
      },
      vertexShader: /* glsl */ `
        attribute float aPhase;
        attribute float aOpacity;
        varying vec3 vColor;
        varying float vPhase;
        varying float vOpacity;
        uniform float uPixelRatio;
        uniform float uPointSize;

        void main() {
          vColor = color;
          vPhase = aPhase;
          vOpacity = aOpacity;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(uPointSize, 2.0) * uPixelRatio;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec3 vColor;
        varying float vPhase;
        varying float vOpacity;
        uniform float uTime;
        uniform float uTwinkle;

        void main() {
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float d = dot(p, p);
          if (d > 1.0) discard;
          float edge = 1.0 - smoothstep(0.55, 1.0, sqrt(d));
          float tw = 1.0 - uTwinkle * 0.22 + uTwinkle * 0.22 * sin(uTime * 0.42 + vPhase);
          float a = vOpacity * edge * tw;
          gl_FragColor = vec4(vColor * a, a);
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
    m.uniforms.uPointSize.value = 2;
  });

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return g;
  }, [positions, colors, opacities, phases]);

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
