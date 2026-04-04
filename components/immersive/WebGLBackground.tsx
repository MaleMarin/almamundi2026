'use client';

import {
  Environment,
  Float,
  Lightformer,
  Outlines,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';

export type LabMouseRef = MutableRefObject<{ x: number; y: number }>;

type WebGLBackgroundProps = {
  progressRef: MutableRefObject<number>;
  mouseRef?: LabMouseRef;
  /** Si es false, no se monta el canvas (solo fondo detrás; p. ej. muestras cinematográficas sin esfera). */
  showSphere?: boolean;
};

/** Vidrio naranja (sin texto en el interior). */
const SPHERE_GLASS_TINT = '#ff6a14';
const SPHERE_ATTENUATION = '#ff7a33';

function GlassSphereScene({
  progressRef,
  mouseRef,
}: {
  progressRef: MutableRefObject<number>;
  mouseRef: LabMouseRef;
}) {
  const groupRef = useRef<Group>(null);
  const glassRef = useRef<Mesh>(null);

  useFrame(() => {
    const g = groupRef.current;
    const glass = glassRef.current;
    if (!g) return;
    const p = progressRef.current;
    const mx = mouseRef.current.x * 0.14;
    const my = mouseRef.current.y * 0.1;
    const t = performance.now() * 0.00012;
    g.rotation.y = t * 0.22 + p * Math.PI * 0.85 + mx;
    g.rotation.x = Math.sin(t * 0.45) * 0.06 + p * 0.16 + my * 0.18;
    g.position.z = -0.05 + p * 0.26;
    g.position.x = -0.38;
    if (glass) {
      glass.rotation.y += 0.0012;
    }
  });

  return (
    <>
      <CameraRig mouseRef={mouseRef} />
      <ambientLight intensity={0.08} color="#331808" />
      <directionalLight
        position={[4, 6, 8]}
        intensity={0.42}
        color="#ffd4a8"
        castShadow={false}
      />
      <pointLight position={[2, 1, 5]} intensity={0.55} color="#ff7a2e" distance={25} />

      <group ref={groupRef}>
        <Float speed={0.4} rotationIntensity={0.08} floatIntensity={0.12}>
          <mesh ref={glassRef} scale={1.14} castShadow={false} renderOrder={0}>
            <sphereGeometry args={[1, 80, 80]} />
            <meshPhysicalMaterial
              color={SPHERE_GLASS_TINT}
              transmission={0.82}
              thickness={0.48}
              roughness={0.38}
              metalness={0}
              ior={1.48}
              clearcoat={0.5}
              clearcoatRoughness={0.2}
              envMapIntensity={0.72}
              attenuationDistance={0.72}
              attenuationColor={SPHERE_ATTENUATION}
              transparent
              side={THREE.FrontSide}
            />
            <Outlines
              thickness={0.025}
              color="#fff4e8"
              opacity={0.9}
              transparent
              screenspace
              toneMapped={false}
            />
          </mesh>
        </Float>
      </group>
    </>
  );
}

function CameraRig({ mouseRef }: { mouseRef: LabMouseRef }) {
  const cur = useRef({ x: 0, y: 0 });
  useFrame(({ camera }) => {
    const tx = mouseRef.current.x * 0.22;
    const ty = mouseRef.current.y * 0.16;
    cur.current.x += (tx - cur.current.x) * 0.038;
    cur.current.y += (ty - cur.current.y) * 0.038;
    camera.position.x = cur.current.x + 0.15;
    camera.position.y = cur.current.y;
    camera.lookAt(-0.2, 0, 0);
  });
  return null;
}

function ProceduralEnvGlass() {
  return (
    <Environment
      frames={1}
      resolution={256}
      background={false}
      environmentIntensity={0.45}
    >
      <group rotation={[0, 0.2, 0]}>
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[0, 4, -8]}
          scale={[20, 0.8, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          color="#ff9a4a"
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          position={[-6, -2, 2]}
          scale={[3, 10, 1]}
          rotation={[0, Math.PI / 2, 0]}
          color="#ffb366"
        />
        <Lightformer
          form="rect"
          intensity={0.85}
          position={[5, -3, 0]}
          scale={[8, 6, 1]}
          rotation={[0, -Math.PI / 2.2, 0]}
          color="#ff9444"
        />
        <Lightformer
          form="rect"
          intensity={0.4}
          position={[0, 0, 5]}
          scale={[16, 12, 1]}
          color="#140808"
        />
      </group>
    </Environment>
  );
}

function Scene({
  progressRef,
  mouseRef,
}: {
  progressRef: MutableRefObject<number>;
  mouseRef: LabMouseRef;
}) {
  return (
    <>
      <ProceduralEnvGlass />
      <GlassSphereScene progressRef={progressRef} mouseRef={mouseRef} />
    </>
  );
}

export default function WebGLBackground({
  progressRef,
  mouseRef,
  showSphere = true,
}: WebGLBackgroundProps) {
  const internalMouse = useRef({ x: 0, y: 0 });
  const m = mouseRef ?? internalMouse;

  useEffect(() => {
    if (mouseRef) return;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = -((e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
      internalMouse.current = { x: nx, y: ny };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseRef]);

  if (!showSphere) {
    return null;
  }

  return (
    <div className="immersive-webgl-root immersive-webgl-root--glass" aria-hidden>
      <Canvas
        camera={{ position: [0.35, 0, 3.75], fov: 40, near: 0.1, far: 80 }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Scene progressRef={progressRef} mouseRef={m} />
      </Canvas>
    </div>
  );
}
