/** Ficha de cada foto del flujo de envío. Sin datos personales. */

export const PHOTO_NAME_MAX = 80;
export const PHOTO_PLACE_MAX = 80;
export const PHOTO_YEAR_MIN = 1850;
export const PHOTO_DECADE_MIN = 1900;
export const PHOTO_DECADE_MAX = 2020;

export const PHOTO_DECADE_YEARS = Array.from(
  { length: (PHOTO_DECADE_MAX - PHOTO_DECADE_MIN) / 10 + 1 },
  (_, i) => PHOTO_DECADE_MIN + i * 10
);

export type PhotoFichaIssue = 'nombre' | 'anio' | 'anio-invalido' | 'decada' | 'lugar';

export type PhotoFichaFields = {
  titulo: string;
  anio: string;
  anioDesconocido: boolean;
  decada: string;
  lugar: string;
};

export function currentPhotoYear(now = new Date()): number {
  return now.getFullYear();
}

export function isPhotoDecade(value: string): boolean {
  if (!/^\d{4}$/.test(value)) return false;
  const year = Number(value);
  return year >= PHOTO_DECADE_MIN && year <= PHOTO_DECADE_MAX && year % 10 === 0;
}

export function photoFichaIssue(
  photo: PhotoFichaFields,
  maxYear = currentPhotoYear()
): PhotoFichaIssue | null {
  const nombre = photo.titulo.trim();
  if (!nombre || nombre.length > PHOTO_NAME_MAX) return 'nombre';
  if (photo.anioDesconocido) {
    if (!isPhotoDecade(photo.decada.trim())) return 'decada';
  } else {
    const raw = photo.anio.trim();
    if (!/^\d{4}$/.test(raw)) return 'anio';
    const year = Number(raw);
    if (year < PHOTO_YEAR_MIN || year > maxYear) return 'anio-invalido';
  }
  const lugar = photo.lugar.trim();
  if (!lugar || lugar.length > PHOTO_PLACE_MAX) return 'lugar';
  return null;
}
