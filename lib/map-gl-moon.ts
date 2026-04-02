/**
 * Luna decorativa en la escena de react-globe.gl (radio terrestre del motor = 100).
 * Misma textura que GlobeV2 / MoonSatellite.
 */
import * as THREE from 'three';
import { GLOBE_V2_TEXTURE_BASE } from '@/lib/globe/globe-v2-assets';

/** Debe coincidir con `GLOBE_RADIUS` interno de globe.gl (v2). */
export const GLOBE_GL_EARTH_RADIUS = 100;

/** Ratio Luna/Tierra (~0,273), alineado con MoonSatellite. */
const MOON_RADIUS_RATIO = 0.2725;

/**
 * Escala del disco lunar (solo visual): en globe.gl la cámara suele estar a ~(1+2,35)R⊕;
 * un poco más grande que el físico ayuda a leerla en pantalla.
 */
const MOON_DISC_SCALE = 1.35;

const MOON_MAP_URL = `${GLOBE_V2_TEXTURE_BASE}/moon_1024.jpg`;

const ROOT_NAME = 'AM_GLOBEGL_MOON_ROOT';
const MESH_NAME = 'AM_GLOBEGL_MOON_MESH';

/**
 * Semieje mayor en unidades globe.gl (R⊕ = 100).
 *
 * **Importante:** en globe.gl `pointOfView.altitude` es distancia al centro en radios − 1
 * (p. ej. 2,35 → ~3,35 R⊕ ≈ 335). Si la Luna orbita a ~2,35 R⊕ queda **detrás del disco
 * terrestre** casi medio ciclo y parece “desaparecida”. Órbita ~1,75–1,9 R⊕ deja la Luna
 * entre el horizonte del globo y la cámara → visible como en la sesión con GlobeV2.
 */
const ORBIT_SEMI_MAJOR = 1.82 * GLOBE_GL_EARTH_RADIUS;

/** Inclinación del plano orbital (rad): evita que quede pegada al ecuador y se pierda tras el globo. */
const ORBIT_INCLINATION_RAD = 0.22;

/** Segundos por órbita (solo lectura visual, como en EarthGlobeDemoScene). */
const ORBIT_PERIOD_SEC = 150;

export function ensureGlobeGlMoon(scene: THREE.Scene): void {
  if (scene.getObjectByName(ROOT_NAME)) return;

  const root = new THREE.Group();
  root.name = ROOT_NAME;
  root.userData.orbitRadius = ORBIT_SEMI_MAJOR;
  /** Fase inicial: encuadre Pacífico (~lng −142) suele dejar la Luna hacia un lateral. */
  root.userData.angle = Math.PI * 0.78;

  const moonR = GLOBE_GL_EARTH_RADIUS * MOON_RADIUS_RATIO * MOON_DISC_SCALE;
  const geom = new THREE.SphereGeometry(moonR, 40, 40);
  const mat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 8,
    specular: new THREE.Color(0x222222),
    emissive: new THREE.Color(0x0a0a12),
    emissiveIntensity: 0.35,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = MESH_NAME;
  mesh.renderOrder = 20;
  root.add(mesh);
  scene.add(root);

  const loader = new THREE.TextureLoader();
  loader.load(
    MOON_MAP_URL,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      mat.map = tex;
      mat.needsUpdate = true;
    },
    undefined,
    () => {
      /* textura opcional: gris si falla CDN */
    }
  );
}

export function updateGlobeGlMoon(scene: THREE.Scene, deltaSeconds: number): void {
  const root = scene.getObjectByName(ROOT_NAME) as THREE.Group | null;
  if (!root?.userData) return;

  const r = root.userData.orbitRadius as number;
  let a = (root.userData.angle as number) + deltaSeconds * ((Math.PI * 2) / ORBIT_PERIOD_SEC);
  if (!Number.isFinite(a)) a = 0;
  root.userData.angle = a;

  const cosI = Math.cos(ORBIT_INCLINATION_RAD);
  const sinI = Math.sin(ORBIT_INCLINATION_RAD);
  const x = -Math.sin(a) * r * cosI;
  const y = Math.sin(a) * r * sinI;
  const z = -Math.cos(a) * r;
  root.position.set(x, y, z);
  root.up.set(0, 1, 0);
  root.lookAt(0, 0, 0);

  const mesh = root.getObjectByName(MESH_NAME) as THREE.Mesh | undefined;
  if (mesh) {
    /* Giro propio síncrono con la órbita (bloqueo mareal + lectura del eje), coherente con MoonSatellite. */
    mesh.rotation.y -= deltaSeconds * ((Math.PI * 2) / ORBIT_PERIOD_SEC);
  }
}
