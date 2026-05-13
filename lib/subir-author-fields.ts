/**
 * Campos de autor compartidos entre /subir y /subir/foto (tramos de edad, etc.).
 * Tramos alineados con español neutro y el flujo de audio en /subir.
 */

export const AGE_RANGE_OPTIONS = [
  { id: 'menos-18', label: 'Menos de 18' },
  { id: '18-24', label: '18–24' },
  { id: '25-34', label: '25–34' },
  { id: '35-44', label: '35–44' },
  { id: '45-59', label: '45–59' },
  { id: '60-mas', label: '60 o más' },
  { id: 'prefiero-no-decir', label: 'Prefiero no decirlo' },
] as const;

export type AgeRangeId = (typeof AGE_RANGE_OPTIONS)[number]['id'];
