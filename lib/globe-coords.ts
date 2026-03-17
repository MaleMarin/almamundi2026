/**
 * Conversión lat/lng (grados) a coordenadas 3D en la esfera.
 * - Y = norte (lat +90 → y = +R)
 * - Dos convenciones según dónde esté el meridiano 0 en la textura.
 */

/** Greenwich en +Z. Para proyección 2D / algunos globos. */
export function latLngToCartesian(
  latDeg: number,
  lonDeg: number,
  radius: number
): { x: number; y: number; z: number } {
  const latRad = (latDeg * Math.PI) / 180;
  const lonRad = (lonDeg * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);
  const cosLon = Math.cos(lonRad);
  const sinLon = Math.sin(lonRad);
  return {
    x: radius * cosLat * sinLon,
    y: radius * sinLat,
    z: radius * cosLat * cosLon,
  };
}

/**
 * Esfera estándar (equirectangular): theta=lon, phi=lat.
 * Greenwich (lon 0) en +X, norte (lat 90) en +Y.
 */
export function latLngToCartesianGlobe(
  latDeg: number,
  lonDeg: number,
  radius: number
): { x: number; y: number; z: number } {
  const phi = (latDeg * Math.PI) / 180;
  const theta = (lonDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  return {
    x: radius * cosPhi * cosTheta,
    y: radius * sinPhi,
    z: radius * cosPhi * sinTheta,
  };
}

/**
 * Misma convención que Three.js SphereGeometry (y texturas equirectangular típicas):
 * phi = 0 en polo norte, theta = 0 en lon -180° (borde izquierdo de la textura).
 * x = -R·sin(phi)·cos(theta), y = R·cos(phi), z = R·sin(phi)·sin(theta).
 * En el mesh con rotation.x=π usar (x, -y, z) para que el norte quede arriba.
 */
export function latLngToCartesianThreeJS(
  latDeg: number,
  lonDeg: number,
  radius: number
): { x: number; y: number; z: number } {
  const phi = ((90 - latDeg) * Math.PI) / 180;
  const theta = ((lonDeg + 180) * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  return {
    x: -radius * sinPhi * cosTheta,
    y: radius * cosPhi,
    z: radius * sinPhi * sinTheta,
  };
}

/**
 * Misma convención que three-globe (polar2Cartesian en la librería):
 * phi = (90−lat)°, theta = (90−lng)°, x = R·sin(φ)·cos(θ), y = R·cos(φ), z = R·sin(φ)·sin(θ).
 * Así los bits coinciden exactamente con la textura del globo.
 * Para mesh con rotation.x=π usar (x, -y, z).
 */
export function latLngToCartesianThreeGlobe(
  latDeg: number,
  lonDeg: number,
  radius: number
): { x: number; y: number; z: number } {
  const phi = ((90 - latDeg) * Math.PI) / 180;
  const theta = ((90 - lonDeg) * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  return {
    x: radius * sinPhi * cosTheta,
    y: radius * cosPhi,
    z: radius * sinPhi * sinTheta,
  };
}

/**
 * Convierte lat/lon a 3D en la esfera para que los bits coincidan con la textura del globo.
 * La textura equirectangular de react-globe suele tener el borde (u=0) en lon=180°.
 * theta = (lon + 180)° en rad → theta=0 en lon=-180. Mesh con rotation.x=π → (x, -y, z).
 */
export function latLngToCartesianThetaLon(
  latDeg: number,
  lonDeg: number,
  radius: number
): { x: number; y: number; z: number } {
  const phi = ((90 - latDeg) * Math.PI) / 180;
  const theta = ((lonDeg + 180) * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  return {
    x: -radius * sinPhi * cosTheta,
    y: radius * cosPhi,
    z: radius * sinPhi * sinTheta,
  };
}

/**
 * Convención tipo d3-geo: theta = lon (rad), Greenwich en +X.
 * Para mesh con rotation.x=π usar (x, -y, z).
 */
export function latLngToCartesianGlobeTexture(
  latDeg: number,
  lonDeg: number,
  radius: number
): { x: number; y: number; z: number } {
  const phi = (latDeg * Math.PI) / 180;
  const theta = (lonDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  return {
    x: radius * cosPhi * cosTheta,
    y: radius * sinPhi,
    z: radius * cosPhi * sinTheta,
  };
}
