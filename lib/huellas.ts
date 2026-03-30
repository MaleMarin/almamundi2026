/**
 * Huellas: datos inesperados del mundo para AlmaMundi.
 * Carga desde /huellas2.json (puntos con lat, lon, titulo, historia, categoria, color).
 */

export type HuellaPunto = {
  id: number;
  lugar: string;
  pais: string;
  lat: number;
  lon: number;
  categoria: string;
  color: string;
  titulo: string;
  historia: string;
  /** Opcional: enlace editorial verificable (https). Se muestra en el panel del Bit. */
  fuenteUrl?: string;
};

export type HuellaCategoria = {
  nombre: string;
  color: string;
  descripcion: string;
};

export type HuellasData = {
  version: string;
  nombre: string;
  descripcion: string;
  puntos: HuellaPunto[];
  categorias: HuellaCategoria[];
};

const HUELLAS_PATH = '/huellas2.json';
let cached: HuellasData | null = null;

function getHuellasUrl(): string {
  if (typeof window !== 'undefined') return `${window.location.origin}${HUELLAS_PATH}`;
  return HUELLAS_PATH;
}

export async function fetchHuellas(): Promise<HuellasData> {
  if (cached) return cached;
  const url = getHuellasUrl();
  const res = await fetch(url, { cache: 'default' });
  if (!res.ok) throw new Error(`Huellas: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as HuellasData;
  if (data?.puntos && Array.isArray(data.puntos)) {
    cached = data;
    return data;
  }
  throw new Error('Huellas: invalid format');
}

/** Convierte hex a rgba con alpha para puntos suaves en el globo */
export function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return `rgba(255,255,255,${alpha})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`;
}
