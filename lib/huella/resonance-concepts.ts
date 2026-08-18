/**
 * Paleta de resonancia visual: 100 conceptos → un color fijo.
 * El relato no inventa hues: solo elige de esta lista.
 */

export const RESONANCE_BG = '#F7F4EE';
export const RESONANCE_CANVAS_W = 1360;
export const RESONANCE_STRIPE_MIN_PX = 8;
export const RESONANCE_STRIPE_MAX_PX = 60;

export type ResonanceConcept = {
  id: number;
  name: string;
  hex: string;
};

export const RESONANCE_CONCEPTS: readonly ResonanceConcept[] = [
  { id: 1, name: 'Amor', hex: '#E24B4A' },
  { id: 2, name: 'Ternura', hex: '#F0997B' },
  { id: 3, name: 'Alegría', hex: '#EF9F27' },
  { id: 4, name: 'Esperanza', hex: '#5DCAA5' },
  { id: 5, name: 'Calma', hex: '#B5D4F4' },
  { id: 6, name: 'Gratitud', hex: '#FAC775' },
  { id: 7, name: 'Orgullo', hex: '#993C1D' },
  { id: 8, name: 'Asombro', hex: '#7F77DD' },
  { id: 9, name: 'Deseo', hex: '#D4537E' },
  { id: 10, name: 'Alivio', hex: '#C0DD97' },
  { id: 11, name: 'Nostalgia', hex: '#8C6BA8' },
  { id: 12, name: 'Tristeza', hex: '#3F6491' },
  { id: 13, name: 'Duelo', hex: '#26215C' },
  { id: 14, name: 'Rabia', hex: '#A32D2D' },
  { id: 15, name: 'Miedo', hex: '#5F6B78' },
  { id: 16, name: 'Ansiedad', hex: '#8A8FA3' },
  { id: 17, name: 'Culpa', hex: '#6B5847' },
  { id: 18, name: 'Vergüenza', hex: '#9A6B72' },
  { id: 19, name: 'Soledad', hex: '#4A5A6E' },
  { id: 20, name: 'Desespero', hex: '#2C2C2A' },
  { id: 21, name: 'Familia', hex: '#D85A30' },
  { id: 22, name: 'Madre', hex: '#ED93B1' },
  { id: 23, name: 'Padre', hex: '#185FA5' },
  { id: 24, name: 'Hijos', hex: '#FFD166' },
  { id: 25, name: 'Hermanos', hex: '#F0B67F' },
  { id: 26, name: 'Abuelos', hex: '#B49A7A' },
  { id: 27, name: 'Ancestros', hex: '#7A5C3E' },
  { id: 28, name: 'Amistad', hex: '#639922' },
  { id: 29, name: 'Pareja', hex: '#C94F7C' },
  { id: 30, name: 'Amor perdido', hex: '#7D3A54' },
  { id: 31, name: 'Comunidad', hex: '#1D9E75' },
  { id: 32, name: 'Vecinos', hex: '#A8B87C' },
  { id: 33, name: 'Maestros', hex: '#4E7CA1' },
  { id: 34, name: 'Extraños', hex: '#B4B2A9' },
  { id: 35, name: 'Nacimiento', hex: '#FDE8C8' },
  { id: 36, name: 'Infancia', hex: '#F7C948' },
  { id: 37, name: 'Adolescencia', hex: '#E8735A' },
  { id: 38, name: 'Juventud', hex: '#F26B4E' },
  { id: 39, name: 'Adultez', hex: '#8A6A4F' },
  { id: 40, name: 'Vejez', hex: '#9C9384' },
  { id: 41, name: 'Muerte', hex: '#1A1A2E' },
  { id: 42, name: 'Embarazo', hex: '#F4B6C2' },
  { id: 43, name: 'Primer amor', hex: '#FF8FA3' },
  { id: 44, name: 'Independencia', hex: '#2A9D8F' },
  { id: 45, name: 'Crecer', hex: '#8FBC5A' },
  { id: 46, name: 'Envejecer', hex: '#A69581' },
  { id: 47, name: 'Viaje', hex: '#3AA6B9' },
  { id: 48, name: 'Migración', hex: '#1B6CA8' },
  { id: 49, name: 'Exilio', hex: '#274060' },
  { id: 50, name: 'Regreso', hex: '#7BB661' },
  { id: 51, name: 'Frontera', hex: '#6E4B3A' },
  { id: 52, name: 'Casa', hex: '#C97B4A' },
  { id: 53, name: 'Barrio', hex: '#D9A05B' },
  { id: 54, name: 'Ciudad', hex: '#6C7A89' },
  { id: 55, name: 'Campo', hex: '#7FA650' },
  { id: 56, name: 'Pueblo', hex: '#C4A265' },
  { id: 57, name: 'Camino', hex: '#B08968' },
  { id: 58, name: 'Despedida', hex: '#5A6B8C' },
  { id: 59, name: 'Sol', hex: '#FFB703' },
  { id: 60, name: 'Luna', hex: '#DCE3EF' },
  { id: 61, name: 'Estrellas', hex: '#C7D3F0' },
  { id: 62, name: 'Amanecer', hex: '#FFCBA4' },
  { id: 63, name: 'Atardecer', hex: '#F4845F' },
  { id: 64, name: 'Noche', hex: '#1D2951' },
  { id: 65, name: 'Mar', hex: '#0F7FA8' },
  { id: 66, name: 'Playa', hex: '#F2D7A0' },
  { id: 67, name: 'Río', hex: '#4FA3C4' },
  { id: 68, name: 'Montaña', hex: '#6B7F6E' },
  { id: 69, name: 'Bosque', hex: '#2F5D3A' },
  { id: 70, name: 'Desierto', hex: '#DDB892' },
  { id: 71, name: 'Lluvia', hex: '#7C9EB2' },
  { id: 72, name: 'Nieve', hex: '#EDF2F7' },
  { id: 73, name: 'Viento', hex: '#A9C0CC' },
  { id: 74, name: 'Fuego', hex: '#E85D04' },
  { id: 75, name: 'Tierra', hex: '#8B5E34' },
  { id: 76, name: 'Trabajo', hex: '#5C6B73' },
  { id: 77, name: 'Oficio', hex: '#9C6644' },
  { id: 78, name: 'Estudios', hex: '#3D5A80' },
  { id: 79, name: 'Escuela', hex: '#F6BD60' },
  { id: 80, name: 'Universidad', hex: '#345995' },
  { id: 81, name: 'Dinero', hex: '#84A98C' },
  { id: 82, name: 'Pobreza', hex: '#6D5D4B' },
  { id: 83, name: 'Desempleo', hex: '#7A7466' },
  { id: 84, name: 'Jubilación', hex: '#B8A88A' },
  { id: 85, name: 'Sueño / proyecto', hex: '#F5CB5C' },
  { id: 86, name: 'Fracaso', hex: '#63514A' },
  { id: 87, name: 'Libros', hex: '#8E6C88' },
  { id: 88, name: 'Cine', hex: '#3A3A52' },
  { id: 89, name: 'Música', hex: '#9B5DE5' },
  { id: 90, name: 'Danza', hex: '#F15BB5' },
  { id: 91, name: 'Teatro', hex: '#A4243B' },
  { id: 92, name: 'Pintura', hex: '#F4A259' },
  { id: 93, name: 'Fotografía', hex: '#6A7B8C' },
  { id: 94, name: 'Cocina', hex: '#E07A5F' },
  { id: 95, name: 'Deporte', hex: '#2D6A4F' },
  { id: 96, name: 'Fiesta', hex: '#FF6B6B' },
  { id: 97, name: 'Carnaval', hex: '#FF9F1C' },
  { id: 98, name: 'Fe', hex: '#D6C7A1' },
  { id: 99, name: 'Idioma', hex: '#5D737E' },
  { id: 100, name: 'Tradición', hex: '#A47148' },
] as const;

const BY_ID = new Map(RESONANCE_CONCEPTS.map((c) => [c.id, c]));

export function resonanceConceptById(id: number): ResonanceConcept | undefined {
  return BY_ID.get(id);
}
