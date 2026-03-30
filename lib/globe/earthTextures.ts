/**
 * Rutas alineadas con GlobeV2 (Three.js r182 planets CDN) para demo EarthGlobe.
 */

const PLANETS_R182 = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r182/examples/textures/planets';

export const earthDayMap = `${PLANETS_R182}/earth_day_4096.jpg`;

export const earthNightMap = '/textures/earth-night.jpg';

export const earthNormalMap = `${PLANETS_R182}/earth_normal_2048.jpg`;

export const earthRoughnessMap: string | null = null;

export const earthDisplacementMap: string | null = null;

export const cloudsMap = `${PLANETS_R182}/earth_clouds_1024.png`;

/** @deprecated Ya no se usa en EarthGlobe (material simplificado). */
export const earthSpecularHintRoughnessMap = `${PLANETS_R182}/earth_specular_2048.jpg`;

export const earthTexturePaths = {
  earthDayMap,
  earthNightMap,
  earthNormalMap,
  earthSpecularHintRoughnessMap,
  earthRoughnessMap,
  earthDisplacementMap,
  cloudsMap,
} as const;

export type EarthTexturePathKey = keyof typeof earthTexturePaths;
