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
 * Tierra claramente por delante del océano en profundidad (evita z-fighting y “mar bajo el continente”).
 * El shader del océano también descarta UV de tierra (`uOceanMaskLand`); el offset físico refuerza el test de profundidad.
 */
export const GLOBE_V2_LAND_OUTSET = 0.02;

export const GLOBE_V2_LAND_RADIUS = GLOBE_V2_OCEAN_RADIUS + GLOBE_V2_LAND_OUTSET;

/** Luces urbanas: misma esfera que la tierra + epsilon. */
export const GLOBE_V2_CITY_LIGHTS_SCALE = GLOBE_V2_LAND_RADIUS * 1.0008;

/** Nubes: por encima de `GLOBE_V2_LAND_RADIUS` (1.02); capa exterior fina. */
export const GLOBE_V2_CLOUD_ROOT_SCALE = 1.021;

/** Halo atmosférico: anillo fino fuera de la corteza (intensidad baja en shader). */
export const GLOBE_V2_ATMOSPHERE_SCALE = 1.023;

/**
 * Bits: por encima de la capa exterior de nubes (no entre tierra ~1.02 y nubes ~1.021).
 * Evita que los marcadores queden “encajados” en el sandwich del globo.
 */
export const GLOBE_V2_BIT_SURFACE_RADIUS = GLOBE_V2_CLOUD_ROOT_SCALE + 0.007;

/**
 * Máscara tierra desde `earth_specular` (canal R): mar ≈ alto, tierra ≈ bajo.
 * Banda estrecha en vértice (relieve); descarte duro en fragmento tras dilatar tierra (min vecinos).
 */
export const GLOBE_V2_LAND_MASK_SPEC_LOW = 0.42;
export const GLOBE_V2_LAND_MASK_SPEC_HIGH = 0.58;
/**
 * Tras dilatación (min vecinos): spec por encima = mar → descartar tierra/océano complementario.
 * Valores demasiado bajos hacen que zonas continentales con spec alto (arena, nieve, ruido del PNG)
 * se clasifiquen como mar: la tierra hace discard y el océano pinta → “continentes transparentes”.
 * ~0.62–0.68 suele ser seguro con earth_specular de Three; bajar solo para costas muy duras.
 * 0.68 reduce “agujeros” negros en desiertos/nieve (spec alto) mal clasificados como mar.
 */
export const GLOBE_V2_LAND_MASK_SPEC_DISCARD = 0.68;
/** Dilatación tierra (min): ~1–2 px en 2k; un poco más de radio ayuda islas sin abrir mar interior. */
export const GLOBE_V2_LAND_MASK_DILATE_UV = 0.00115;

/**
 * Heurística en earth_day (RGB): océano suele dominar B frente a max(R,G); la tierra suele tener más R/G.
 * Complementa al specular para no clasificar desiertos/nieve como “mar” (continentes transparentes).
 */
export const GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE0 = 0.08;
export const GLOBE_V2_LAND_MASK_DAY_OCEAN_EDGE1 = 0.46;
export const GLOBE_V2_LAND_MASK_DAY_OCEAN_RG = 0.72;
/** Si dayOcean supera este valor y el spec dice agua → descartar tierra (agua real). */
export const GLOBE_V2_LAND_MASK_DAY_OCEAN_GATE = 0.4;
/** Spec muy alto = mar abierto aunque el day sea oscuro o ambiguo. */
export const GLOBE_V2_LAND_MASK_SPEC_OPEN_WATER = 0.88;

/**
 * Rutas activas. Para el salto visual:
 * - `clouds`: sustituir por PNG/JPEG 2048 o 4096 equirectangular con alpha correcta (misma convención UV).
 * - `nightLights`: mantener PNG 8-bit hasta tener EXR/HDR + pipeline float (ver GLOBE_V2_NIGHT_LIGHTS_PIPELINE_NOTE).
 * - `normal`: sustituir por earth_normal_4096.jpg (o equivalente) cuando exista; colorSpace = NoColorSpace (linear).
 * - `heightMap`: null = sin displacement; canal R lineal 2:1. Por defecto: specular del repo Three como proxy
 *   (tierra oscura / mar claro → volumen aproximado; sustituir por DEM si hace falta).
 */
export const GLOBE_V2_TEXTURE_URLS = {
  day: `${GLOBE_V2_TEXTURE_BASE}/earth_day_4096.jpg`,
  normal: `${GLOBE_V2_TEXTURE_BASE}/earth_normal_2048.jpg`,
  clouds: `${GLOBE_V2_TEXTURE_BASE}/earth_clouds_1024.png`,
  nightLights: `${GLOBE_V2_TEXTURE_BASE}/earth_lights_2048.png`,
  heightMap: `${GLOBE_V2_TEXTURE_BASE}/earth_specular_2048.jpg`,
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

/** Opacidad capa exterior de nubes (fina; evitar “torta” blanca). */
export const GLOBE_V2_CLOUD_OPACITY_DAY = 0.93;
export const GLOBE_V2_CLOUD_OPACITY_NIGHT = 0.62;

/** Multiplicador opacidad esfera interior (velo ligero sobre océano, sin duplicar peso). */
export const GLOBE_V2_CLOUD_UNDERLAY_OPACITY_FACTOR = 0.52;

/** Capa de nubes adicional: radio = `GLOBE_V2_CLOUD_ROOT_SCALE` + delta (volumen leve). */
export const GLOBE_V2_CLOUD_OUTER_RADIUS_DELTA = 0.0048;

/** Opacidad de la capa exterior (× opacidad base día/noche). */
export const GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_DAY = 0.34;
export const GLOBE_V2_CLOUD_OUTER_OPACITY_FACTOR_NIGHT = 0.24;

/** Desfase Y (rad) de la textura de nubes en la capa exterior (más lectura de nubosidad). */
export const GLOBE_V2_CLOUD_OUTER_Y_ROT_RAD = 0.38;

/** Radio interior = `GLOBE_V2_CLOUD_ROOT_SCALE` − este delta (unidades de escena). */
export const GLOBE_V2_CLOUD_UNDERLAY_RADIUS_DELTA = 0.009;

/** Segmentos esfera nubes. */
export const GLOBE_V2_CLOUD_SPHERE_SEGMENTS = 112;

/** Luces urbanas: muy discretas (documental, no mapa nocturno recargado). */
export const GLOBE_V2_CITY_LIGHTS_STRENGTH_DAY = 0.2;
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
    nominalSize: '4096 × 2048 (2:1 equirectangular)',
    format: 'JPEG',
    compression: 'Lossy (calidad depende del export en el repo Three)',
    premiumVerdict: 'strong',
    note: 'Base visual sólida para Blue Marble a distancia de órbita típica.',
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
    nominalSize: '1024 × 512 → preparado para 2k/4k',
    format: 'PNG',
    compression: '8-bit + alpha; mismo layout UV que el day map',
    premiumVerdict: 'limiting',
    note: 'Pipeline listo: anisotropia max, alpha en map, opacidad fija en GLOBE_V2_CLOUD_OPACITY_*.',
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
    nominalSize: '—',
    format: 'PNG/TIFF/JPEG linear R',
    compression: 'según archivo',
    premiumVerdict: 'limiting',
    note: 'Pipeline: uHeightTex + uDispScale en vértice (tierra + luces). Centro 0.5 = plano.',
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
