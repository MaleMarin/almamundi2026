'use client';

/**
 * GlobeV2 — globo R3F + drei (MeshPhysicalMaterial, IBL, nubes en capa).
 * `embedded`: encajar en la home (contenedor con altura, no viewport fijo).
 * Página completa: /globo-v2 sin `embedded`.
 */

import { Suspense, useLayoutEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GlobeBitsLayer, type GlobeBitMarker } from '@/components/globe/GlobeBitsLayer';

export type { GlobeBitMarker };

const TEX = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets';

export const GLOBE_V2_DEFAULT_TEXTURES = {
  day: `${TEX}/earth_atmos_2048.jpg`,
  normal: `${TEX}/earth_normal_2048.jpg`,
  clouds: `${TEX}/earth_clouds_1024.png`,
  nightLights: `${TEX}/earth_lights_2048.png`,
} as const;

export type GlobeV2TextureUrls = {
  day: string;
  normal: string;
  clouds: string;
  nightLights: string;
};

const EARTH_SEGMENTS = 384;
const CLOUD_SEGMENTS = 288;

function setTextureQuality(t: THREE.Texture, colorSpace: THREE.ColorSpace, anisotropy: number) {
  t.colorSpace = colorSpace;
  t.anisotropy = anisotropy;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
}

function EarthGroup({ urls }: { urls: GlobeV2TextureUrls }) {
  const { gl } = useThree();
  const [dayMap, normalMap, cloudMap, lightsMap] = useTexture([
    urls.day,
    urls.normal,
    urls.clouds,
    urls.nightLights,
  ]);

  useLayoutEffect(() => {
    const maxA = Math.min(16, gl.capabilities.getMaxAnisotropy?.() ?? 16);
    setTextureQuality(dayMap, THREE.SRGBColorSpace, maxA);
    setTextureQuality(normalMap, THREE.LinearSRGBColorSpace, maxA);
    setTextureQuality(cloudMap, THREE.SRGBColorSpace, maxA);
    setTextureQuality(lightsMap, THREE.SRGBColorSpace, maxA);
  }, [gl, dayMap, normalMap, cloudMap, lightsMap]);

  const cloudMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cloudMap,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        blending: THREE.NormalBlending,
        roughness: 1,
        metalness: 0,
      }),
    [cloudMap]
  );

  useLayoutEffect(() => {
    return () => {
      cloudMaterial.dispose();
    };
  }, [cloudMaterial]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, EARTH_SEGMENTS, EARTH_SEGMENTS]} />
        <meshPhysicalMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1.65, 1.65)}
          emissiveMap={lightsMap}
          emissive="#f0f4ff"
          emissiveIntensity={0.48}
          roughness={0.52}
          metalness={0.04}
          clearcoat={0.22}
          clearcoatRoughness={0.38}
          ior={1.48}
          envMapIntensity={0.55}
          toneMapped
        />
      </mesh>

      <mesh scale={1.0065} material={cloudMaterial}>
        <sphereGeometry args={[1, CLOUD_SEGMENTS, CLOUD_SEGMENTS]} />
      </mesh>
    </group>
  );
}

function GlobeScene({
  urls,
  embedded,
  bits,
  selectedBitId,
  onBitClick,
}: {
  urls: GlobeV2TextureUrls;
  embedded: boolean;
  bits: GlobeBitMarker[];
  selectedBitId: number | null;
  onBitClick?: (id: number) => void;
}) {
  const starsCount = embedded ? 7000 : 10000;
  const starsRadius = embedded ? 420 : 520;

  return (
    <>
      <Stars
        radius={starsRadius}
        depth={100}
        count={starsCount}
        factor={3}
        saturation={0}
        fade
        speed={0.32}
      />

      <Environment preset="night" environmentIntensity={embedded ? 0.3 : 0.35} background={false} />

      <hemisphereLight args={['#c8d4f0', '#050508', 0.14]} />
      <ambientLight intensity={0.04} color="#1a2030" />

      <directionalLight position={[12, 2.2, 5.5]} intensity={5.8} color="#fff6ed" />
      <directionalLight position={[-7, -1.2, -4]} intensity={0.55} color="#8cb4ff" />

      <EarthGroup urls={urls} />

      <GlobeBitsLayer bits={bits} selectedBitId={selectedBitId} onBitClick={onBitClick} />

      {/* Home embebida: sin zoom con rueda/trackpad para no bloquear el scroll de la página (OrbitControls usa preventDefault en wheel). */}
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        enableZoom={!embedded}
        minDistance={embedded ? 2.15 : 2.65}
        maxDistance={embedded ? 6.5 : 8}
        autoRotate
        autoRotateSpeed={embedded ? 0.36 : 0.32}
        enableDamping
        dampingFactor={0.065}
        rotateSpeed={0.62}
        zoomSpeed={0.72}
      />
    </>
  );
}

export type GlobeV2Props = {
  className?: string;
  textureUrls?: Partial<GlobeV2TextureUrls>;
  /** true = home (rellena el contenedor del mapa); false/omitido = pantalla completa tipo /globo-v2 */
  embedded?: boolean;
  /** Bits con lat/lon (grados), mismo criterio que BITS_DATA / HuellaPunto */
  bits?: GlobeBitMarker[];
  selectedBitId?: number | null;
  onBitClick?: (id: number) => void;
};

export default function GlobeV2({
  className,
  textureUrls,
  embedded = false,
  bits = [],
  selectedBitId = null,
  onBitClick,
}: GlobeV2Props) {
  const urls: GlobeV2TextureUrls = {
    day: textureUrls?.day ?? GLOBE_V2_DEFAULT_TEXTURES.day,
    normal: textureUrls?.normal ?? GLOBE_V2_DEFAULT_TEXTURES.normal,
    clouds: textureUrls?.clouds ?? GLOBE_V2_DEFAULT_TEXTURES.clouds,
    nightLights: textureUrls?.nightLights ?? GLOBE_V2_DEFAULT_TEXTURES.nightLights,
  };

  const dprMax =
    typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, embedded ? 2 : 2.25) : 2;

  /* Embebido: cámara más lejana → el planeta se ve algo más pequeño en el encuadre. */
  const camZ = embedded ? 3.22 : 3.35;

  const wrapperClass =
    className ??
    (embedded
      ? 'relative z-0 h-full w-full min-h-[50vh] flex-1 overflow-hidden bg-[#02040a] [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none'
      : 'fixed inset-0 z-0 h-[100dvh] w-full min-h-0 bg-[#02040a] [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none');

  return (
    <div className={wrapperClass}>
      <Canvas
        shadows={false}
        camera={{ position: [0, 0, camZ], fov: 42, near: 0.1, far: 280 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        className="h-full w-full"
        dpr={[1, dprMax]}
        onCreated={({ gl }) => {
          gl.setClearColor('#02040a', 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.98;
        }}
      >
        <Suspense fallback={null}>
          <GlobeScene
            urls={urls}
            embedded={embedded}
            bits={bits}
            selectedBitId={selectedBitId}
            onBitClick={onBitClick}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
