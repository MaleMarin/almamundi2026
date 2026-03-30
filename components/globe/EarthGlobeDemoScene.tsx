'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EarthGlobe } from '@/components/globe/EarthGlobe';
import { MoonSatellite } from '@/components/globe/MoonSatellite';
import { SunLight } from '@/components/globe/SunLight';
import { useSolarDirection } from '@/hooks/useSolarDirection';

/**
 * Escena lista: Canvas, cámara, sol direccional según hora real al cargar,
 * globo con nubes y atmósfera, fondo oscuro, IBL suave para especular oceánico.
 */
export function EarthGlobeDemoScene() {
  const sunDir = useSolarDirection();

  return (
    <Canvas
      camera={{ position: [0, 0.1, 3.28], fov: 42, near: 0.1, far: 200 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#000000', 1);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.28;
      }}
      className="h-full w-full touch-none"
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#020203']} />
        <Environment preset="night" environmentIntensity={0.08} background={false} />
        <SunLight direction={sunDir} />
        <EarthGlobe sunDirection={sunDir} quality="high" rotationSpeed={0.048} />
        <MoonSatellite earthRadius={1} orbitSemiMajor={2.35} orbitPeriodSeconds={150} />
        <OrbitControls
          enablePan={false}
          minDistance={2.05}
          maxDistance={8.5}
          enableDamping
          dampingFactor={0.055}
          rotateSpeed={0.65}
        />
      </Suspense>
    </Canvas>
  );
}
