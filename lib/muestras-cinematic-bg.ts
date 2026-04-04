/**
 * Fondo del recorrido cinematográfico (/muestras).
 *
 * En `public` hay dos PNG parecidos:
 * - `muestra fondo.png` → solo barras / degradado (correcto como capa detrás del WebGL).
 * - `muestar con glass.png` → mockup con círculo de vidrio ya dibujado; no usar de fondo
 *   completo (duplicaría la esfera 3D y el panel redondo).
 *
 * El espacio en el nombre se codifica en la URL.
 */
export const MUESTRAS_CINEMATIC_BACKDROP_SRC = '/muestra%20fondo.png';
