/**
 * Capa de nubes para el globo (earth-clouds.png).
 * Uso: MapFullPage y HomeMap llaman addGlobeCloudLayer(scene) al tener la escena.
 */

import * as THREE from 'three';

const CLOUD_OPACITY = 0.72;
const CLOUD_RADIUS = 1.004;
const CLOUD_SEGMENTS = 64;

/** Añade la capa de nubes a la escena. Cuando la textura carga, crea el mesh y llama onMesh(mesh) para rotarlo. */
export function addGlobeCloudLayer(
  scene: THREE.Scene,
  onMesh?: (mesh: THREE.Mesh) => void
): void {
  const cloudGeo = new THREE.SphereGeometry(CLOUD_RADIUS, CLOUD_SEGMENTS, CLOUD_SEGMENTS);
  const loader = new THREE.TextureLoader();

  loader.load(
    '/textures/earth-clouds.png',
    (cloudTex) => {
      try {
        (cloudTex as unknown as { colorSpace?: string }).colorSpace =
          (THREE as unknown as { SRGBColorSpace?: string }).SRGBColorSpace ?? (cloudTex as unknown as { colorSpace?: string }).colorSpace;
        const cloudMat = new THREE.MeshPhongMaterial({
          map: cloudTex,
          transparent: true,
          opacity: CLOUD_OPACITY,
          depthWrite: false,
          side: THREE.FrontSide,
        });
        const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        scene.add(cloudMesh);
        onMesh?.(cloudMesh);
      } catch (e) {
        console.warn('globeClouds: failed to create cloud mesh', e);
      }
    },
    undefined,
    () => {
      /* fallback silencioso si no carga la textura */
    }
  );
}
