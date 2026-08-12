/**
 * Única fuente de rutas y políticas de assets del globo (GlobeV2).
 * Objetivo: reemplazar texturas premium (2k/4k, luces, height) sin tocar la arquitectura.
 */

import * as THREE from 'three';
import { latLngToCartesianThetaLon } from '@/lib/globe-coords';

// ——— Base CDN (Three.js r182 planets) — reemplazar por `/public/...` o CDN propio si aplica ———

export const GLOBE_V2_TEXTURE_BASE =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r182/examples/textures/planets' as const;

export type GlobeV2TextureUrls = {
  day: string;
  normal: string;
  clouds: string;
  nightLights: string;
  heightMap: string | null;
};

/**
 * Construcción por capas (debug / QA): océano y tierra son esferas separadas; no mezclar en un solo shader.
 * `full` = pipeline completo (nubes, atmósfera, luces nocturnas, bits según `visualStage`).
 */
/** Solo para QA del OceanSphere: dirección de iluminación en el shader del mar. */
export type GlobeV2OceanSunDebug = 'utc' | 'front' | 'side';

export type GlobeV2LayerBuildStage =
  | 'ocean'
  /** Solo LandSphere (fondo negro del canvas) — QA máscara / oclusión. */
  | 'land'
  | 'ocean_land'
  | 'ocean_land_clouds'
  | 'ocean_land_clouds_atmosphere'
  | 'full';

/** Radio base del mar (OceanSphere). */
export const GLOBE_V2_OCEAN_RADIUS = 1;

/**
 * Tierra ligeramente por delante del océano (evita z-fighting).
 * Outset alto deja un “peldaño” negro en costas; 0.01 basta con máscara 4K suave.
 */
export const GLOBE_V2_LAND_OUTSET = 0.01;

export const GLOBE_V2_LAND_RADIUS = GLOBE_V2_OCEAN_RADIUS + GLOBE_V2_LAND_OUTSET;

/** Luces urbanas: misma esfera que la tierra + epsilon. */
export const GLOBE_V2_CITY_LIGHTS_SCALE = GLOBE_V2_LAND_RADIUS * 1.0008;

/** Nubes: por encima de `GLOBE_V2_LAND_RADIUS`; capa exterior fina. */
export const GLOBE_V2_CLOUD_ROOT_SCALE = 1.011;

/**
 * Halo atmosférico: por encima de la capa exterior de nubes (~1.016).
 * 1.08 ≈ anillo claramente fuera del limbo a cámara home (~3.6 R⊕).
 */
export const GLOBE_V2_ATMOSPHERE_SCALE = 1.08;

/**
 * Bits: por encima de la capa exterior de nubes.
 */
export const GLOBE_V2_BIT_SURFACE_RADIUS = GLOBE_V2_CLOUD_ROOT_SCALE + 0.007;

/**
 * Máscara agua (canal R): mar ≈ 1, tierra ≈ 0. Fuente: water mask 4K limpia (no specular Three 2K).
 * Banda smoothstep en fragmento; dilatación min-vecinos conserva islas.
 */
export const GLOBE_V2_LAND_MASK_SPEC_LOW = 0.38;
export const GLOBE_V2_LAND_MASK_SPEC_HIGH = 0.58;
/**
 * Centro de la banda soft (tierra→agua). Con mask limpia ~0.5–0.6.
 * Land alpha cae con smoothstep(EDGE0, EDGE1); ocean usa banda un poco más ancha hacia agua.
 */
export const GLOBE_V2_LAND_MASK_SPEC_DISCARD = 0.52;
/** Dilatación (min vecinos) en UV: ~2 px a 4K (1/4096≈0.00024). */
export const GLOBE_V2_LAND_MASK_DILATE_UV = 0.00055;
/** Banda soft tierra/agua (land alpha). */
export const GLOBE_V2_LAND_MASK_SOFT_LO = 0.4;
export const GLOBE_V2_LAND_MASK_SOFT_HI = 0.68;
/** Ocean: empieza a pintar agua un poco antes (solapa costa, evita hueco negro). */
export const GLOBE_V2_OCEAN_MASK_SOFT_LO = 0.32;
export const GLOBE_V2_OCEAN_MASK_SOFT_HI = 0.62;

/**
 * Heurística RGB del day (refuerzo; mask 4K limpia es la fuente principal).
 */
export const GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE0 = 0.08;
export const GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE1 = 0.46;
export const GLOBE_V2_LAND_MASK_DAY_OCEAN_RG = 0.72;
export const GLOBE_V2_LAND_MASK_DAY_OCEAN_GATE = 0.28;
/** Spec muy alto = mar abierto. */
export const GLOBE_V2_LAND_MASK_SPEC_OPEN_WATER = 0.82;

/**
 * Rutas activas. Para el salto visual:
 * - `clouds`: sustituir por PNG/JPEG 2048 o 4096 equirectangular con alpha correcta (misma convención UV).
 * - `nightLights`: mantener PNG 8-bit hasta tener EXR/HDR + pipeline float (ver GLOBE_V2_NIGHT_LIGHTS_PIPELINE_NOTE).
 * - `normal`: sustituir por earth_normal_4096.jpg (o equivalente) cuando exista; colorSpace = NoColorSpace (linear).
 * - `heightMap`: null = sin displacement; canal R lineal 2:1. Por defecto: specular del repo Three como proxy
 *   (tierra oscura / mar claro → volumen aproximado; sustituir por DEM si hace falta).
 */
export const GLOBE_V2_TEXTURE_URLS = {
  /** Day 8K local (Blue Marble). */
  day: '/8k_earth_daymap.jpg',
  normal: `${GLOBE_V2_TEXTURE_BASE}/earth_normal_2048.jpg`,
  /** PASO B: nubes 4K WebP con alpha real; carga diferida (idle) para no romper presupuesto ~8 MB. */
  clouds: '/textures/earth-clouds-4k.webp',
  nightLights: `${GLOBE_V2_TEXTURE_BASE}/earth_lights_2048.png`,
  /** PASO A: water mask 4K limpia (mar claro / tierra oscura), no specular Three 2K. */
  heightMap: '/textures/earth-water-mask-4k.jpg',
} as const satisfies GlobeV2TextureUrls;

/** Orden recomendado de reemplazo (mayor impacto / menor riesgo primero). */
export const GLOBE_V2_ASSET_REPLACEMENT_ORDER = [
  '1 · clouds: 2048 o 4096 con alpha (misma clave `clouds`)',
  '2 · nightLights: PNG mas grande o EXR (requiere DataTexture + shader si no es 8-bit)',
  '3 · normal: 4096 alineado al day map',
  '4 · heightMap: DEM suavizado + subir displacementScale con calibracion',
] as const;

export const GLOBE_V2_NIGHT_LIGHTS_PIPELINE_NOTE =
  'El overlay actual asume PNG/LDR en sRGB. EXR/HDR: cargar como float texture, tonemap en fragment y revisar blending aditivo.';

// ——— Valores congelados (no compensar falta de resolucion subiendo opacidad al azar) ———

/** Opacidad capa de nubes (alpha del WebP hace el corte; evitar “torta” blanca). */
export const GLOBE_V2_CLOUD_OPACITY_DAY = 0.58;
export const GLOBE_V2_CLOUD_OPACITY_NIGHT = 0.4;

/** Multiplicador opacidad esfera interior (velo ligero). */
export const GLOBE_V2_CLOUD_UNDERLAY_OPACITY_FACTOR = 0.28;

/** Capa de nubes adicional: radio = `GLOBE_V2_CLOUD_ROOT_SCALE` + delta (volumen leve). */
export const GLOBE_V2_CLOUD_OUTER_RADIUS_DELTA = 0.0048;

/** Opacidad de la capa exterior (× opacidad base día/noche). */
export const GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_DAY = 0.22;
export const GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_NIGHT = 0.15;

/** Desfase Y (rad) de la textura de nubes en la capa exterior. */
export const GLOBE_V2_CLOUD_OUTER_Y_ROT_RAD = 0.38;

/** Radio interior = `GLOBE_V2_CLOUD_ROOT_SCALE` − este delta (unidades de escena). */
export const GLOBE_V2_CLOUD_UNDERLAY_RADIUS_DELTA = 0.009;

/** Segmentos esfera nubes. */
export const GLOBE_V2_CLOUD_SPHERE_SEGMENTS = 112;

/**
 * Drift local de nubes (rad/s) respecto a la corteza: se mueven un poco más lento / deslizan.
 * Va en el group de nubes dentro de earthSpin (no toca GMST).
 */
export const GLOBE_V2_CLOUD_DRIFT_RAD_PER_SEC = 0.011;

/** Luces urbanas: muy discretas (documental, no mapa nocturno recargado). */
export const GLOBE_V2_CITY_LIGHTS_STRENGTH_DAY = 0.04;
export const GLOBE_V2_CITY_LIGHTS_STRENGTH_NIGHT = 0.3;

/** Normal / displacement: relieve perceptible pero no “inflado”. */
export const GLOBE_V2_NORMAL_SCALE_SURFACE = 1.38;
export const GLOBE_V2_NORMAL_SCALE_CITY_LIGHTS = 0.42;

/** Displacement radial (radio esfera 1). Bajo = superficie más serena. */
export const GLOBE_V2_DISPLACEMENT_SCALE_DEFAULT = 0.0028;

export function isGlobeV2ElevationActive(
  urls: Pick<GlobeV2TextureUrls, 'heightMap'>,
  displacementScale: number
): boolean {
  return urls.heightMap != null && displacementScale > 0;
}

export function createGlobeV2NeutralHeightTexture(): THREE.DataTexture {
  const u8 = new Uint8Array([128, 128, 128, 255]);
  const t = new THREE.DataTexture(u8, 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

export type GlobeV2AssetAuditEntry = {
  id: keyof GlobeV2TextureUrls | 'elevation';
  urlOrNote: string;
  nominalSize: string;
  format: string;
  compression: string;
  premiumVerdict: 'strong' | 'adequate' | 'limiting';
  note: string;
};

export const GLOBE_V2_ASSET_AUDIT: GlobeV2AssetAuditEntry[] = [
  {
    id: 'day',
    urlOrNote: GLOBE_V2_TEXTURE_URLS.day,
    nominalSize: '8192 × 4096 (2:1 equirectangular)',
    format: 'JPEG',
    compression: 'Lossy (~4.6 MB local /8k_earth_daymap.jpg)',
    premiumVerdict: 'strong',
    note: 'PASO 1: day 8K local; mipmaps + anisotropy vía setTextureQuality en GlobeV2.',
  },
  {
    id: 'normal',
    urlOrNote: GLOBE_V2_TEXTURE_URLS.normal,
    nominalSize: '2048 × 1024 (sustituir por 4k cuando exista)',
    format: 'JPEG',
    compression: 'Lossy',
    premiumVerdict: 'adequate',
    note: 'NoColorSpace + mipmaps; reemplazo 4k: misma clave `normal` en GLOBE_V2_TEXTURE_URLS.',
  },
  {
    id: 'clouds',
    urlOrNote: GLOBE_V2_TEXTURE_URLS.clouds,
    nominalSize: '4096 × 2048 WebP + alpha',
    format: 'WebP',
    compression: '~1.23 MB local; carga al idle (progressive)',
    premiumVerdict: 'strong',
    note: 'PASO B: alpha real; no bloquea primer paint del globo.',
  },
  {
    id: 'nightLights',
    urlOrNote: GLOBE_V2_TEXTURE_URLS.nightLights,
    nominalSize: '2048 × 1024',
    format: 'PNG',
    compression: '8-bit; empaquetado sin HDR',
    premiumVerdict: 'limiting',
    note: 'Reemplazo: cambiar solo `nightLights` aquí; ver GLOBE_V2_NIGHT_LIGHTS_PIPELINE_NOTE para HDR.',
  },
  {
    id: 'heightMap',
    urlOrNote: GLOBE_V2_TEXTURE_URLS.heightMap ?? 'null (neutral 0.5 → sin desplazamiento)',
    nominalSize: '4096 × 2048 water mask (mar claro / tierra oscura)',
    format: 'JPEG',
    compression: '~1.15 MB local /textures/earth-water-mask-4k.jpg',
    premiumVerdict: 'strong',
    note: 'PASO A: máscara limpia 4K; softstep costa + dilatación UV fina. También proxy de displacement.',
  },
  {
    id: 'elevation',
    urlOrNote: 'Ver heightMap + displacement en dayNightMaterial.ts / GlobeV2',
    nominalSize: '—',
    format: '—',
    compression: '—',
    premiumVerdict: 'adequate',
    note: 'Displacement suave en vértice; escala global GLOBE_V2_DISPLACEMENT_SCALE_DEFAULT o prop displacementScale.',
  },
];

export const GLOBE_V2_VISUAL_BOTTLENECKS_ORDERED: string[] = [
  'clouds_1024_vs_day_4096',
  'night_lights_2048_range_and_sampling',
  'normal_2048_vs_day_4096',
  'heightMap_off_until_asset',
];

export type GlobeV2CameraPreset =
  | 'pacificAmericas'
  | 'australiaSeAsia'
  | 'indiaCentralAsia'
  | 'africaEurope'
  | 'caribbeanNorthSA'
  | 'indonesia'
  | 'japan';

export type GlobeV2CameraPresetMeta = {
  lat: number;
  lon: number;
  title: string;
  /** Leyenda corta para /globo-validacion */
  validationLegend: string;
  /** Detalle opcional */
  validates: readonly string[];
};

export const GLOBE_V2_CAMERA_PRESETS: Record<GlobeV2CameraPreset, GlobeV2CameraPresetMeta> = {
  pacificAmericas: {
    lat: 10,
    lon: -135,
    title: 'Pacífico / América',
    validationLegend: 'Validar: océano',
    validates: [
      'Máscara mar/tierra y micro-onda procedural en agua',
      'Terminador y halo atmosférico',
    ],
  },
  australiaSeAsia: {
    lat: -22,
    lon: 125,
    title: 'Australia / Sudeste Asiático',
    validationLegend: 'Validar: nubes y mar',
    validates: [
      'Nubes: alpha y borde (mejor con mapa 2k/4k)',
      'Costas y lectura océano; specular solar en agua',
    ],
  },
  indiaCentralAsia: {
    lat: 22,
    lon: 72,
    title: 'India / Asia Central',
    validationLegend: 'Validar: relieve y terminador',
    validates: [
      'Relieve: normal + displacement si heightMap activo',
      'Terminador sobre continente; modo B/C para luces urbanas',
    ],
  },
  africaEurope: {
    lat: 8,
    lon: 18,
    title: 'África / Europa',
    validationLegend: 'Validar: city lights',
    validates: [
      'Overlay nocturno (B/C): densidad vs ruido del asset',
      'Terminador Atlántico/Mediterráneo según UTC',
    ],
  },
  caribbeanNorthSA: {
    lat: 14,
    lon: -68,
    title: 'Caribe / norte de Sudamérica',
    validationLegend: 'Costas finas, islas, plataforma continental',
    validates: [
      'Oclusión mar/tierra (modo 3): sin océano bajo continente',
      'Sin halo azul ni dientes en costa (ajustar solo DILATE/ DISCARD si hace falta)',
    ],
  },
  indonesia: {
    lat: -5,
    lon: 118,
    title: 'Indonesia (archipiélago)',
    validationLegend: 'Muchas islas finas, máscara spec exigente',
    validates: [
      'Islas pequeñas sin “agujeros”; sin z-fighting tierra/mar',
      'Descarte estable en borde (no bordes rotos)',
    ],
  },
  japan: {
    lat: 36,
    lon: 140,
    title: 'Japón (costa recortada)',
    validationLegend: 'Arco insular, mezcla mar interior / Pacífico',
    validates: [
      'Costa recortada sin mancha oceánica bajo tierra',
      'Hokkaido–Honshu–Shikoku–Kyushu legibles sin artefactos',
    ],
  },
};

export function applyGlobeV2CameraPreset(
  camera: THREE.PerspectiveCamera,
  controls: { target: THREE.Vector3; update: () => void },
  preset: GlobeV2CameraPreset,
  distance: number
): void {
  const { lat, lon } = GLOBE_V2_CAMERA_PRESETS[preset];
  const p = latLngToCartesianThetaLon(lat, lon, 1);
  const pos = new THREE.Vector3(p.x, p.y, p.z).normalize().multiplyScalar(distance);
  camera.position.copy(pos);
  controls.target.set(0, 0, 0);
  controls.update();
}
