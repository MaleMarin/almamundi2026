'use client';

/**
 * Halo atmosférico alrededor del globo (EarthGlobe).
 *
 * Three.js (r182+) inyecta `#version 300 es` en ShaderMaterial: con `glslVersion: null`
 * se usa el shim `gl_FragColor` → `pc_fragColor`, que en algunos drivers falla.
 * Aquí usamos THREE.GLSL3 + `layout(location=0) out vec4 fragColor` + `toneMapped: false`.
 *
 * Diagnóstico (aislar): en EarthGlobe.tsx comentar temporalmente `<Atmosphere />`.
 *
 * Shader mínimo que compiló en este entorno (referencia):
 * - vertex: varying vec3 vNormal; vNormal = normalize(normal); gl_Position = ...
 * - fragment: precision highp float; varying vec3 vNormal;
 *   layout(location=0) out vec4 fragColor; fragColor = vec4(0.2, 0.4, 0.8, 0.1);
 * Luego se restauró: (A) rim con N·V, (B) sunSide con N·sun, (C) alpha, (D) rgb final.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';

export type AtmosphereProps = {
  radius: number;
  sunDirection: THREE.Vector3;
  segments?: number;
};

export function Atmosphere({ radius, sunDirection, segments = 64 }: AtmosphereProps) {
  const { camera } = useThree();
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const sun = useMemo(() => new THREE.Vector3(), []);

  const material = useMemo(() => {
    const uniforms = {
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      uCamPos: { value: new THREE.Vector3(0, 0, 5) },
    };

    const mat = new THREE.ShaderMaterial({
      name: 'GlobeAtmosphere',
      uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;

        void main() {
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir;
        uniform vec3 uCamPos;

        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;

        layout(location = 0) out highp vec4 fragColor;

        void main() {
          vec3 N = normalize(vWorldNormal);
          vec3 toCam = uCamPos - vWorldPos;
          float lenV = length(toCam);
          vec3 V = lenV > 1e-4 ? toCam / lenV : N;
          float ndv = clamp(dot(N, V), 0.0, 1.0);

          float rim = pow(max(1.0 - ndv, 0.0), 3.55);

          vec3 s = normalize(uSunDir);
          float nds = clamp(dot(N, s), -1.0, 1.0);
          float sunSide = mix(0.5, 1.0, nds * 0.5 + 0.5);

          vec3 base = vec3(0.42, 0.56, 0.74);
          float alpha = rim * 0.068 * sunSide;
          vec3 rgb = base * rim * 0.18 * sunSide;
          fragColor = vec4(rgb, alpha);
        }
      `,
      glslVersion: THREE.GLSL3,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    mat.name = 'GlobeAtmosphere';
    return mat;
  }, []);

  useLayoutEffect(() => {
    return () => material.dispose();
  }, [material]);

  useFrame(() => {
    camera.getWorldPosition(camPos);
    sun.copy(sunDirection).normalize();
    (material.uniforms.uCamPos.value as THREE.Vector3).copy(camPos);
    (material.uniforms.uSunDir.value as THREE.Vector3).copy(sun);
  });

  return (
    <mesh scale={radius} renderOrder={2}>
      <sphereGeometry args={[1, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
