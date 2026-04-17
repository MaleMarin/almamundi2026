/**
 * Campos de autor compartidos entre /subir y /subir/foto (tramos de edad, etc.).
 */

export const AGE_RANGE_OPTIONS = [
  { id: 'menor-18', label: 'Menor de 18' },
  { id: '18-29', label: '18–29' },
  { id: '30-39', label: '30–39' },
  { id: '40-49', label: '40–49' },
  { id: '50-59', label: '50–59' },
  { id: '60-69', label: '60–69' },
  { id: '70-mas', label: '70 o más' },
  { id: 'prefiero-no-decir', label: 'Prefiero no indicar' },
] as const;

export type AgeRangeId = (typeof AGE_RANGE_OPTIONS)[number]['id'];
